import { cellId, type NavLayout } from './NavGraph.ts';

/** 10×10 m safe graybox. A closed door is a disabled explicit edge, never an implicit floor edge. */
export const ENTRY_LINK_ID = 'l01_link_entry';
export const NAV_LAYOUT: NavLayout = (() => {
  const nodes = Array.from({ length: 100 }, (_, n) => ({
    id: cellId(n % 10, Math.floor(n / 10)),
    x: n % 10 - 4.5,
    z: Math.floor(n / 10) - 4.5,
    worldY: 0,
    floorIndex: 0,
    walkable: true,
  }));
  const barriers: Array<readonly [string, string]> = [];
  const barrier = (a: number, b: number, c: number, d: number) => barriers.push([cellId(a, b), cellId(c, d)]);
  // Post office perimeter: west, east, north and south boundaries of the inner 2×4 cells.
  for (let j = 2; j <= 5; j++) { barrier(6, j, 7, j); barrier(8, j, 9, j); }
  for (let i = 7; i <= 8; i++) { barrier(i, 1, i, 2); barrier(i, 5, i, 6); }
  // Small fence in the street: the route must pass around either end.
  for (let j = 3; j <= 5; j++) barrier(3, j, 4, j);
  return {
    nodes, barriers,
    links: [{ id: ENTRY_LINK_ID, from: cellId(6, 4), to: cellId(7, 4), kind: 'door', enabled: false, requiredEchoGroup: 'l01_entry' }],
  };
})();

export const REQUIRED_MESH_IDS = [
  'l01_wall_west_south', 'l01_wall_west_north', 'l01_wall_east',
  'l01_wall_north', 'l01_wall_south', 'l01_door_main', 'l01_fence',
  'l01_mailbox', 'l01_sign',
] as const;

export interface BarrierRect { minX: number; maxX: number; minZ: number; maxZ: number }
// Physical walls aligned to the NavGraph's blocked edges. Radius expands them at collision time.
export const SOLID_RECTS: BarrierRect[] = [
  { minX: 1.91, maxX: 2.09, minZ: -3.1, maxZ: -1.0 },
  { minX: 1.91, maxX: 2.09, minZ: 0, maxZ: 1.1 },
  { minX: 1.91, maxX: 2.09, minZ: -1.0, maxZ: 0.0 }, // closed door
  { minX: 3.91, maxX: 4.09, minZ: -3.1, maxZ: 1.1 },
  { minX: 2.0, maxX: 4.0, minZ: -3.09, maxZ: -2.91 },
  { minX: 2.0, maxX: 4.0, minZ: 0.91, maxZ: 1.09 },
  { minX: -1.09, maxX: -0.91, minZ: -2, maxZ: 1 },
];
