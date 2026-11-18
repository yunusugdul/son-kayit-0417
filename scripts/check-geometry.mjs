import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const file = readFileSync('public/content/l01/geometry.glb');
assert.equal(file.toString('ascii', 0, 4), 'glTF', 'GLB magic');
assert.equal(file.readUInt32LE(4), 2, 'GLB must be glTF 2.0');
assert.equal(file.readUInt32LE(8), file.length, 'GLB length');
assert.equal(file.readUInt32LE(16), 0x4E4F534A, 'First chunk must be JSON');
const json = JSON.parse(file.toString('utf8', 20, 20 + file.readUInt32LE(12)));
const ids = json.nodes.map(node => node.name).filter(Boolean);
const required = [
  'l01_wall_west_south', 'l01_wall_west_north', 'l01_wall_east',
  'l01_wall_north', 'l01_wall_south', 'l01_door_main',
  'l01_fence', 'l01_mailbox', 'l01_sign',
];
assert.equal(new Set(ids).size, ids.length, 'Duplicate GLB node names');
for (const id of required) assert.ok(ids.includes(id), `Missing mesh ID: ${id}`);
console.log(`GLB verified: ${file.length} bytes, ${ids.length} named nodes, ${required.length} required IDs`);
