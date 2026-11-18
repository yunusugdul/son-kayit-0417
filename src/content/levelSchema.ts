import type { EchoAnchorDef, EchoGroupDef, TapeId } from '../gameplay/EchoSystem.ts';

export type GameAction =
  | { type: 'setFlag'; flag: string }
  | { type: 'grantTape'; tapeId: TapeId }
  | { type: 'activateEcho'; anchorId: string }
  | { type: 'setObjectVisible'; objectId: string; visible: boolean }
  | { type: 'setNavLink'; linkId: string; enabled: boolean }
  | { type: 'story'; key: string }
  | { type: 'checkpoint'; id: string }
  | { type: 'completeLevel' }
  | { type: 'showMessage'; key: string };

export interface PuzzleDef {
  id: string;
  when: { triggerId?: string; interactId?: string };
  then: GameAction[];
}
export interface LevelDefinition {
  schemaVersion: 1;
  id: string;
  titleKey: string;
  assetManifest: string;
  spawn: { checkpointId: string; position: [number, number, number] };
  checkpoints: Array<{ id: string; position: [number, number, number]; requiredFlags?: string[] }>;
  echoAnchors: EchoAnchorDef[];
  echoGroups: EchoGroupDef[];
  puzzles: PuzzleDef[];
}
const ACTIONS = new Set(['setFlag', 'grantTape', 'activateEcho', 'setObjectVisible', 'setNavLink',
  'story', 'checkpoint', 'completeLevel', 'showMessage']);
const identifier = (value: unknown): value is string => typeof value === 'string' && /^[a-z][a-z0-9_.]*$/.test(value);
const point = (value: unknown): value is [number, number, number] =>
  Array.isArray(value) && value.length === 3 && value.every(n => typeof n === 'number' && Number.isFinite(n));

/** Validate authored JSON before allowing it to execute the small, explicit action set. */
export function parseLevel(raw: unknown): LevelDefinition {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid level JSON');
  const v = raw as Record<string, unknown>;
  if (v.schemaVersion !== 1 || v.id !== 'l01_post_office' || !identifier(v.titleKey) ||
    !identifier(v.assetManifest) && v.assetManifest !== 'content/l01/manifest.json' ||
    !Array.isArray(v.checkpoints) || !Array.isArray(v.echoAnchors) ||
    !Array.isArray(v.echoGroups) || !Array.isArray(v.puzzles)) throw new Error('Invalid level header');
  const spawn = v.spawn as Record<string, unknown> | null;
  if (!spawn || !identifier(spawn.checkpointId) || !point(spawn.position)) throw new Error('Invalid spawn');
  const checkpoints = v.checkpoints as Array<Record<string, unknown>>;
  if (!checkpoints.every(cp => identifier(cp.id) && point(cp.position) &&
    (cp.requiredFlags === undefined || Array.isArray(cp.requiredFlags) && cp.requiredFlags.every(identifier))))
    throw new Error('Invalid checkpoint');
  if (!checkpoints.some(cp => cp.id === spawn.checkpointId)) throw new Error('Missing initial checkpoint');
  const anchors = v.echoAnchors as Array<Record<string, unknown>>;
  const groups = v.echoGroups as Array<Record<string, unknown>>;
  if (!anchors.every(a => identifier(a.id) && identifier(a.tapeId) && identifier(a.echoGroupId) &&
    [a.activeSeconds,a.cooldownSeconds,a.activationRadius].every(n => typeof n === 'number' && Number.isFinite(n)) &&
    (a.requiredFlags === undefined || Array.isArray(a.requiredFlags) && a.requiredFlags.every(identifier))) ||
    !groups.every(g => identifier(g.id) && Array.isArray(g.objectIds) && g.objectIds.every(identifier) &&
      (g.navigationLinkIds === undefined || Array.isArray(g.navigationLinkIds) && g.navigationLinkIds.every(identifier))))
    throw new Error('Invalid echo definitions');
  const puzzles = v.puzzles as Array<Record<string, unknown>>;
  const keys = new Set<string>();
  for (const p of puzzles) {
    const when = p.when as Record<string, unknown> | undefined;
    if (!identifier(p.id) || keys.has(p.id) || !when ||
      Number(identifier(when.interactId)) + Number(identifier(when.triggerId)) !== 1 ||
      !Array.isArray(p.then)) throw new Error('Invalid puzzle');
    keys.add(p.id);
    for (const item of p.then as Array<Record<string, unknown>>) {
      if (!item || !ACTIONS.has(String(item.type))) throw new Error('Unknown game action');
      const required = ({setFlag:'flag',grantTape:'tapeId',activateEcho:'anchorId',
        setObjectVisible:'objectId',setNavLink:'linkId',story:'key',checkpoint:'id',
        completeLevel:null,showMessage:'key'} as Record<string, string | null>)[String(item.type)];
      if (required && !identifier(item[required])) throw new Error('Invalid game action identifier');
      if ((item.type === 'setNavLink' || item.type === 'setObjectVisible') && typeof item.enabled !== 'boolean' &&
          typeof item.visible !== 'boolean') throw new Error('Invalid action boolean');
    }
  }
  return v as unknown as LevelDefinition;
}
