import * as THREE from 'three';
import { NavGraph, type NavNode } from './NavGraph';
import { findPath } from './Pathfinding';
import { PlayerController } from './PlayerController';
import type { BarrierRect } from './Stage1Layout';

export interface Interactable { id: string; position: THREE.Vector3; mesh: THREE.Object3D; label: string }
export interface InteractionEvent { id: string; label: string }
const REACH = 1.6;

function segmentIntersectsBox(ax: number, az: number, bx: number, bz: number, wall: BarrierRect): boolean {
  // Liang-Barsky clip in XZ, with small tolerance to avoid spurious grazing.
  let t0 = 0, t1 = 1;
  const dx = bx - ax, dz = bz - az;
  const q = [ax - wall.minX, wall.maxX - ax, az - wall.minZ, wall.maxZ - az];
  const p = [-dx, dx, -dz, dz];
  for (let i = 0; i < 4; i++) {
    if (Math.abs(p[i]) < 1e-9) { if (q[i] < 0) return false; }
    else {
      const r = q[i] / p[i];
      if (p[i] < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
      if (t0 > t1) return false;
    }
  }
  return t1 >= 0 && t0 <= 1;
}

export class InteractionSystem {
  private target: Interactable | null = null;
  private readonly items: Interactable[];
  private readonly graph: NavGraph;
  private readonly player: PlayerController;
  private readonly walls: BarrierRect[];
  readonly events: InteractionEvent[] = [];
  onEvent: ((event: InteractionEvent) => void) | null = null;
  onFeedback: ((message: string) => void) | null = null;

  constructor(graph: NavGraph, player: PlayerController, walls: BarrierRect[], items: Interactable[]) {
    this.graph = graph; this.player = player; this.walls = walls; this.items = items;
  }

  get hoverId(): string | null { return this.target?.id ?? null; }
  get interactables(): readonly Interactable[] { return this.items; }
  setHover(item: Interactable | null): void { this.target = item; }
  pick(mesh: THREE.Object3D): Interactable | null {
    return this.items.find(item => item.mesh === mesh || item.mesh.getObjectById(mesh.id) !== undefined) ?? null;
  }

  canInteract(item: Interactable): boolean {
    const d = Math.hypot(item.position.x - this.player.position.x, item.position.z - this.player.position.z);
    return d <= REACH && !this.walls.some(wall => segmentIntersectsBox(
      this.player.position.x, this.player.position.z, item.position.x, item.position.z, wall,
    ));
  }

  private emit(item: Interactable): void {
    if (!this.canInteract(item)) return;
    const event = { id: item.id, label: item.label };
    this.events.push(event); this.onEvent?.(event);
  }

  interactNearest(): boolean {
    const near = this.items.filter(item => this.canInteract(item))
      .sort((a, b) => this.player.position.distanceToSquared(a.position) - this.player.position.distanceToSquared(b.position))[0];
    if (!near) { this.onFeedback?.('Yakında etkileşime girilebilecek bir nesne yok.'); return false; }
    this.emit(near); return true;
  }

  interactOrApproach(item: Interactable): boolean {
    if (this.canInteract(item)) { this.emit(item); return true; }
    const start = this.player.cell;
    if (!start) { this.onFeedback?.('Güvenli bir yol bulunamadı.'); return false; }
    let best: { node: NavNode; score: number } | null = null;
    for (const node of this.graph.nodes.values()) {
      const distance = Math.hypot(node.x - item.position.x, node.z - item.position.z);
      if (!node.walkable || distance > REACH - 0.15 || distance < 0.2) continue;
      if (this.walls.some(wall => segmentIntersectsBox(node.x, node.z, item.position.x, item.position.z, wall))) continue;
      const path = findPath(this.graph, start.id, node.id);
      if (!path) continue;
      const score = path.length + distance * 0.1;
      if (!best || score < best.score) best = { node, score };
    }
    if (!best || !this.player.moveTo(best.node.x, best.node.z, () => this.emit(item))) {
      this.onFeedback?.('Bu nesneye ulaşılabilecek açık bir yol yok.'); return false;
    }
    return true;
  }
}
