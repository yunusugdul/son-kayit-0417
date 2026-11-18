import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankSave, SaveManager, validateSave } from '../../src/persistence/SaveManager.ts';

function memoryStorage(): Storage {
  const content = new Map<string,string>();
  return {
    get length() { return content.size; },
    clear: () => content.clear(),
    getItem: key => content.get(key) ?? null,
    setItem: (key,value) => { content.set(key,value); },
    removeItem: key => { content.delete(key); },
    key: index => [...content.keys()][index] ?? null,
  };
}
test('v1 checkpoint and inventory survive a page reload', () => {
  const storage = memoryStorage();
  const save = blankSave();
  save.flags.push('l01_tape_found','l01_interior_reached','l01_note_read');
  save.tapes.push('bell');
  save.checkpointId = 'cp_l01_interior';
  new SaveManager(storage).save(save);
  const resumed = new SaveManager(storage).load();
  assert.equal(resumed?.checkpointId,'cp_l01_interior');
  assert.deepEqual(resumed?.tapes,['bell']);
  assert.ok(resumed?.flags.includes('l01_note_read'));
});
test('malformed imports cannot overwrite a valid save', () => {
  const storage = memoryStorage();
  const manager = new SaveManager(storage);
  const saved = manager.save(blankSave());
  assert.throws(() => manager.importJson(JSON.stringify({...saved,checkpointId:'cp_l01_interior'})));
  assert.throws(() => manager.importJson(JSON.stringify({...saved,flags:['<script>']})));
  assert.throws(() => manager.importJson('{corrupt'));
  assert.equal(manager.load()?.checkpointId,'cp_l01_start');
});
test('completion, tape and checkpoint invariants reject impossible states', () => {
  assert.throws(() => validateSave({...blankSave(),flags:['l01_started','l01_complete']}));
  assert.throws(() => validateSave({...blankSave(),flags:['l01_started','l01_tape_found']}));
  assert.throws(() => validateSave({...blankSave(),flags:['l01_started','l01_note_read']}));
});
test('blocked browser storage retains playable in-memory save and warns', () => {
  const broken = {getItem: () => {throw Error('denied');},setItem: () => {throw Error('denied');},removeItem: () => {throw Error('denied');}} as unknown as Storage;
  const manager = new SaveManager(broken);
  const saved = manager.save(blankSave());
  assert.equal(manager.load()?.savedAt,saved.savedAt);
  assert.equal(manager.storageFailed,true);
});
