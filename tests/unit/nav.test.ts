import test from 'node:test';
import assert from 'node:assert/strict';
import { cellId, NavGraph } from '../../src/gameplay/NavGraph.ts';
import { findPath } from '../../src/gameplay/Pathfinding.ts';
import { NAV_LAYOUT, ENTRY_LINK_ID } from '../../src/gameplay/Stage1Layout.ts';

function graph() { return new NavGraph(NAV_LAYOUT); }

test('10x10 ground grid plus two upper cells have unique IDs and closed links', () => {
  const nav = graph();
  assert.equal(nav.nodes.size, 102);
  assert.equal(nav.nodes.get(cellId(7, 3, 1))?.worldY, 1.4);
  assert.equal(nav.links.get('l01_link_upper')?.enabled, false);
  assert.equal(nav.links.get(ENTRY_LINK_ID)?.enabled, false);
  assert.equal(nav.contains(-3.5, 2.5)?.id, cellId(1, 7));
  assert.equal(nav.contains(99, 0), null);
  assert.equal(nav.contains(2.5,-1.5,1)?.id,cellId(7,3,1));
  nav.setLinkEnabled('l01_link_upper',true);
  assert.ok(findPath(nav,cellId(7,3),cellId(8,3,1)));
  nav.setLinkEnabled('l01_link_upper',false);
  assert.equal(findPath(nav,cellId(7,3),cellId(8,3,1)),null);
});

test('4-way A* never diagonally cuts corners and routes around fence', () => {
  const nav = graph();
  const route = findPath(nav, cellId(1, 4), cellId(5, 4));
  assert.ok(route);
  assert.ok(route.length > 5, 'barrier must force a detour');
  for (let i = 1; i < route.length; i++) assert.equal(
    Math.abs(route[i].x - route[i-1].x) + Math.abs(route[i].z - route[i-1].z), 1);
});

test('closed post office remains unreachable, only its explicit link opens it', () => {
  const nav = graph();
  const outside = cellId(6, 4), inside = cellId(7, 4);
  assert.equal(nav.canTraverse(outside, inside), false);
  assert.equal(findPath(nav, cellId(3, 8), inside), null);
  nav.setLinkEnabled(ENTRY_LINK_ID, true);
  assert.equal(nav.canTraverse(outside, inside), true);
  assert.ok(findPath(nav, cellId(3, 8), inside));
  nav.setLinkEnabled(ENTRY_LINK_ID, false);
  assert.equal(findPath(nav, cellId(3, 8), inside), null);
  assert.equal(nav.revision, 2);
});

test('50 click targets yield safe paths or explicit failures, never inaccessible jumps', () => {
  const nav = graph();
  const start = cellId(1, 7);
  for (let i = 0; i < 50; i++) {
    const target = nav.nearest((i * 7 % 10) - 4.5, (i * 3 % 10) - 4.5)!;
    const route = findPath(nav, start, target.id);
    if (!route) continue;
    for (let j = 1; j < route.length; j++) assert.equal(nav.canTraverse(route[j-1].id, route[j].id), true);
  }
});

test('different floors cannot connect without an explicit stair/platform link', () => {
  const a = { id: 'floor0:0:0', x: 0, z: 0, worldY: 0, floorIndex: 0, walkable: true };
  const b = { id: 'floor1:0:0', x: 0, z: 0, worldY: 3, floorIndex: 1, walkable: true };
  const nav = new NavGraph({ nodes: [a, b], barriers: [], links: [
    { id: 'stairs1', from: a.id, to: b.id, kind: 'stairs', enabled: false },
  ] });
  assert.equal(findPath(nav, a.id, b.id), null);
  nav.setLinkEnabled('stairs1', true);
  assert.deepEqual(findPath(nav, a.id, b.id)?.map(n => n.id), [a.id, b.id]);
});

test('invalid/missing/duplicate IDs are build-time test errors', () => {
  assert.throws(() => new NavGraph({ nodes: NAV_LAYOUT.nodes, barriers: [], links: [
    { id: 'bad', from: 'absent', to: cellId(1, 1), enabled: false, kind: 'door' },
  ] }), /Missing nav node/);
  assert.throws(() => new NavGraph({ nodes: [NAV_LAYOUT.nodes[0], NAV_LAYOUT.nodes[0]], barriers: [], links: [] }), /Duplicate nav node/);
});
