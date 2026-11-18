export const TICK_RATE = 30;
export const SNAP_RATE = 12;
export const MAX_TEAM = 5;
export const MAX_SCORE = 8;
export const BUY_TIME = 16;
export const ROUND_TIME = 135;
export const BOMB_TIME = 40;
export const INTERMISSION = 6;
export const PLAYER_RADIUS = 0.37;
export const SPEED = 4.5;
export const SPRINT_SPEED = 6.2;

export const WEAPONS = {
  pistol: { name: 'Raven 9', category: 'secondary', price: 0, damage: 24, head: 2.1, rate: 0.29, clip: 15, reserve: 60, reload: 1.4, spread: 0.017, range: 58 },
  smg: { name: 'Vektor SMG', category: 'primary', price: 1250, damage: 17, head: 1.8, rate: 0.085, clip: 30, reserve: 120, reload: 1.9, spread: 0.039, range: 42 },
  rifle: { name: 'AR-41', category: 'primary', price: 2700, damage: 32, head: 2.0, rate: 0.108, clip: 30, reserve: 90, reload: 2.3, spread: 0.021, range: 90 },
  sniper: { name: 'Longshot', category: 'primary', price: 4700, damage: 90, head: 1.6, rate: 1.4, clip: 5, reserve: 20, reload: 2.9, spread: 0.002, range: 130 },
  shotgun: { name: 'Bulldog 12', category: 'primary', price: 1900, damage: 13, head: 1.25, rate: 0.95, clip: 8, reserve: 32, reload: 2.8, spread: 0.095, pellets: 8, range: 30 },
  lmg: { name: 'Bastion', category: 'primary', price: 3900, damage: 25, head: 1.75, rate: 0.09, clip: 60, reserve: 120, reload: 4, spread: 0.047, range: 78 },
  knife: { name: 'Combat Knife', category: 'melee', price: 0, damage: 65, head: 1, rate: 0.65, clip: 1, reserve: 0, reload: 0, spread: 0, range: 2.1 },
  grenade: { name: 'Frag Grenade', category: 'utility', price: 300, damage: 85, head: 1, rate: 1, clip: 1, reserve: 0, reload: 0, spread: 0, range: 8 }
};

const sand = [
  [-11,-8,6,2,4,'sand'],[-9,3,3,9,4,'sand'],[0,-9,8,3,3,'sand'],
  [9,-6,3,9,4,'sand'],[10,10,8,3,4,'sand'],[-13,12,6,3,3,'sand'],
  [-2,6,3,5,3,'sand'],[2,15,4,3,3,'sand'],
  [-17,-1,2.8,2.8,2,'crate'],[2,-1,2.6,2.6,2,'crate'],
  [15,3,3,3,2,'crate'],[-4,15,2,2,2,'crate'],[-20,15,3,3,2,'crate'],
  [17,-16,2.5,2.5,2,'crate'],[-3,-17,2.5,2.5,2,'crate']
];
const harbor = [
  [-12,-8,3,12,4,'steel'],[0,-9,10,3,3,'steel'],[12,-11,3,10,4,'steel'],
  [-11,9,9,3,3,'steel'],[12,7,8,3,3,'steel'],[0,14,3,8,3,'steel'],
  [-2,4,3,5,3,'steel'],[6,-1,3,5,3,'steel'],
  [-19,0,5,2.6,2.7,'container'],[-19,3.1,5,2.6,2.7,'container'],
  [18,0,5,2.8,2.7,'container'],[16,14,6,3,2.7,'container'],
  [-4,-17,6,2.8,2.7,'container'],[-20,17,5,2.8,2.7,'container'],
  [1,0,2.5,2.5,2,'crate'],[-4,12,2.5,2.5,2,'crate']
];
const foundry = [
  [-13,-10,5,8,4,'brick'],[0,-13,7,3,4,'brick'],[13,-8,5,10,4,'brick'],
  [-12,11,6,4,4,'brick'],[9,11,8,4,4,'brick'],[0,2,3,9,3,'brick'],
  [-3,16,5,3,4,'brick'],[17,2,3,4,3,'brick'],
  [-19,0,3,3,2,'crate'],[18,-18,3,3,2,'crate'],
  [8,1,3,3,2,'crate'],[-5,-2,3,3,2,'crate'],[-18,18,3,3,2,'crate'],
  [3,19,3,3,2,'crate'],[17,17,3,3,2,'crate']
];

export const MAPS = {
  sand: {
    id: 'sand', name: 'Dust Quarter', subtitle: 'Çöl sokakları', theme: 'sand',
    ground: 0xc5a46e, sky: 0xcad9da, fog: 0xcad9da, size: 32,
    blocks: sand,
    spawns: {
      A: [[-25,-23],[-23,-26],[-27,-20],[-20,-25],[-27,-26]],
      B: [[24,23],[22,26],[27,20],[20,25],[27,26]]
    },
    sites: [{ id:'A', x:-19, z:17, r:4 },{ id:'B', x:19, z:-19, r:4 }]
  },
  harbor: {
    id:'harbor', name:'Dockyard', subtitle:'Liman konteynerleri', theme:'harbor',
    ground:0x627582, sky:0x9ac4d4, fog:0x9ac4d4, size:32,
    blocks: harbor,
    spawns: {
      A: [[-25,-24],[-22,-26],[-28,-22],[-20,-24],[-27,-27]],
      B: [[25,24],[23,27],[28,21],[21,25],[28,27]]
    },
    sites:[{id:'A',x:-21,z:15,r:4},{id:'B',x:21,z:-19,r:4}]
  },
  foundry: {
    id:'foundry', name:'Ironworks', subtitle:'Endüstriyel fabrika', theme:'foundry',
    ground:0x77746f, sky:0xb8b3a7, fog:0xb8b3a7, size:32,
    blocks: foundry,
    spawns: {
      A:[[-25,-23],[-23,-27],[-28,-21],[-21,-24],[-27,-27]],
      B:[[25,23],[23,27],[28,21],[21,24],[27,27]]
    },
    sites:[{id:'A',x:-21,z:19,r:4},{id:'B',x:21,z:-18,r:4}]
  }
};
export const MAP_IDS = Object.keys(MAPS);
export function clamp(n, lo, hi) { return Math.min(hi,Math.max(lo,n)); }
export function finite(n, fallback = 0) { return typeof n === 'number' && Number.isFinite(n) ? n : fallback; }
export function isWall(map,x,z,r=PLAYER_RADIUS) {
  if(Math.abs(x) > map.size-1-r || Math.abs(z)>map.size-1-r) return true;
  return map.blocks.some(b=> Math.abs(x-b[0]) < b[2]/2+r && Math.abs(z-b[1]) < b[3]/2+r);
}
export function moveWithCollision(map,x,z,dx,dz,r=PLAYER_RADIUS) {
  const nx = !isWall(map,x+dx,z,r) ? x+dx : x;
  const nz = !isWall(map,nx,z+dz,r) ? z+dz : z;
  return {x:nx,z:nz};
}
export function rayBox(origin,dir,min,max) {
  let near = 0, far = Infinity;
  for(let i=0;i<3;i++){
    if(Math.abs(dir[i])<1e-8){ if(origin[i]<min[i] || origin[i]>max[i])return Infinity; continue; }
    let t1=(min[i]-origin[i])/dir[i],t2=(max[i]-origin[i])/dir[i];
    if(t1>t2){const t=t1;t1=t2;t2=t;}
    near=Math.max(near,t1);far=Math.min(far,t2);
    if(near>far)return Infinity;
  }
  return near;
}
export function wallDistance(map,origin,dir,maxRange=120) {
  let nearest=maxRange;
  for(const b of map.blocks) {
    const t=rayBox(origin,dir,[b[0]-b[2]/2,0,b[1]-b[3]/2],[b[0]+b[2]/2,b[4],b[1]+b[3]/2]);
    if(t<nearest)nearest=t;
  }
  const s=map.size-1;
  for(const box of [[-s-0.5,0,0,1,4,2*s+1],[s+0.5,0,0,1,4,2*s+1],[0,0,-s-0.5,2*s+1,4,1],[0,0,s+0.5,2*s+1,4,1]]){
    const t=rayBox(origin,dir,[box[0]-box[3]/2,box[1],box[2]-box[5]/2],[box[0]+box[3]/2,box[1]+box[4],box[2]+box[5]/2]);
    nearest=Math.min(nearest,t);
  }
  return nearest;
}
export function playerIntersection(origin,dir,p) {
  const y=finite(p.y);
  const torso=rayBox(origin,dir,[p.x-0.38,0.42+y,p.z-0.27],[p.x+0.38,1.5+y,p.z+0.27]);
  const head=rayBox(origin,dir,[p.x-0.25,1.48+y,p.z-0.25],[p.x+0.25,1.91+y,p.z+0.25]);
  return head<torso ? {distance:head, headshot:true} : {distance:torso,headshot:false};
}
export function distance2(a,b){return Math.hypot(a.x-b.x,a.z-b.z);}
export function canPlant(map,p) {return map.sites.find(s=>Math.hypot(p.x-s.x,p.z-s.z)<=s.r);}
export function sanitizeName(name) {return String(name||'Oyuncu').replace(/[^a-zA-Z0-9_ÇĞİÖŞÜçğıöşü -]/g,'').trim().slice(0,18)||'Oyuncu';}
