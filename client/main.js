import * as THREE from 'three';
import { io } from 'socket.io-client';
import { MAPS, WEAPONS, moveWithCollision, clamp } from '../shared/rules.js';
import './style.css';

const $=id=>document.getElementById(id);
const socket=io({autoConnect:true,reconnectionAttempts:12,timeout:10000});
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(74,innerWidth/innerHeight,0.06,180);
camera.rotation.order='YXZ';
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.24;
$('game').appendChild(renderer.domElement);
scene.add(camera);
scene.add(new THREE.HemisphereLight(0xdde8ed,0x58564b,2.4));
const sun=new THREE.DirectionalLight(0xffefd3,2.9);
sun.position.set(-24,40,12);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-40;sun.shadow.camera.right=40;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;
sun.shadow.bias=-0.00025;scene.add(sun);
const world=new THREE.Group(),actors=new THREE.Group(),effects=new THREE.Group();
scene.add(world,actors,effects);
const materialCache=new Map();
const cubeGeometry=new THREE.BoxGeometry(1,1,1);
const solid=color=>{
  const key=String(color);
  if(!materialCache.has(key))materialCache.set(key,new THREE.MeshStandardMaterial({color,roughness:.86,metalness:.05,flatShading:true}));
  return materialCache.get(key);
};
function block(parent,x,y,z,w,h,d,color,shadow=true){
  const mesh=new THREE.Mesh(cubeGeometry,solid(color));
  mesh.position.set(x,y,z);mesh.scale.set(w,h,d);
  mesh.castShadow=shadow;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function labelSprite(text,fg='#ffffff',bg='rgba(10,20,25,.8)'){
  const c=document.createElement('canvas');c.width=256;c.height=64;
  const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,256,64);
  ctx.font='bold 30px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=fg;
  ctx.fillText(text,128,32,244);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
  sprite.scale.set(2.6,.65,1);sprite.userData.texture=texture;return sprite;
}
function ring(parent,x,z,r,color){
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.58,side:THREE.DoubleSide,depthWrite:false});
  const mesh=new THREE.Mesh(new THREE.RingGeometry(r-.13,r,64),mat);
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.045,z);parent.add(mesh);
}
let selectedMap='sand',selectedSkin=0;
let myId='',roomCode='',room=null,snapshot=null,self=null;
let inGame=false,mouseDown=false,yaw=0,pitch=0,pred={x:0,z:0,y:0},lastPhase='',lastHp=100,lastAlive=true;
let worldMap=MAPS.sand;
const actorMeshes=new Map(),keys=new Set(),particleEffects=[];
let audioCtx=null,gunKick=0,movementSway=0,frameTime=performance.now(),elapsed=0;
function beep(type='shot'){
  try{
    if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;
    o.type=type==='explosion'?'sawtooth':'square';
    o.frequency.setValueAtTime(type==='explosion'?70:type==='hit'?590:210,t);
    o.frequency.exponentialRampToValueAtTime(type==='explosion'?35:type==='hit'?340:75,t+.12);
    g.gain.setValueAtTime(type==='explosion'?.15:type==='hit'?.09:.065,t);
    g.gain.exponentialRampToValueAtTime(.001,t+(type==='explosion'?.38:.13));
    o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+.4);
  }catch{}
}
function clearGroup(group){
  while(group.children.length){
    const obj=group.children[0];group.remove(obj);
    obj.traverse(o=>{if(o.geometry&&o.geometry!==cubeGeometry)o.geometry.dispose();if(o.material&&!materialCache.has(String(o.material.color?.getHex()))) {
      const materials=Array.isArray(o.material)?o.material:[o.material];
      for(const m of materials){if(m.map)m.map.dispose();m.dispose?.();}
    }});
  }
}
function buildMap(id){
  if(!MAPS[id])return;
  selectedMap=id;worldMap=MAPS[id];
  clearGroup(world);
  const m=worldMap;scene.background=new THREE.Color(m.sky);
  scene.fog=new THREE.Fog(m.sky,46,105);
  sun.color.setHex(m.theme==='harbor'?0xe6f1f4:0xffead6);
  block(world,0,-.32,0,68,.62,68,m.ground,false);
  const grid=new THREE.GridHelper(64,32,m.theme==='foundry'?0x645e54:0x736b52,m.theme==='harbor'?0x7c8d92:0xb7a17d);
  grid.position.y=.012;grid.material.transparent=true;grid.material.opacity=.17;world.add(grid);
  const border=m.theme==='foundry'?0x4b4945:m.theme==='harbor'?0x344b52:0xa99571;
  block(world,-32,2,0,1.2,4.2,65,border);
  block(world,32,2,0,1.2,4.2,65,border);
  block(world,0,2,-32,65,4.2,1.2,border);
  block(world,0,2,32,65,4.2,1.2,border);
  const palettes={
    sand:[0xc8ae83,0xb49a72,0xddc39b],
    harbor:[0x728b91,0x58737d,0x91a6a9],
    foundry:[0x896b60,0x6b5f57,0x9a8577]
  };
  m.blocks.forEach((b,i)=>{
    let color=palettes[m.theme][i%3];
    if(b[5]==='crate')color=i%2?0x83694d:0x94744e;
    if(b[5]==='container')color=[0x39677d,0x967042,0x61795f,0x814944][i%4];
    block(world,b[0],b[4]/2,b[1],b[2],b[4],b[3],color);
    block(world,b[0],b[4]+.07,b[1],b[2]+.12,.14,b[3]+.12,m.theme==='sand'?0xe7cb9d:0x343e41);
    if(b[5]==='container'){
      for(let k=-2;k<=2;k++)block(world,b[0]+k*b[2]/5,b[4]/2,b[1]+b[3]/2+.016,.065,b[4]-.18,.06,0x243942,false);
    } else if(b[5]==='crate'){
      block(world,b[0],b[4]/2,b[1]+b[3]/2+.03,b[2]*.72,.14,.08,0x584b38,false);
      block(world,b[0],b[4]/2,b[1]+b[3]/2+.03,.14,b[4]*.72,.08,0x584b38,false);
    } else if(i%2===0){
      for(let k=0;k<Math.min(3,Math.floor(b[2]/2));k++)
        block(world,b[0]-b[2]/2+1.1+k*2,.9,b[1]+b[3]/2+.035,.8,.9,.07,m.theme==='sand'?0x715e4c:0x344950,false);
    }
  });
  m.sites.forEach(site=>{
    ring(world,site.x,site.z,site.r,site.id==='A'?0xff8a57:0x7bd4ee);
    const icon=labelSprite(site.id,'#f9fcf3','rgba(22,25,29,.9)');
    icon.scale.set(1.3,.58,1);icon.position.set(site.x,2.9,site.z);world.add(icon);
    block(world,site.x,.018,site.z,1.1,.04,1.1,site.id==='A'?0xc5863d:0x498e9b,false);
  });
  for(let i=0;i<12;i++){
    const x=-30+(i%4)*20,z=-30+Math.floor(i/4)*29;
    if(m.blocks.some(b=>Math.abs(x-b[0])<b[2]/2+2 && Math.abs(z-b[1])<b[3]/2+2))continue;
    block(world,x,2.4,z,.25,4.8,.25,m.theme==='sand'?0x8b7c60:0x4d6066);
    block(world,x,4.65,z,.7,.2,.7,0xf5dfa7);
    const bulb=new THREE.PointLight(0xffd49a,.3,6);bulb.position.set(x,4.5,z);world.add(bulb);
  }
  if(m.theme==='harbor'){
    for(let i=0;i<6;i++){
      block(world,-36,.3,-25+i*10,6,.5,7,0x3b7f92,false);
      block(world,36,.3,-25+i*10,6,.5,7,0x3b7f92,false);
    }
  }
  if(m.theme==='foundry'){
    for(let i=0;i<4;i++){
      const x=-27+i*18;
      block(world,x,5,37,2,10,2,0x535960);
      block(world,x,10.2,37,2.4,.5,2.4,0x34393a);
    }
  }
}
const skins=[
  {shirt:0x84be2e,shirtDark:0x6da51e,pants:0x1686d5,hair:0x815a36},
  {shirt:0xe44321,shirtDark:0xbd351b,pants:0x80613c,hair:0xa67543},
  {shirt:0xf1a200,shirtDark:0xd78300,pants:0x8d9b06,hair:0x403833}
];
function makeAvatar(info){
  const group=new THREE.Group();const s=skins[clamp(info.skin||0,0,2)];
  const armor=info.team==='A'?0xf97b52:0x64c5eb;
  const torso=new THREE.Group();group.add(torso);
  block(torso,0,1.06,0,.86,.86,.45,s.shirt);
  block(torso,0,1.18,-.238,.7,.16,.055,armor);
  block(torso,0,1.53,0,.48,.18,.43,s.shirtDark);
  block(torso,0,1.74,-.01,.57,.53,.51,0xd8ae88);
  block(torso,0,1.98,.015,.62,.21,.56,s.hair);
  block(torso,0,1.91,.27,.62,.13,.16,s.hair);
  block(torso,-.145,1.78,-.278,.06,.06,.025,0x47413e,false);
  block(torso,.145,1.78,-.278,.06,.06,.025,0x47413e,false);
  block(torso,0,1.62,-.28,.13,.045,.02,0xa16f60,false);
  const leftArm=new THREE.Group(),rightArm=new THREE.Group();
  leftArm.position.set(-.56,1.38,0);rightArm.position.set(.56,1.38,0);
  block(leftArm,0,-.28,0,.28,.62,.34,s.shirt);
  block(rightArm,0,-.28,0,.28,.62,.34,s.shirt);
  block(leftArm,0,-.55,-.01,.29,.15,.34,0xd1a680);
  block(rightArm,0,-.55,-.01,.29,.15,.34,0xd1a680);
  torso.add(leftArm,rightArm);
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();
  leftLeg.position.set(-.21,.69,0);rightLeg.position.set(.21,.69,0);
  block(leftLeg,0,-.26,0,.31,.62,.34,s.pants);
  block(rightLeg,0,-.26,0,.31,.62,.34,s.pants);
  block(leftLeg,0,-.57,-.1,.35,.19,.55,0x302f30);
  block(rightLeg,0,-.57,-.1,.35,.19,.55,0x302f30);
  group.add(leftLeg,rightLeg);
  const weaponGroup=new THREE.Group();torso.add(weaponGroup);
  weaponGroup.position.set(.22,1.12,-.38);
  block(weaponGroup,0,0,-.18,.2,.22,.62,0x333e46);
  block(weaponGroup,0,.08,-.50,.09,.09,.39,0x2d3338);
  const tag=labelSprite(info.name,info.team==='A'?'#ffac85':'#85dcff');
  tag.position.set(0,2.55,0);group.add(tag);
  group.userData={leftLeg,rightLeg,leftArm,rightArm,torso,tag,weaponGroup};
  return group;
}
function updateActors(list,dt){
  const seen=new Set();
  for(const p of list){
    if(p.id===myId || !p.alive)continue;
    seen.add(p.id);
    let entry=actorMeshes.get(p.id);
    if(!entry || entry.skin!==p.skin || entry.team!==p.team || entry.name!==p.name){
      if(entry)actors.remove(entry.obj);
      const obj=makeAvatar(p);actors.add(obj);
      entry={obj,skin:p.skin,team:p.team,name:p.name};actorMeshes.set(p.id,entry);
    }
    entry.obj.position.lerp(new THREE.Vector3(p.x,p.y||0,p.z),Math.min(1,dt*13));
    if(entry.obj.position.lengthSq()<.001)entry.obj.position.set(p.x,p.y||0,p.z);
    entry.obj.rotation.y=p.yaw;
    const u=entry.obj.userData;
    const speed=Math.hypot(p.x-(entry.prevX??p.x),p.z-(entry.prevZ??p.z));
    entry.move=THREE.MathUtils.lerp(entry.move||0,Math.min(1,speed*4),.2);
    const step=Math.sin(elapsed*10+(p.id.charCodeAt(0)%12))*.46*entry.move;
    u.leftLeg.rotation.x=step;u.rightLeg.rotation.x=-step;
    u.leftArm.rotation.x=-step*.45;u.rightArm.rotation.x=step*.45;
    u.torso.rotation.z=Math.sin(elapsed*5)*.015*entry.move;
    entry.prevX=p.x;entry.prevZ=p.z;
  }
  for(const [id,e] of actorMeshes)if(!seen.has(id)){actors.remove(e.obj);actorMeshes.delete(id);}
}
const objectiveGroup=new THREE.Group();
scene.add(objectiveGroup);
const bombVisual=new THREE.Group();
block(bombVisual,0,.22,0,.54,.3,.4,0x333d3f);
block(bombVisual,0,.41,0,.37,.09,.25,0x5c6c65);
block(bombVisual,0,.46,-.03,.16,.04,.1,0xffb947,false);
for(let i=0;i<4;i++)block(bombVisual,-.14+i*.09,.48,.13,.055,.04,.055,0x8eb36e,false);
objectiveGroup.add(bombVisual);
const grenadeVisuals=[];
function updateObjectives(time){
  const bomb=snapshot?.bomb;
  bombVisual.visible=Boolean(inGame && bomb && (bomb.planted || bomb.carrier===null));
  if(bombVisual.visible){
    bombVisual.position.set(bomb.x,0,bomb.z);
    bombVisual.rotation.y+=.005;
    bombVisual.children[2].material=solid(bomb.planted && Math.sin(time*9)>0?0xff3e2b:0xffb947);
  }
  const list=inGame?(snapshot?.grenades||[]):[];
  for(let i=0;i<list.length;i++){
    let grenade=grenadeVisuals[i];
    if(!grenade){
      grenade=new THREE.Group();
      block(grenade,0,0,0,.25,.25,.25,0x455947);
      block(grenade,0,.17,0,.13,.13,.13,0xa4b3a5,false);
      grenadeVisuals[i]=grenade;objectiveGroup.add(grenade);
    }
    grenade.visible=true;
    grenade.position.set(list[i].x,list[i].y,list[i].z);
    grenade.rotation.x+=.12;
  }
  for(let i=list.length;i<grenadeVisuals.length;i++)grenadeVisuals[i].visible=false;
}
const viewGun=new THREE.Group();camera.add(viewGun);
function setViewWeapon(key){
  while(viewGun.children.length)viewGun.remove(viewGun.children[0]);
  const w=WEAPONS[key]||WEAPONS.pistol;
  if(w.category==='melee'){
    block(viewGun,.34,-.42,-.58,.14,.36,.14,0x424b50,false);
    block(viewGun,.34,-.22,-.68,.08,.42,.15,0xc7d3d0,false);
  }else if(w.category==='utility'){
    block(viewGun,.38,-.39,-.62,.23,.28,.28,0x5d7453,false);
    block(viewGun,.38,-.21,-.62,.09,.1,.09,0xaab6ae,false);
  }else{
    const length=key==='sniper'?1.12:key==='shotgun'?.93:key==='pistol'?.55:.82;
    block(viewGun,.35,-.36,-.63,.17,.19,length,0x354047,false);
    block(viewGun,.35,-.27,-.63-length/2,.09,.11,.28,0x151d20,false);
    block(viewGun,.31,-.53,-.4,.13,.33,.18,0x1e2729,false);
    block(viewGun,.35,-.21,-.55,.24,.08,.26,key==='rifle'?0x936443:key==='sniper'?0x6d746a:0x6b777b,false);
    if(key==='sniper')block(viewGun,.35,-.12,-.55,.15,.15,.42,0x1c252c,false);
    if(key==='lmg')block(viewGun,.35,-.49,-.72,.2,.3,.28,0x434b4c,false);
  }
  block(viewGun,.27,-.68,-.28,.26,.34,.32,0xd8aa83,false);
  block(viewGun,.27,-.81,-.28,.39,.18,.36,0x51626d,false);
  currentViewWeapon=key;
}
let currentViewWeapon='pistol';setViewWeapon('pistol');
function fxLine(start,end,color){
  const geom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...start),new THREE.Vector3(...end)]);
  const mat=new THREE.LineBasicMaterial({color,transparent:true,opacity:.95});
  const line=new THREE.Line(geom,mat);effects.add(line);
  particleEffects.push({obj:line,ttl:.14,max:.14});
}
function fxBlast(x,z){
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),new THREE.MeshBasicMaterial({color:0xffa83b,transparent:true,opacity:.8,depthWrite:false}));
  sphere.position.set(x,1,z);sphere.scale.set(.35,.35,.35);effects.add(sphere);
  particleEffects.push({obj:sphere,ttl:.45,max:.45,blast:true});
  beep('explosion');
}
function updateFx(dt){
  for(let i=particleEffects.length-1;i>=0;i--){
    const fx=particleEffects[i];fx.ttl-=dt;
    fx.obj.material.opacity=Math.max(0,fx.ttl/fx.max)*.85;
    if(fx.blast){const scale=.4+(1-fx.ttl/fx.max)*5;fx.obj.scale.setScalar(scale);}
    if(fx.ttl<=0){effects.remove(fx.obj);fx.obj.geometry.dispose();fx.obj.material.dispose();particleEffects.splice(i,1);}
  }
}
function hudToggle(active){
  inGame=active;
  $('screen-menu').classList.toggle('hidden',active||Boolean(roomCode));
  $('screen-lobby').classList.toggle('hidden',active||!roomCode);
  $('hud').classList.toggle('hidden',!active);
  if(!active){
    $('buy-panel').classList.add('hidden');$('scoreboard').classList.add('hidden');
    if(document.pointerLockElement)document.exitPointerLock();
    mouseDown=false;
  }
}
function toast(msg){
  const el=$('toast');el.textContent=msg;el.style.opacity='1';
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.style.opacity='0',3500);
}
function showBanner(text){
  const el=$('round-banner');el.textContent=text;el.classList.remove('hidden');
  clearTimeout(showBanner.timer);showBanner.timer=setTimeout(()=>el.classList.add('hidden'),3500);
}
function roster(parent,entries){
  const el=$(parent);el.textContent='';
  for(let i=0;i<5;i++){
    const div=document.createElement('div');div.className='roster-player';
    const num=document.createElement('span');num.className='slot';num.textContent=String(i+1).padStart(2,'0');div.append(num);
    const name=document.createElement('span');name.textContent=entries[i]?.name||'— Boş slot —';div.append(name);
    if(entries[i]?.id===myId){const you=document.createElement('span');you.className='you';you.textContent='SEN';div.append(you);}
    el.append(div);
  }
}
function renderLobby(){
  if(!room)return;
  const a=room.players.filter(p=>p.team==='A'),b=room.players.filter(p=>p.team==='B');
  $('room-code').textContent=room.code;$('count-a').textContent=a.length+'/5';$('count-b').textContent=b.length+'/5';
  $('lobby-map').value=room.map;$('lobby-map').disabled=room.host!==myId;
  $('start-match').disabled=room.host!==myId||!a.length||!b.length;
  $('start-match').textContent=room.host===myId?'MAÇI BAŞLAT →':'ODA SAHİBİ BEKLENİYOR';
  $('lobby-status').textContent=room.phase==='finished'?'Maç bitti! Oda sahibi yeni maç başlatabilir.':'Takımlar: '+a.length+'v'+b.length+' · Minimum 1v1, maksimum 5v5 · Sadece gerçek oyuncular';
  roster('roster-a',a);roster('roster-b',b);
}
function drawMinimap(){
  const canvas=$('minimap'),c=canvas.getContext('2d'),w=canvas.width;
  c.clearRect(0,0,w,w);c.fillStyle='#0b2229';c.fillRect(0,0,w,w);
  const scale=w/(worldMap.size*2),xy=(x,z)=>[w/2+x*scale,w/2+z*scale];
  c.fillStyle='#415459';
  for(const b of worldMap.blocks){
    const [x,z]=xy(b[0],b[1]);c.fillRect(x-b[2]*scale/2,z-b[3]*scale/2,b[2]*scale,b[3]*scale);
  }
  for(const s of worldMap.sites){
    const [x,z]=xy(s.x,s.z);c.strokeStyle=s.id==='A'?'#ff9366':'#88d8fa';c.lineWidth=2;
    c.beginPath();c.arc(x,z,s.r*scale,0,Math.PI*2);c.stroke();
    c.font='bold 13px Arial';c.fillStyle='white';c.fillText(s.id,x-4,z+4);
  }
  if(snapshot)for(const p of snapshot.players){
    if(!p.alive || (p.id!==myId&&p.team!==snapshot.players.find(v=>v.id===myId)?.team))continue;
    const [x,z]=xy(p.id===myId?pred.x:p.x,p.id===myId?pred.z:p.z);
    c.fillStyle=p.id===myId?'#e9ff8a':p.team==='A'?'#ff835d':'#80d7fa';
    c.beginPath();c.arc(x,z,p.id===myId?5:3.4,0,Math.PI*2);c.fill();
    if(p.id===myId){c.strokeStyle='#e9ff8a';c.beginPath();c.moveTo(x,z);c.lineTo(x-Math.sin(yaw)*11,z-Math.cos(yaw)*11);c.stroke();}
  }
  if(snapshot?.bomb){
    const bomb=snapshot.bomb;
    if(bomb.planted || bomb.carrier===null){
      const [x,z]=xy(bomb.x,bomb.z);c.fillStyle='#ffea72';c.beginPath();c.arc(x,z,5,0,7);c.fill();
    }
  }
}
function makeBuyMenu(){
  const list=[['smg','HAFİF MAKİNELİ'],['rifle','SALDIRI TÜFEĞİ'],['sniper','KESKİN NİŞANCI'],['shotgun','POMPALI'],['lmg','AĞIR MAKİNELİ'],['grenade','PATLAYICI']];
  const target=$('buy-items');target.textContent='';
  for(const [key,category] of list){
    const w=WEAPONS[key],b=document.createElement('button');b.className='buy-item';
    b.disabled=(self?.money||0)<w.price || self?.inv?.includes(key);
    const mini=document.createElement('small');mini.textContent=category;
    const name=document.createElement('strong');name.textContent=w.name;
    const price=document.createElement('b');price.textContent='$'+w.price;
    b.append(mini,name,price);b.addEventListener('click',()=>{socket.emit('buy',key);toast(w.name+' seçildi');setTimeout(makeBuyMenu,110);});
    target.append(b);
  }
  const armor=document.createElement('button');armor.className='buy-item';
  armor.disabled=(self?.money||0)<650 || self?.armor===100;
  armor.textContent='ZIRH / KEVLAR · $650';
  armor.addEventListener('click',()=>{socket.emit('buy','armor');toast('Zırh satın alındı');setTimeout(makeBuyMenu,100);});
  target.append(armor);
}
function showBuy(flag){
  if(!inGame || room?.phase!=='buy')flag=false;
  $('buy-panel').classList.toggle('hidden',!flag);
  if(flag){mouseDown=false;makeBuyMenu();if(document.pointerLockElement)document.exitPointerLock();}
}
function renderScoreboard(){
  if(!room)return;
  $('score-label').textContent=room.scores.A+' — '+room.scores.B;
  const el=$('score-rows');el.textContent='';
  for(const team of ['A','B']){
    const s=document.createElement('section');s.className='score-section';
    const head=document.createElement('h3');head.textContent=team==='A'?'◆ AKINCILAR':'◈ MUHAFIZLAR';s.append(head);
    const title=document.createElement('div');title.className='score-entry';title.textContent='';
    for(const text of ['OYUNCU','LEŞ','ÖLÜM']){const span=document.createElement('span');span.textContent=text;title.append(span);}s.append(title);
    for(const p of room.players.filter(q=>q.team===team).sort((a,b)=>b.kills-a.kills)){
      const row=document.createElement('div');row.className='score-entry';
      for(const text of [p.name+(p.id===myId?' (SEN)':''),String(p.kills),String(p.deaths)]){
        const span=document.createElement('span');span.textContent=text;row.append(span);
      }
      s.append(row);
    }
    el.append(s);
  }
}
function writeChat(text,system=false){
  const area=$('chatlog'),entry=document.createElement('div');
  entry.textContent=text;if(system)entry.style.color='#d8f09a';
  area.append(entry);while(area.children.length>6)area.firstChild.remove();
  clearTimeout(entry.timer);entry.timer=setTimeout(()=>entry.remove(),14000);
}
function formatClock(ms){
  const total=Math.max(0,Math.ceil(ms/1000)),min=Math.floor(total/60),sec=total%60;
  return String(min).padStart(2,'0')+':'+String(sec).padStart(2,'0');
}
function updateHUD(){
  if(!room || !self)return;
  $('score-a').textContent=room.scores.A;$('score-b').textContent=room.scores.B;
  $('phase-text').textContent=room.phase==='buy'?'SATIN ALMA':room.phase==='live'?'RAUNT '+room.round:room.phase==='end'?'RAUNT BİTTİ':'MAÇ';
  $('round-timer').textContent=formatClock(room.deadline-Date.now());
  $('map-name').textContent=MAPS[room.map]?.name.toUpperCase()||'';
  $('hp').textContent=self.hp;$('armor').textContent=self.armor;
  $('ammo').textContent=self.active==='knife'?'∞':self.ammo;
  $('reserve').textContent=self.active==='knife'?'':self.reserve;
  $('weapon-name').textContent=(WEAPONS[self.active]?.name||self.active).toUpperCase();
  $('money').textContent='$'+self.money;
  $('buy-prompt').classList.toggle('hidden',room.phase!=='buy');
  const objective=$('objective');
  if(room.phase==='live'){
    const bomb=snapshot?.bomb;
    objective.textContent=bomb?.planted?'BOMBA KURULDU · '+bomb.site+' BÖLGESİNİ '+(room.players.find(p=>p.id===myId)?.team==='A'?'KORU':'SAVUN'):self.hasBomb?'BOMBA SENDE · A / B BÖLGESİNDE E TUŞUNU TUT':bomb?.carrier===null?'BOMBA YERDE · E İLE AL':'TAKIMINLA HAREKET ET';
    objective.classList.remove('hidden');
  }else objective.classList.add('hidden');
  $('crosshair').classList.toggle('hidden',!self.alive);
  $('spectator').classList.toggle('hidden',self.alive);
  const working=self.progress>0 && self.action;
  $('interaction').classList.toggle('hidden',!working);
  if(working){
    $('interaction-label').textContent=self.action;
    $('interaction-progress').style.width=Math.min(100,self.progress/(self.action.includes('kuruluyor')?4:6)*100)+'%';
  }
  if(room.phase!=='buy')showBuy(false);
}
function applySnapshot(s){
  snapshot=s;
  if(!room)return;
  const oldPhase=room.phase;
  room.phase=s.phase;room.deadline=s.deadline;room.scores=s.scores;room.round=s.round;
  if(s.phase!==oldPhase){
    if(s.phase==='live')showBanner('RAUNT BAŞLADI');
    if(s.phase==='buy')showBanner('EKİPMANINI HAZIRLA');
    if(s.phase==='end')showBanner('RAUNT SONA ERDİ');
    if(s.phase==='finished')showBanner('MAÇ BİTTİ');
    if(s.phase==='buy' && document.pointerLockElement===null) $('pointer-prompt').classList.remove('hidden');
  }
  for(const p of s.players) {
    const target=room.players.find(q=>q.id===p.id);
    if(target){target.kills=p.kills;target.deaths=p.deaths;}
  }
}
function showGameFromRoom(data){
  room=data;
  if(data.phase==='buy'||data.phase==='live'||data.phase==='end'){
    if(!inGame){pred.x=0;pred.z=0;pred.y=0;lastHp=100;lastAlive=true;}
    hudToggle(true);
    if(selectedMap!==data.map)buildMap(data.map);
    updateHUD();
  }else{
    hudToggle(false);
    if(selectedMap!==data.map)buildMap(data.map);
    renderLobby();
    if(data.phase==='finished')showBanner('MAÇ TAMAMLANDI!');
  }
}
socket.on('connect',()=>{if(!roomCode)toast('Sunucuya bağlandı.');});
socket.on('disconnect',()=>{mouseDown=false;if(roomCode){toast('Sunucuyla bağlantı kesildi. Sayfayı yenileyip yeni odaya gir.');if(document.pointerLockElement)document.exitPointerLock();}});
socket.on('connect_error',()=>toast('Çevrimiçi sunucuya bağlanılamıyor.'));
socket.on('joined',data=>{roomCode=data.code;myId=data.id;$('join-code').value=data.code;toast('Odaya katıldın: '+roomCode);});
socket.on('joinError',msg=>toast(msg));
socket.on('room',data=>{
  roomCode=data.code;room=data;showGameFromRoom(data);
});
socket.on('snapshot',applySnapshot);
socket.on('self',data=>{
  if(!roomCode)return;
  if(self && data.hp<self.hp){
    $('damage-flash').style.opacity='.22';setTimeout(()=>$('damage-flash').style.opacity='0',160);
  }
  self=data;
  if(Math.hypot(pred.x-data.x,pred.z-data.z)>4 || !lastAlive && data.alive) {
    pred.x=data.x;pred.z=data.z;pred.y=data.y;
    yaw=data.yaw;pitch=data.pitch;
  }else{
    pred.x=THREE.MathUtils.lerp(pred.x,data.x,.27);
    pred.z=THREE.MathUtils.lerp(pred.z,data.z,.27);
    pred.y=THREE.MathUtils.lerp(pred.y,data.y,.3);
  }
  if(data.alive!==lastAlive) {
    if(!data.alive){showBanner('ELENDİN');mouseDown=false;}
    lastAlive=data.alive;
  }
  if(currentViewWeapon!==data.active)setViewWeapon(data.active);
  lastHp=data.hp;updateHUD();
});
socket.on('notice',msg=>{writeChat('• '+msg,true);toast(msg);});
socket.on('chat',data=>writeChat(data.name+': '+data.message));
socket.on('kill',data=>{
  const box=document.createElement('div');box.className='kill';
  box.textContent=data.killer+'  ['+data.weapon+(data.headshot?' HS':'')+']  '+data.victim;
  $('killfeed').prepend(box);setTimeout(()=>box.remove(),5800);
  if(data.killer===room?.players.find(p=>p.id===myId)?.name){
    $('hitmarker').classList.remove('hidden');setTimeout(()=>$('hitmarker').classList.add('hidden'),250);beep('hit');
  }
});
socket.on('shot',data=>{
  fxLine([data.x,1.51,data.z],[data.hitX,data.hitY,data.hitZ],data.weapon==='sniper'?0xfdf8b1:0xffcd75);
  if(data.id===myId){gunKick=Math.min(.18,gunKick+.08);beep('shot');}
});
socket.on('explosion',data=>fxBlast(data.x,data.z));
socket.on('throw',()=>{});

function chosenName(){return $('player-name').value.trim().slice(0,18)||'Oyuncu';}
function chooseMap(id){
  document.querySelectorAll('.map-choice').forEach(el=>el.classList.toggle('selected',el.dataset.map===id));
  buildMap(id);
}
document.querySelectorAll('.map-choice').forEach(el=>el.addEventListener('click',()=>chooseMap(el.dataset.map)));
document.querySelectorAll('.pick').forEach(el=>el.addEventListener('click',()=>{
  selectedSkin=Number(el.dataset.skin);
  document.querySelectorAll('.pick').forEach(b=>b.classList.toggle('selected',b===el));
  if(roomCode)socket.emit('skin',selectedSkin);
}));
$('create-room').addEventListener('click',()=>{
  if(!socket.connected)return toast('Oyun sunucusu bağlı değil.');
  socket.emit('create',{name:chosenName(),map:selectedMap,skin:selectedSkin});
});
$('join-room').addEventListener('click',()=>{
  if(!socket.connected)return toast('Oyun sunucusu bağlı değil.');
  socket.emit('join',{name:chosenName(),code:$('join-code').value.trim(),skin:selectedSkin});
});
$('join-code').addEventListener('keydown',e=>{if(e.key==='Enter')$('join-room').click();});
$('copy-room').addEventListener('click',()=>{
  if(!roomCode)return;
  navigator.clipboard?.writeText(roomCode).then(()=>toast('Oda kodu kopyalandı.')).catch(()=>toast('Oda kodu: '+roomCode));
});
$('lobby-map').addEventListener('change',e=>socket.emit('map',e.target.value));
document.querySelectorAll('.team-join').forEach(el=>el.addEventListener('click',()=>socket.emit('team',el.dataset.team)));
$('start-match').addEventListener('click',()=>socket.emit('start'));
$('leave-room').addEventListener('click',()=>{
  socket.emit('leave');roomCode='';room=null;self=null;snapshot=null;
  hudToggle(false);$('screen-lobby').classList.add('hidden');$('screen-menu').classList.remove('hidden');
});
$('close-buy').addEventListener('click',()=>showBuy(false));
$('buy-panel').addEventListener('click',e=>{if(e.target===$('buy-panel'))showBuy(false);});
$('player-name').value='Oyuncu'+Math.floor(Math.random()*900+100);
$('pointer-prompt').classList.add('hidden');
const shouldPlay=()=>inGame && self?.alive && (room?.phase==='buy'||room?.phase==='live');
function pointerLocked(){return document.pointerLockElement===renderer.domElement;}
renderer.domElement.addEventListener('click',()=>{
  if(shouldPlay() && $('buy-panel').classList.contains('hidden') && !$('chatinput').matches(':focus'))
    renderer.domElement.requestPointerLock?.();
});
document.addEventListener('pointerlockchange',()=>{
  if(!pointerLocked())mouseDown=false;
  $('pointer-prompt').classList.toggle('hidden',!inGame||pointerLocked()||!self?.alive||!$('buy-panel').classList.contains('hidden'));
});
document.addEventListener('mousemove',e=>{
  if(!pointerLocked())return;
  yaw-=e.movementX*.00225;
  pitch=clamp(pitch-e.movementY*.00225,-1.45,1.45);
});
document.addEventListener('mousedown',e=>{
  if(e.button===0 && pointerLocked() && shouldPlay())mouseDown=true;
});
document.addEventListener('mouseup',e=>{if(e.button===0)mouseDown=false;});
document.addEventListener('contextmenu',e=>e.preventDefault());
function closeChat(){
  $('chatinput').classList.add('hidden');$('chatinput').blur();
}
function openChat(){
  if(!inGame)return;
  if(document.pointerLockElement)document.exitPointerLock();
  $('chatinput').classList.remove('hidden');$('chatinput').focus();mouseDown=false;
}
$('chatinput').addEventListener('keydown',e=>{
  e.stopPropagation();
  if(e.key==='Enter'){
    const v=e.target.value.trim();
    if(v)socket.emit('chat',v);
    e.target.value='';closeChat();e.preventDefault();
  }
  if(e.key==='Escape'){closeChat();e.preventDefault();}
});
document.addEventListener('keydown',e=>{
  if(e.target===$('chatinput'))return;
  if(['Tab','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  keys.add(e.code);
  if(!inGame)return;
  if(e.code==='Tab'){$('scoreboard').classList.remove('hidden');renderScoreboard();return;}
  if(e.code==='Enter'){openChat();return;}
  if(e.code==='KeyB' && room?.phase==='buy'){showBuy($('buy-panel').classList.contains('hidden'));return;}
  if(e.code==='Escape'){showBuy(false);closeChat();return;}
  if(!shouldPlay())return;
  if(e.code==='KeyR')socket.emit('reload');
  const k={'Digit1':self?.inv.find(id=>WEAPONS[id]?.category==='primary')||'pistol','Digit2':'pistol','Digit3':'knife','Digit4':'grenade','KeyG':'grenade'}[e.code];
  if(k && self?.inv.includes(k))socket.emit('equip',k);
});
document.addEventListener('keyup',e=>{
  keys.delete(e.code);
  if(e.code==='Tab')$('scoreboard').classList.add('hidden');
});
window.addEventListener('blur',()=>{keys.clear();mouseDown=false;$('scoreboard').classList.add('hidden');});
window.addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));
});
function inputState(){
  const active=shouldPlay() && pointerLocked() && $('buy-panel').classList.contains('hidden') && $('chatinput').classList.contains('hidden');
  return {
    f:active?Number(keys.has('KeyW'))-Number(keys.has('KeyS')):0,
    s:active?Number(keys.has('KeyD'))-Number(keys.has('KeyA')):0,
    j:active&&keys.has('Space'),c:active&&(keys.has('ControlLeft')||keys.has('KeyC')),
    shift:active&&keys.has('ShiftLeft'),fire:active&&mouseDown,use:active&&keys.has('KeyE'),
    yaw,pitch
  };
}
setInterval(()=>{if(inGame&&socket.connected)socket.emit('input',inputState());},33);
function updateCamera(dt,t){
  if(inGame && self && snapshot){
    if(self.alive){
      const state=inputState();
      if(state.f||state.s){
        const magnitude=Math.max(1,Math.hypot(state.f,state.s));
        const sp=(state.shift?6.2:4.5)*(state.c?.52:1)*dt/magnitude;
        const dx=(-Math.sin(yaw)*state.f+Math.cos(yaw)*state.s)*sp;
        const dz=(-Math.cos(yaw)*state.f-Math.sin(yaw)*state.s)*sp;
        const pos=moveWithCollision(worldMap,pred.x,pred.z,dx,dz);
        pred.x=pos.x;pred.z=pos.z;movementSway+=dt*12;
      }
      const bob=(state.f||state.s)?Math.sin(movementSway)*.035:0;
      camera.position.set(pred.x,1.61+pred.y+(state.c?-.32:0)+bob,pred.z);
      camera.rotation.set(pitch,yaw,0,'YXZ');
      gunKick=THREE.MathUtils.lerp(gunKick,0,Math.min(1,dt*12));
      viewGun.position.set(Math.sin(movementSway*.5)*.01,-gunKick*.5,gunKick);
      viewGun.rotation.x=gunKick;
      viewGun.visible=room.phase==='live'||room.phase==='buy';
    } else {
      viewGun.visible=false;
      const allies=snapshot.players.filter(p=>p.alive && p.team===room.players.find(q=>q.id===myId)?.team);
      const target=allies[0];
      if(target){
        camera.position.lerp(new THREE.Vector3(target.x+Math.sin(target.yaw)*4,3.2,target.z+Math.cos(target.yaw)*4),Math.min(1,dt*7));
        camera.lookAt(target.x,1.45,target.z);
      }else{
        camera.position.lerp(new THREE.Vector3(pred.x,12,pred.z+10),Math.min(1,dt*4));
        camera.lookAt(pred.x,0,pred.z);
      }
    }
  } else {
    viewGun.visible=false;
    camera.position.set(Math.cos(t*.075)*37,20,Math.sin(t*.075)*37);
    camera.lookAt(0,1.5,0);
  }
}
function animate(time){
  requestAnimationFrame(animate);
  const dt=Math.min(.06,(time-frameTime)/1000||.016);
  frameTime=time;elapsed+=dt;
  updateCamera(dt,time/1000);
  updateActors(snapshot?.players||[],dt);
  updateFx(dt);
  updateObjectives(time/1000);
  if(inGame){drawMinimap();updateHUD();}
  renderer.render(scene,camera);
}
buildMap('sand');
requestAnimationFrame(animate);
