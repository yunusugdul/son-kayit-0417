import express from 'express';
import { createServer } from 'node:http';
import { randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Server } from 'socket.io';
import {
  MAPS, MAP_IDS, WEAPONS, TICK_RATE, SNAP_RATE, MAX_TEAM, MAX_SCORE, BUY_TIME,
  ROUND_TIME, BOMB_TIME, INTERMISSION, SPEED, SPRINT_SPEED, clamp, finite,
  moveWithCollision, wallDistance, playerIntersection, distance2, canPlant, sanitizeName
} from '../shared/rules.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { maxHttpBufferSize: 20000, transports: ['websocket','polling'] });
const rooms = new Map();
const PORT = Number(process.env.PORT) || 3000;
app.get('/health', (_, res) => res.json({ ok:true, rooms:rooms.size, online:io.engine.clientsCount }));

if (process.env.NODE_ENV === 'development') {
  const { createServer: createVite } = await import('vite');
  const vite = await createVite({ root, configFile:resolve(root,'vite.config.js'), server:{ middlewareMode:true, hmr:{server:httpServer} }, appType:'spa' });
  app.use(vite.middlewares);
} else {
  app.use(express.static(resolve(root,'dist'), { maxAge:'1h' }));
  app.get('*', (_, res) => res.sendFile(resolve(root,'dist/index.html')));
}

const now = () => Date.now();
const emitRoom = r => io.to(r.code).emit('room', {
  code:r.code, host:r.host, map:r.map, phase:r.phase, round:r.round, scores:r.scores,
  deadline:r.deadline, winner:r.winner || null,
  players:[...r.players.values()].map(p=>({id:p.id,name:p.name,team:p.team,skin:p.skin,kills:p.kills,deaths:p.deaths,ping:p.ping}))
});
const say = (r,msg) => io.to(r.code).emit('notice',msg);
function makeCode() {
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for(let tries=0;tries<100;tries++) {
    let code='';
    for(let j=0;j<5;j++) code+=alphabet[randomInt(alphabet.length)];
    if(!rooms.has(code))return code;
  }
  throw new Error('No room codes left');
}
function newInventory() {
  return { pistol:{ammo:WEAPONS.pistol.clip,reserve:WEAPONS.pistol.reserve},knife:{ammo:1,reserve:0} };
}
function createPlayer(socket,name,team,skin){
  return {
    id:socket.id,name:sanitizeName(name),team,skin:clamp(Math.floor(finite(skin)),0,2),
    x:0,z:0,y:0,vy:0,yaw:0,pitch:0,hp:100,armor:0,alive:true,money:800,kills:0,deaths:0,ping:0,
    inv:newInventory(),active:'pistol',nextFire:0,reloadUntil:0,plantProgress:0,action:'',
    input:{f:0,s:0,j:false,c:false,shift:false,fire:false,use:false},
    lastInput:0,lastChat:0,lastJump:false
  };
}
const countTeam=(r,team)=>[...r.players.values()].filter(p=>p.team===team).length;
function chooseTeam(r,desired) {
  const a=countTeam(r,'A'), b=countTeam(r,'B');
  if(desired==='A' && a<MAX_TEAM)return 'A';
  if(desired==='B' && b<MAX_TEAM)return 'B';
  if(a<=b && a<MAX_TEAM)return 'A';
  if(b<MAX_TEAM)return 'B';
  return null;
}
function getRoom(socket){return rooms.get(socket.data.code);}
function leaveRoom(socket) {
  const r=getRoom(socket);
  if(!r)return;
  r.players.delete(socket.id);
  socket.leave(r.code);
  socket.data.code=null;
  if(r.players.size===0) {rooms.delete(r.code);return;}
  if(r.host===socket.id)r.host=r.players.keys().next().value;
  if(r.phase!=='lobby' && r.phase!=='finished' && (countTeam(r,'A')===0 || countTeam(r,'B')===0)){
    r.phase='lobby';r.deadline=0;r.bomb=null;r.grenades=[];
    say(r,'Bir takım ayrıldı. Maç lobiye döndü.');
  }
  say(r,sanitizeName(socket.data.nickname)+' odadan ayrıldı.');
  emitRoom(r);
}
function join(socket,r,name,team,skin) {
  if(socket.data.code)leaveRoom(socket);
  if(r.players.size>=MAX_TEAM*2){socket.emit('joinError','Oda dolu (maksimum 5v5).');return;}
  if(r.phase!=='lobby' && r.phase!=='finished'){socket.emit('joinError','Aktif maça katılınamıyor. Yeni maç için bekle.');return;}
  const side=chooseTeam(r,team);
  if(!side){socket.emit('joinError','Oda dolu.');return;}
  const p=createPlayer(socket,name,side,skin);
  socket.data.code=r.code;socket.data.nickname=p.name;
  r.players.set(socket.id,p);
  socket.join(r.code);
  socket.emit('joined',{code:r.code,id:socket.id});
  emitRoom(r);
}
function spawn(r,p,index) {
  const map=MAPS[r.map], loc=map.spawns[p.team][index%5];
  p.x=loc[0];p.z=loc[1];p.y=0;p.vy=0;
  p.yaw=p.team==='A'?Math.PI:0;p.pitch=0;
  p.hp=100;p.armor=0;p.alive=true;p.inv=newInventory();p.active='pistol';
  p.nextFire=0;p.reloadUntil=0;p.plantProgress=0;p.action='';p.lastJump=false;
  p.input={f:0,s:0,j:false,c:false,shift:false,fire:false,use:false};
}
function nextRound(r) {
  if(countTeam(r,'A')===0 || countTeam(r,'B')===0){r.phase='lobby';emitRoom(r);return;}
  r.round++;r.phase='buy';r.deadline=now()+BUY_TIME*1000;r.winner=null;
  r.bomb={planted:false,carrier:null,x:0,z:0,site:null,explodeAt:0};
  r.grenades=[];
  let a=0,b=0;
  for(const p of r.players.values())spawn(r,p,p.team==='A'?a++:b++);
  const attackers=[...r.players.values()].filter(p=>p.team==='A');
  if(attackers.length)r.bomb.carrier=attackers[randomInt(attackers.length)].id;
  say(r,'Raunt '+r.round+': satın alma aşaması başladı. B tuşuna bas.');
  emitRoom(r);
}
function startMatch(r) {
  if(countTeam(r,'A')<1 || countTeam(r,'B')<1)return false;
  r.scores={A:0,B:0};r.round=0;r.winner=null;
  for(const p of r.players.values()){p.money=800;p.kills=0;p.deaths=0;}
  nextRound(r);return true;
}
function endRound(r,winner,why) {
  if(r.phase!=='live' && r.phase!=='buy')return;
  r.scores[winner]++;
  for(const p of r.players.values()){
    p.money=clamp(p.money+(p.team===winner?3250:1500),0,16000);
    p.input.fire=false;p.input.use=false;
  }
  r.winner=winner;
  if(r.scores[winner]>=MAX_SCORE){r.phase='finished';r.deadline=0;}
  else {r.phase='end';r.deadline=now()+INTERMISSION*1000;}
  say(r,(winner==='A'?'AKINCI':'MUHAFIZ')+' kazandı! '+why);
  emitRoom(r);
}
function reload(p) {
  const w=WEAPONS[p.active],s=p.inv[p.active];
  if(!w || !s || w.category==='melee' || w.category==='utility' || p.reloadUntil)return;
  if(s.ammo>=w.clip || s.reserve<=0)return;
  p.reloadUntil=now()+w.reload*1000;
}
function finishReload(p,t) {
  if(p.reloadUntil && t>=p.reloadUntil){
    const s=p.inv[p.active],w=WEAPONS[p.active];
    if(s && w){const take=Math.min(w.clip-s.ammo,s.reserve);s.ammo+=take;s.reserve-=take;}
    p.reloadUntil=0;
  }
}
function direction(yaw,pitch){
  return [-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];
}
function damage(r,target,amount,killer,weapon,headshot=false) {
  if(!target.alive || r.phase!=='live')return;
  let dmg=amount;
  if(target.armor>0) {
    const absorbed=Math.min(target.armor,Math.ceil(dmg*0.42));
    target.armor-=absorbed;dmg-=Math.floor(absorbed*0.58);
  }
  target.hp=Math.max(0,target.hp-Math.max(1,Math.round(dmg)));
  if(target.hp>0)return;
  target.alive=false;target.deaths++;
  target.input.fire=false;target.input.use=false;
  if(r.bomb && r.bomb.carrier===target.id){
    r.bomb.carrier=null;r.bomb.x=target.x;r.bomb.z=target.z;
    say(r,'Bomba yere düştü.');
  }
  if(killer && killer.id!==target.id)killer.kills++;
  io.to(r.code).emit('kill',{killer:killer?.name||'Bölge',victim:target.name,weapon,headshot});
  emitRoom(r);
}
function fire(r,p,t) {
  if(r.phase!=='live' || !p.alive || p.reloadUntil || t<p.nextFire)return;
  const weapon=WEAPONS[p.active],stock=p.inv[p.active];
  if(!weapon || !stock || weapon.category==='utility')return;
  if(weapon.category!=='melee' && stock.ammo<=0){reload(p);return;}
  p.nextFire=t+weapon.rate*1000;
  if(weapon.category!=='melee')stock.ammo--;
  const map=MAPS[r.map];
  const origin=[p.x,1.58+(p.y||0),p.z];
  const count=weapon.pellets||1;
  for(let i=0;i<count;i++){
    const spread=weapon.spread * (p.input.shift?1:1.35);
    const dir=direction(p.yaw+(Math.random()-0.5)*spread*2,p.pitch+(Math.random()-0.5)*spread*2);
    let nearest=Math.min(weapon.range,wallDistance(map,origin,dir,weapon.range));
    let victim=null, head=false;
    for(const target of r.players.values()){
      if(target.id===p.id || target.team===p.team || !target.alive)continue;
      const hit=playerIntersection(origin,dir,target);
      if(hit.distance<nearest){nearest=hit.distance;victim=target;head=hit.headshot;}
    }
    if(victim)damage(r,victim,weapon.damage*(head?weapon.head:1),p,p.active,head);
    if(i===0)io.to(r.code).emit('shot',{id:p.id,weapon:p.active,x:p.x,z:p.z,hitX:origin[0]+dir[0]*nearest,hitY:origin[1]+dir[1]*nearest,hitZ:origin[2]+dir[2]*nearest});
  }
}
function throwGrenade(r,p,t) {
  if(r.phase!=='live' || !p.alive || p.active!=='grenade' || !p.inv.grenade || t<p.nextFire)return;
  p.nextFire=t+1000;
  const dir=direction(p.yaw,p.pitch);
  r.grenades.push({id:p.id,x:p.x,z:p.z,y:1.6,vx:dir[0]*12,vz:dir[2]*12,vy:4+dir[1]*7,explodeAt:t+2100});
  delete p.inv.grenade;
  p.active=p.inv.rifle?'rifle':Object.keys(p.inv).find(k=>WEAPONS[k].category==='primary')||'pistol';
  io.to(r.code).emit('throw',{x:p.x,z:p.z});
}
function updateGrenades(r,dt,t){
  const map=MAPS[r.map];
  for(let i=r.grenades.length-1;i>=0;i--){
    const g=r.grenades[i];
    g.vy-=14*dt;g.y=Math.max(0.15,g.y+g.vy*dt);
    if(g.y===0.15)g.vy=Math.abs(g.vy)*0.32;
    const move=moveWithCollision(map,g.x,g.z,g.vx*dt,g.vz*dt,0.2);
    if(move.x===g.x)g.vx*=-0.5;
    if(move.z===g.z)g.vz*=-0.5;
    g.x=move.x;g.z=move.z;g.vx*=0.994;g.vz*=0.994;
    if(t<g.explodeAt)continue;
    const owner=r.players.get(g.id);
    for(const p of r.players.values()) {
      if(!p.alive || (owner && p.team===owner.team && p.id!==owner.id))continue;
      const d=distance2(p,g);
      if(d>8.5)continue;
      const ray=[(p.x-g.x)/(d||1),0,(p.z-g.z)/(d||1)];
      const blocked=wallDistance(map,[g.x,1,g.z],ray,d);
      if(blocked<d-0.4)continue;
      damage(r,p,Math.round(WEAPONS.grenade.damage*(1-d/8.5)),owner,'grenade');
    }
    io.to(r.code).emit('explosion',{x:g.x,z:g.z});
    r.grenades.splice(i,1);
  }
}
function interact(r,p,dt,t) {
  const bomb=r.bomb;
  if(!bomb || r.phase!=='live' || !p.alive || !p.input.use){p.plantProgress=0;p.action='';return;}
  if(p.team==='A' && !bomb.planted){
    if(bomb.carrier===null && distance2(p,bomb)<2){
      bomb.carrier=p.id;p.plantProgress=0;say(r,p.name+' bombayı aldı.');
      return;
    }
    if(bomb.carrier===p.id){
      const site=canPlant(MAPS[r.map],p);
      if(site){
        p.action='Bomba kuruluyor';p.plantProgress+=dt;
        if(p.plantProgress>=4){
          bomb.planted=true;bomb.carrier=null;bomb.x=site.x;bomb.z=site.z;
          bomb.site=site.id;bomb.explodeAt=t+BOMB_TIME*1000;
          p.plantProgress=0;p.action='';
          r.deadline=bomb.explodeAt;
          say(r,'Bomba '+site.id+' bölgesine kuruldu! 40 saniye.');
          emitRoom(r);
        }
        return;
      }
    }
  }
  if(p.team==='B' && bomb.planted && distance2(p,bomb)<2.8){
    p.action='Bomba etkisizleştiriliyor';p.plantProgress+=dt;
    if(p.plantProgress>=6)endRound(r,'B',p.name+' bombayı etkisizleştirdi.');
    return;
  }
  p.plantProgress=0;p.action='';
}
function simulate(r,dt,t){
  if(r.phase==='end' && t>=r.deadline){nextRound(r);return;}
  if(r.phase==='buy' && t>=r.deadline){
    r.phase='live';r.deadline=t+ROUND_TIME*1000;
    say(r,'Raunt başladı!');emitRoom(r);
  }
  if(r.phase!=='buy' && r.phase!=='live')return;
  const map=MAPS[r.map];
  for(const p of r.players.values()) {
    finishReload(p,t);
    if(!p.alive)continue;
    if(p.input && (r.phase==='live' || r.phase==='buy')){
      const forward=clamp(p.input.f,-1,1),side=clamp(p.input.s,-1,1);
      const magnitude=Math.max(1,Math.hypot(forward,side));
      const slow=p.input.c?0.52:1;
      const speed=(p.input.shift?SPRINT_SPEED:SPEED)*slow*dt;
      const dx=(-Math.sin(p.yaw)*forward+Math.cos(p.yaw)*side)*speed/magnitude;
      const dz=(-Math.cos(p.yaw)*forward-Math.sin(p.yaw)*side)*speed/magnitude;
      const moved=moveWithCollision(map,p.x,p.z,dx,dz);
      p.x=moved.x;p.z=moved.z;
      if(p.input.j && !p.lastJump && p.y<=0){p.vy=5.3;}
      p.lastJump=p.input.j;
      p.vy-=16*dt;p.y=Math.max(0,p.y+p.vy*dt);
      if(p.y===0)p.vy=0;
    }
    if(r.phase==='live'){
      if(p.input.fire){
        if(p.active==='grenade')throwGrenade(r,p,t);else fire(r,p,t);
      }
      interact(r,p,dt,t);
    }
  }
  if(r.phase!=='live')return;
  updateGrenades(r,dt,t);
  const aliveA=[...r.players.values()].filter(p=>p.team==='A' && p.alive).length;
  const aliveB=[...r.players.values()].filter(p=>p.team==='B' && p.alive).length;
  if(aliveB===0){endRound(r,'A','Muhafızların tamamı elendi.');return;}
  if(aliveA===0 && !r.bomb.planted){endRound(r,'B','Akıncıların tamamı elendi.');return;}
  if(t>=r.deadline){
    if(r.bomb.planted)endRound(r,'A','Bomba patladı.');
    else endRound(r,'B','Süre doldu.');
  }
}
function broadcast(r,t) {
  if(r.phase==='lobby')return;
  const map=MAPS[r.map];
  const players=[...r.players.values()].map(p=>({
    id:p.id,name:p.name,team:p.team,skin:p.skin,x:p.x,z:p.z,y:p.y,
    yaw:p.yaw,pitch:p.pitch,hp:p.hp,alive:p.alive,weapon:p.active,kills:p.kills,deaths:p.deaths
  }));
  const common={
    t,phase:r.phase,deadline:r.deadline,scores:r.scores,round:r.round,
    bomb:r.bomb?{...r.bomb}:null,grenades:r.grenades.map(g=>({x:g.x,y:g.y,z:g.z}))
  };
  for(const p of r.players.values()){
    const sock=io.sockets.sockets.get(p.id);
    if(!sock)continue;
    // Never send enemies behind solid cover or far outside the combat area.
    const visible=players.filter(q=>{
      if(q.id===p.id || q.team===p.team)return true;
      if(!q.alive)return false;
      const d=Math.hypot(q.x-p.x,q.z-p.z);
      if(d>55)return false;
      if(d<9)return true;
      const dir=[(q.x-p.x)/d,0,(q.z-p.z)/d];
      return wallDistance(map,[p.x,1.58+p.y,p.z],dir,d)>=d-.4;
    });
    sock.emit('snapshot',{...common,players:visible});
    const s=p.inv[p.active];
    sock.emit('self',{
      hp:p.hp,armor:p.armor,alive:p.alive,money:p.money,
      active:p.active,ammo:s?.ammo||0,reserve:s?.reserve||0,inv:Object.keys(p.inv),
      hasBomb:r.bomb?.carrier===p.id,progress:p.plantProgress,action:p.action,
      reload:Math.max(0,p.reloadUntil-t),x:p.x,z:p.z,y:p.y,yaw:p.y,pitch:p.pitch
    });
  }
}
io.on('connection',socket=>{
  socket.data.code=null;
  socket.on('create',data=>{
    if(rooms.size>=200){socket.emit('joinError','Sunucu oda sınırına ulaştı.');return;}
    const code=makeCode(),r={
      code,host:socket.id,map:MAP_IDS.includes(data?.map)?data.map:'sand',
      phase:'lobby',round:0,scores:{A:0,B:0},deadline:0,winner:null,
      players:new Map(),bomb:null,grenades:[]
    };
    rooms.set(code,r);
    join(socket,r,data?.name,data?.team,data?.skin);
  });
  socket.on('join',data=>{
    const code=String(data?.code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);
    const r=rooms.get(code);
    if(!r){socket.emit('joinError','Oda bulunamadı. Kodu kontrol et.');return;}
    join(socket,r,data?.name,data?.team,data?.skin);
  });
  socket.on('team',team=>{
    const r=getRoom(socket),p=r?.players.get(socket.id);
    if(!p || (r.phase!=='lobby' && r.phase!=='finished') || !['A','B'].includes(team))return;
    if(team!==p.team && countTeam(r,team)<MAX_TEAM){p.team=team;emitRoom(r);}
  });
  socket.on('skin',skin=>{
    const r=getRoom(socket),p=r?.players.get(socket.id);
    if(!p)return;
    p.skin=clamp(Math.floor(finite(skin)),0,2);emitRoom(r);
  });
  socket.on('map',id=>{
    const r=getRoom(socket);
    if(!r || socket.id!==r.host || !MAPS[id] || (r.phase!=='lobby' && r.phase!=='finished'))return;
    r.map=id;emitRoom(r);
  });
  socket.on('start',()=>{
    const r=getRoom(socket);
    if(!r || r.host!==socket.id || (r.phase!=='lobby' && r.phase!=='finished'))return;
    if(!startMatch(r))socket.emit('joinError','Maç için her takımda en az 1 oyuncu olmalı (1v1–5v5).');
  });
  socket.on('input',v=>{
    const r=getRoom(socket),p=r?.players.get(socket.id);
    if(!p || !v || typeof v!=='object')return;
    if(now()-p.lastInput<12)return;
    p.lastInput=now();
    p.yaw=clamp(finite(v.yaw,p.yaw),-1e5,1e5);
    p.pitch=clamp(finite(v.pitch,p.pitch),-1.47,1.47);
    p.input={
      f:clamp(finite(v.f),-1,1),s:clamp(finite(v.s),-1,1),
      j:v.j===true,c:v.c===true,shift:v.shift===true,
      fire:v.fire===true,use:v.use===true
    };
  });
  socket.on('equip',key=>{
    const r=getRoom(socket),p=r?.players.get(socket.id);
    if(!p || !p.alive || !p.inv[key] || (r.phase!=='buy' && r.phase!=='live'))return;
    p.active=key;p.reloadUntil=0;p.nextFire=now()+150;
  });
  socket.on('reload',()=>{
    const r=getRoom(socket),p=r?.players.get(socket.id);
    if(p && p.alive && (r.phase==='buy'||r.phase==='live'))reload(p);
  });
  socket.on('buy',key=>{
    const r=getRoom(socket),p=r?.players.get(socket.id);
    if(!p || !p.alive || r.phase!=='buy')return;
    if(key==='armor'){
      if(p.money<650 || p.armor>=100)return;
      p.money-=650;p.armor=100;return;
    }
    const weapon=WEAPONS[key];
    if(!weapon || !['primary','utility'].includes(weapon.category) || p.money<weapon.price)return;
    if(weapon.category==='utility' && p.inv.grenade)return;
    p.money-=weapon.price;
    if(weapon.category==='primary')for(const id of Object.keys(p.inv))if(WEAPONS[id].category==='primary')delete p.inv[id];
    p.inv[key]={ammo:weapon.clip,reserve:weapon.reserve};
    p.active=key;p.reloadUntil=0;
  });
  socket.on('chat',raw=>{
    const r=getRoom(socket),p=r?.players.get(socket.id);
    if(!p || now()-p.lastChat<900)return;
    p.lastChat=now();
    const msg=String(raw||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,120);
    if(msg)io.to(r.code).emit('chat',{name:p.name,team:p.team,message:msg});
  });
  socket.on('leave',()=>leaveRoom(socket));
  socket.on('disconnect',()=>leaveRoom(socket));
});
let last=now(),step=0;
setInterval(()=>{
  const t=now(),dt=Math.min(0.05,(t-last)/1000);last=t;step++;
  for(const r of rooms.values()){
    simulate(r,dt,t);
    if(step%Math.round(TICK_RATE/SNAP_RATE)===0)broadcast(r,t);
  }
},1000/TICK_RATE);
httpServer.listen(PORT,'0.0.0.0',()=>console.log('Blockfront Arena ready on port '+PORT));
