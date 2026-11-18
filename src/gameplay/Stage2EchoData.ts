import type { EchoAnchorDef, EchoGroupDef } from './EchoSystem.ts';

/** L01 echo A is playable in Stage 2. B is declared for Stage 3 story-flag integration. */
export const L01_ECHO_ANCHORS: EchoAnchorDef[] = [
  {
    id: 'l01_echo_a', tapeId: 'bell', echoGroupId: 'l01_entry',
    activeSeconds: 12, cooldownSeconds: 1.5, activationRadius: 1.6,
  },
  {
    id: 'l01_echo_b', tapeId: 'bell', echoGroupId: 'l01_stairs',
    activeSeconds: 12, cooldownSeconds: 1.5, activationRadius: 1.6,
    requiredFlags: ['l01_note_read'],
  },
];
export const L01_ECHO_GROUPS: EchoGroupDef[] = [
  {
    id: 'l01_entry', objectIds: ['l01_door_main'],
    navigationLinkIds: ['l01_link_entry'], protectedVolumeIds: ['l01_door_main_passage'],
  },
  {
    id: 'l01_stairs', objectIds: ['l01_stair_a', 'l01_stair_b'],
    navigationLinkIds: ['l01_link_upper'], supportObjectIds: ['l01_stair_a', 'l01_stair_b'],
  },
];
