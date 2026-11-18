import test from 'node:test';
import assert from 'node:assert/strict';
import { EchoSystem, type EchoAnchorDef, type EchoGroupDef } from '../../src/gameplay/EchoSystem.ts';
import { L01_ECHO_ANCHORS, L01_ECHO_GROUPS } from '../../src/gameplay/Stage2EchoData.ts';

const group: EchoGroupDef = { id: 'gate', objectIds: ['gate_mesh'], navigationLinkIds: ['gate_link'], protectedVolumeIds: ['passage'], supportObjectIds: ['stairs'] };
const anchor: EchoAnchorDef = { id: 'a', tapeId: 'bell', echoGroupId: 'gate', activeSeconds: 12, cooldownSeconds: 1.5, activationRadius: 1.6 };
const flags = new Set<string>();
const safe = () => false;
function make() { return new EchoSystem([anchor], [group]); }

function expectPhase(echo: EchoSystem, phase: string) { assert.equal(echo.snapshot.phase, phase); }
test('wrong cassette, distance, unknown anchor and required flags reject without changing scene', () => {
  const echo = new EchoSystem([...L01_ECHO_ANCHORS], [...L01_ECHO_GROUPS]);
  assert.equal(echo.activate('missing', 'bell', 0, flags), 'unknown-anchor');
  assert.equal(echo.activate('l01_echo_a', 'oven', 0, flags), 'wrong-tape');
  assert.equal(echo.activate('l01_echo_a', 'bell', 1.61, flags), 'out-of-range');
  assert.equal(echo.activate('l01_echo_b', 'bell', 0.2, flags), 'missing-flag');
  expectPhase(echo, 'inactive');
});
test('0.4 materialize -> 12 active -> 0.6 fade -> 1.5 cooldown -> inactive, repeat does not reset time', () => {
  const echo = make();
  const phases: string[] = [];
  echo.onPhaseChange = snap => phases.push(snap.phase);
  assert.equal(echo.activate('a', 'bell', 1.6, flags), 'started');
  echo.fixedUpdate(0.2, safe);
  assert.equal(echo.snapshot.traversable, false);
  assert.ok(Math.abs(echo.snapshot.visualProgress - 0.5) < 1e-7);
  echo.fixedUpdate(0.2, safe);
  expectPhase(echo, 'active');
  echo.fixedUpdate(3, safe);
  assert.equal(echo.activate('a', 'bell', 1, flags), 'already-active');
  assert.equal(echo.snapshot.secondsRemaining, 9);
  echo.fixedUpdate(9, safe);
  expectPhase(echo, 'fading');
  assert.equal(echo.snapshot.traversable, false);
  echo.fixedUpdate(0.6, safe);
  expectPhase(echo, 'cooldown');
  assert.equal(echo.activate('a', 'bell', 1, flags), 'cooldown');
  echo.fixedUpdate(1.5, safe);
  expectPhase(echo, 'inactive');
  assert.deepEqual(phases, ['materializing', 'active', 'fading', 'cooldown', 'inactive']);
});
test('SAFE_HOLD retains support and passage until player reaches fixed ground', () => {
  const echo = make();
  let protectedArea = true;
  assert.equal(echo.activate('a', 'bell', 0, flags), 'started');
  echo.fixedUpdate(12.4, () => protectedArea);
  expectPhase(echo, 'safe_hold');
  assert.equal(echo.snapshot.traversable, true);
  echo.fixedUpdate(100, () => protectedArea);
  expectPhase(echo, 'safe_hold');
  protectedArea = false;
  echo.fixedUpdate(0, () => protectedArea);
  expectPhase(echo, 'fading');
  echo.fixedUpdate(0.6, safe);
  expectPhase(echo, 'cooldown');
});
test('pause/hidden tab produces no time changes when fixedUpdate is not called', () => {
  const echo = make();
  echo.activate('a', 'bell', 0, flags);
  echo.fixedUpdate(0.4, safe);
  const snapshot = echo.snapshot;
  // Simulated page hidden: application deliberately does not call fixedUpdate.
  assert.deepEqual(echo.snapshot, snapshot);
  echo.fixedUpdate(1 / 60, safe);
  assert.ok(echo.snapshot.secondsRemaining < 12);
});
test('one active group at a time; flag unlocks second anchor after first fully expires', () => {
  const echo = new EchoSystem([...L01_ECHO_ANCHORS], [...L01_ECHO_GROUPS]);
  const unlocked = new Set(['l01_note_read']);
  assert.equal(echo.activate('l01_echo_a', 'bell', 0, unlocked), 'started');
  assert.equal(echo.activate('l01_echo_b', 'bell', 0, unlocked), 'busy');
  echo.fixedUpdate(14.5, safe);
  assert.equal(echo.snapshot.phase, 'inactive');
  assert.equal(echo.activate('l01_echo_b', 'bell', 0, unlocked), 'started');
});
test('oneShot anchors remain consumed after cooldown', () => {
  const echo = new EchoSystem([{ ...anchor, oneShot: true }], [group]);
  echo.activate('a', 'bell', 0, flags);
  echo.fixedUpdate(14.5, safe);
  assert.equal(echo.activate('a', 'bell', 0, flags), 'used');
});
test('invalid group references, durations, duplicates and deltaTime are rejected', () => {
  assert.throws(() => new EchoSystem([{ ...anchor, echoGroupId: 'x' }], [group]), /Missing echo group/);
  assert.throws(() => new EchoSystem([anchor, anchor], [group]), /Duplicate echo anchor/);
  assert.throws(() => new EchoSystem([anchor], [group, group]), /Duplicate echo group/);
  assert.throws(() => new EchoSystem([{ ...anchor, activeSeconds: 1 }], [group]), /Invalid echo duration/);
  assert.throws(() => make().fixedUpdate(-1, safe), /Invalid echo deltaTime/);
});
test('echo transition callback allows atomic nav+visual synchronization', () => {
  const echo = make();
  const enabled: boolean[] = [];
  echo.onPhaseChange = snap => enabled.push(snap.traversable);
  echo.activate('a', 'bell', 0, flags);
  echo.fixedUpdate(0.4, safe);
  echo.fixedUpdate(12, safe);
  assert.deepEqual(enabled, [false, true, false]);
});

// Shared adapters ensure visual-only changes never leave a phantom physical door.
import { EchoPassage } from '../../src/gameplay/EchoPassage.ts';
import { NavGraph } from '../../src/gameplay/NavGraph.ts';
import { NAV_LAYOUT, SOLID_RECTS, ENTRY_LINK_ID } from '../../src/gameplay/Stage1Layout.ts';
test('navigation edge and collider open/close atomically; interior latch keeps escape after expiration', () => {
  const nav = new NavGraph(NAV_LAYOUT);
  const solids = SOLID_RECTS.map(rect => ({ ...rect }));
  const doorCollider = solids[2];
  const passage = new EchoPassage(nav, solids, doorCollider, ENTRY_LINK_ID);
  const echo = make();
  echo.onPhaseChange = state => passage.apply(state);
  passage.apply(echo.snapshot);
  assert.equal(passage.isPassable, false);
  assert.equal(solids.includes(doorCollider), true);
  echo.activate('a', 'bell', 1, flags);
  assert.equal(passage.isPassable, false);
  echo.fixedUpdate(.4, safe);
  assert.equal(nav.links.get(ENTRY_LINK_ID)?.enabled, true);
  assert.equal(solids.includes(doorCollider), false);
  passage.latch();
  echo.fixedUpdate(12.6, safe);
  assert.equal(echo.snapshot.phase, 'cooldown');
  assert.equal(passage.isPassable, true);
  assert.equal(solids.includes(doorCollider), false);
});
test('SAFE_HOLD retains gate collision and link until safe landing is confirmed', () => {
  const nav = new NavGraph(NAV_LAYOUT);
  const solids = SOLID_RECTS.map(rect => ({ ...rect }));
  const doorCollider = solids[2];
  const passage = new EchoPassage(nav, solids, doorCollider, ENTRY_LINK_ID);
  const echo = make();
  echo.onPhaseChange = state => passage.apply(state);
  echo.activate('a', 'bell', .5, flags);
  echo.fixedUpdate(12.4, () => true);
  assert.equal(echo.snapshot.phase, 'safe_hold');
  assert.equal(nav.links.get(ENTRY_LINK_ID)?.enabled, true);
  assert.equal(solids.includes(doorCollider), false);
  echo.fixedUpdate(0, safe);
  assert.equal(echo.snapshot.phase, 'fading');
  assert.equal(nav.links.get(ENTRY_LINK_ID)?.enabled, false);
  assert.equal(solids.includes(doorCollider), true);
});
