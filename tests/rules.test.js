import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAPS, MAP_IDS, WEAPONS, MAX_TEAM, MAX_SCORE, clamp, finite, isWall,
  moveWithCollision, rayBox, wallDistance, playerIntersection, canPlant, sanitizeName
} from '../shared/rules.js';

test('three playable, different maps exist',()=>{
  assert.equal(MAP_IDS.length,3);
  assert.equal(new Set(MAP_IDS.map(k=>MAPS[k].name)).size,3);
  for(const m of Object.values(MAPS)){
    assert.equal(m.sites.length,2);
    assert.ok(m.blocks.length>10);
    assert.equal(m.spawns.A.length,MAX_TEAM);
    assert.equal(m.spawns.B.length,MAX_TEAM);
    for(const side of ['A','B'])
      for(const [x,z] of m.spawns[side])assert.equal(isWall(m,x,z),false,'spawn blocked on '+m.id);
    for(const site of m.sites)assert.ok(!isWall(m,site.x,site.z),'site blocked on '+m.id);
  }
});
test('weapons have valid ammo, prices and fire rates',()=>{
  assert.ok(Object.keys(WEAPONS).length>=8);
  for(const w of Object.values(WEAPONS)){
    assert.ok(w.damage>0 && w.rate>0 && w.range>0);
    assert.ok(w.clip>0 && w.price>=0);
  }
  assert.equal(MAX_SCORE,8);
});
test('collision prevents walking through walls and allows clear lanes',()=>{
  const m=MAPS.sand;
  assert.ok(isWall(m, -11,-8));
  assert.equal(isWall(m,-25,-23),false);
  const blocked=moveWithCollision(m,-25,-23,100,0);
  assert.equal(blocked.x,-25);
  const allowed=moveWithCollision(m,-25,-23,0,1);
  assert.equal(allowed.z,-22);
});
test('ray intersection and cover stop hits',()=>{
  assert.equal(rayBox([0,1,0],[0,0,-1],[-1,0,-5],[1,2,-3]),3);
  assert.equal(rayBox([0,1,0],[0,0,-1],[4,0,-5],[5,2,-3]),Infinity);
  const hit=playerIntersection([0,1.65,0],[0,0,-1],{x:0,z:-5});
  assert.equal(hit.headshot,true);
  assert.ok(hit.distance>4 && hit.distance<6);
  const cover=wallDistance(MAPS.sand,[-11,1,-14],[0,0,1],50);
  assert.ok(cover<14);
});
test('bomb sites, strings, numeric validation',()=>{
  assert.equal(canPlant(MAPS.sand,{x:-19,z:17})?.id,'A');
  assert.equal(canPlant(MAPS.sand,{x:0,z:0}),undefined);
  assert.equal(sanitizeName('<script>'), 'script');
  assert.equal(sanitizeName('a'.repeat(50)).length,18);
  assert.equal(finite(Number.POSITIVE_INFINITY,12),12);
  assert.equal(clamp(8,0,5),5);
});
