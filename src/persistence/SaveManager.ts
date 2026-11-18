import type { TapeId } from '../gameplay/EchoSystem.ts';

export interface GameSave {
  schemaVersion: 1;
  levelId: 'l01_post_office';
  checkpointId: 'cp_l01_start' | 'cp_l01_interior';
  flags: string[];
  tapes: TapeId[];
  completedLevels: string[];
  savedAt: string;
}
const SAVE_KEY = 'son-kayit-0417/save/v1';
const FLAGS = new Set(['l01_started','l01_tape_found','l01_interior_reached','l01_note_read','l01_record_found','l01_complete']);
const TAPES = new Set<TapeId>(['bell']);
const CHECKPOINTS = new Set(['cp_l01_start','cp_l01_interior']);
const unique = (items: string[]): boolean => new Set(items).size === items.length;
export function validateSave(raw: unknown): GameSave {
  if (!raw || typeof raw !== 'object') throw new Error('Bozuk kayıt');
  const v = raw as Record<string, unknown>;
  if (v.schemaVersion !== 1 || v.levelId !== 'l01_post_office' ||
      !CHECKPOINTS.has(String(v.checkpointId)) ||
      !Array.isArray(v.flags) || !v.flags.every(f => typeof f === 'string' && FLAGS.has(f)) ||
      !unique(v.flags) || !Array.isArray(v.tapes) || !v.tapes.every(t => TAPES.has(t)) ||
      !unique(v.tapes) || !Array.isArray(v.completedLevels) ||
      !v.completedLevels.every(s => s === 'l01_post_office') || !unique(v.completedLevels) ||
      typeof v.savedAt !== 'string' || v.savedAt.length > 64) throw new Error('Geçersiz kayıt şeması');
  const flags = new Set(v.flags);
  if (v.checkpointId === 'cp_l01_interior' && !flags.has('l01_interior_reached') ||
      flags.has('l01_interior_reached') && !flags.has('l01_tape_found') ||
      flags.has('l01_note_read') && !flags.has('l01_interior_reached') ||
      flags.has('l01_record_found') && !flags.has('l01_note_read') ||
      flags.has('l01_complete') !== v.completedLevels.includes('l01_post_office') ||
      flags.has('l01_tape_found') !== v.tapes.includes('bell')) throw new Error('Çelişkili kayıt durumu');
  return {
    schemaVersion: 1, levelId: 'l01_post_office', checkpointId: v.checkpointId as GameSave['checkpointId'],
    flags: [...v.flags], tapes: [...v.tapes], completedLevels: [...v.completedLevels], savedAt: v.savedAt,
  };
}
export function blankSave(): GameSave {
  return {schemaVersion:1,levelId:'l01_post_office',checkpointId:'cp_l01_start',
    flags:['l01_started'],tapes:[],completedLevels:[],savedAt:new Date().toISOString()};
}
export class SaveManager {
  private memory: GameSave | null = null;
  readonly storage: Storage | null;
  storageFailed = false;
  constructor(storage?: Storage | null) {
    if (storage !== undefined) this.storage = storage;
    else {
      let found: Storage | null = null;
      try { found = window.localStorage; } catch { this.storageFailed = true; }
      this.storage = found;
    }
  }
  load(): GameSave | null {
    try {
      const json = this.storage?.getItem(SAVE_KEY);
      if (!json) return this.memory;
      return this.memory = validateSave(JSON.parse(json));
    } catch {
      this.storageFailed = true;
      return this.memory;
    }
  }
  save(raw: GameSave): GameSave {
    const next = validateSave({...raw,savedAt:new Date().toISOString()});
    this.memory = next;
    try { this.storage?.setItem(SAVE_KEY,JSON.stringify(next)); }
    catch { this.storageFailed = true; }
    if (!this.storage) this.storageFailed = true;
    return next;
  }
  importJson(json: string): GameSave {
    if (json.length > 32768) throw new Error('Kayıt dosyası çok büyük');
    const parsed = validateSave(JSON.parse(json));
    return this.save(parsed);
  }
  exportJson(): string { return JSON.stringify(this.load() ?? blankSave(),null,2); }
  clear(): void {
    this.memory = null;
    try { this.storage?.removeItem(SAVE_KEY); } catch { this.storageFailed = true; }
  }
}
