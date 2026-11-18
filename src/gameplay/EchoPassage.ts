import { NavGraph } from './NavGraph.ts';
import type { BarrierRect } from './Stage1Layout.ts';
import type { EchoSnapshot } from './EchoSystem.ts';

/** Keep an explicit nav link and its physical door collider in sync. */
export class EchoPassage {
  private latched = false;
  private passable = false;
  private readonly graph: NavGraph;
  private readonly solids: BarrierRect[];
  private readonly doorCollider: BarrierRect;
  private readonly linkId: string;
  constructor(graph: NavGraph, solids: BarrierRect[], doorCollider: BarrierRect, linkId: string) {
    this.graph = graph;
    this.solids = solids;
    this.doorCollider = doorCollider;
    this.linkId = linkId;
    if (!graph.links.has(linkId)) throw new Error(`Missing echo nav link: ${linkId}`);
    if (!solids.includes(doorCollider)) throw new Error('Missing echo door collider');
  }
  get isLatched(): boolean { return this.latched; }
  get isPassable(): boolean { return this.passable; }
  latch(): void { this.latched = true; this.apply(this.lastSnapshot); }
  reset(): void { this.latched = false; this.apply({
    phase: 'inactive', anchorId: null, groupId: null,
    secondsRemaining: 0, visualProgress: 0, traversable: false,
  }); }

  private lastSnapshot: EchoSnapshot = {
    phase: 'inactive', anchorId: null, groupId: null, secondsRemaining: 0, visualProgress: 0, traversable: false,
  };
  apply(snapshot: EchoSnapshot): void {
    this.lastSnapshot = snapshot;
    this.passable = this.latched || snapshot.traversable;
    this.graph.setLinkEnabled(this.linkId, this.passable);
    const index = this.solids.indexOf(this.doorCollider);
    if (this.passable && index >= 0) this.solids.splice(index, 1);
    else if (!this.passable && index < 0) this.solids.push(this.doorCollider);
  }
}
