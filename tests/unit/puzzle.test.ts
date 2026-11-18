import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PuzzleSystem } from '../../src/gameplay/PuzzleSystem.ts';
import { parseLevel, type GameAction } from '../../src/content/levelSchema.ts';

const level = parseLevel(JSON.parse(readFileSync('public/content/l01/level.json','utf8')));
test('authored level and safe whitelist load without arbitrary execution', () => {
  assert.equal(level.id,'l01_post_office');
  assert.equal(level.echoAnchors.length,2);
  assert.ok(level.puzzles.some(p=>p.when.interactId==='l01_efe_tape'));
  const tampered = JSON.parse(readFileSync('public/content/l01/level.json','utf8'));
  tampered.puzzles[0].then[0].type = 'eval';
  assert.throws(()=>parseLevel(tampered),/Unknown game action/);
});
test('mailbox tape / interior checkpoint / note / Efe flow is idempotent', () => {
  const flags = new Set<string>();
  const tape = new Set<string>();
  const actions: GameAction[] = [];
  const system = new PuzzleSystem(level.puzzles,flags,{apply: action => {
    actions.push(action);
    if (action.type === 'setFlag') flags.add(action.flag);
    if (action.type === 'grantTape') tape.add(action.tapeId);
  }});
  assert.equal(system.emit('interactId','l01_mailbox'),true);
  assert.equal(system.emit('interactId','l01_mailbox'),false);
  assert.ok(tape.has('bell'));
  assert.equal(system.emit('triggerId','l01_interior_trigger'),true);
  assert.ok(actions.some(a=>a.type==='checkpoint' && a.id==='cp_l01_interior'));
  system.emit('interactId','l01_note_counter');
  system.emit('interactId','l01_efe_tape');
  assert.ok(flags.has('l01_complete'));
  assert.equal(actions.filter(a=>a.type==='completeLevel').length,1);
  const restored = new PuzzleSystem(level.puzzles,flags,{apply: a => actions.push(a)});
  assert.equal(restored.emit('interactId','l01_efe_tape'),false);
});
