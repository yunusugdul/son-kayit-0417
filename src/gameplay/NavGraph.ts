/** Grid graph of walkable cells, explicit inter-floor/door links and blocked wall edges. */
export interface NavNode {
  id: string;
  x: number;
  z: number;
  worldY: number;
  floorIndex: number;
  walkable: boolean;
}
export type LinkKind = 'floor' | 'stairs' | 'door' | 'platform';
export interface NavLink {
  id: string;
  from: string;
  to: string;
  enabled: boolean;
  kind: LinkKind;
  requiredEchoGroup?: string;
}
export interface NavLayout {
  nodes: NavNode[];
  barriers: Array<readonly [string, string]>;
  links: NavLink[];
}

export function cellId(col: number, row: number, floorIndex = 0): string {
  return `floor${floorIndex}:${col}:${row}`;
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

export class NavGraph {
  readonly nodes = new Map<string, NavNode>();
  readonly links = new Map<string, NavLink>();
  private readonly barriers = new Set<string>();
  private readonly linkByPair = new Map<string, NavLink>();
  revision = 0;

  constructor(layout: NavLayout) {
    for (const node of layout.nodes) {
      if (this.nodes.has(node.id)) throw new Error(`Duplicate nav node: ${node.id}`);
      this.nodes.set(node.id, { ...node });
    }
    for (const [a, b] of layout.barriers) {
      this.requireNode(a); this.requireNode(b);
      this.barriers.add(pairKey(a, b));
    }
    for (const link of layout.links) {
      this.requireNode(link.from); this.requireNode(link.to);
      const key = pairKey(link.from, link.to);
      if (this.links.has(link.id) || this.linkByPair.has(key)) throw new Error(`Duplicate nav link: ${link.id}`);
      this.links.set(link.id, { ...link });
      this.linkByPair.set(key, this.links.get(link.id)!);
    }
  }

  private requireNode(id: string): NavNode {
    const node = this.nodes.get(id);
    if (!node) throw new Error(`Missing nav node: ${id}`);
    return node;
  }

  nearest(x: number, z: number, floorIndex = 0): NavNode | null {
    let best: NavNode | null = null;
    let distance = Infinity;
    for (const node of this.nodes.values()) {
      if (!node.walkable || node.floorIndex !== floorIndex) continue;
      const d = Math.hypot(x - node.x, z - node.z);
      if (d < distance) { best = node; distance = d; }
    }
    return best;
  }

  contains(x: number, z: number, floorIndex = 0): NavNode | null {
    // Centers are spaced at least one metre; cells have half-width 0.5 metres.
    for (const node of this.nodes.values()) {
      if (node.floorIndex === floorIndex && Math.abs(node.x - x) < 0.5 && Math.abs(node.z - z) < 0.5) {
        return node.walkable ? node : null;
      }
    }
    return null;
  }

  canTraverse(fromId: string, toId: string): boolean {
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    if (!from?.walkable || !to?.walkable) return false;
    if (fromId === toId) return true;
    const key = pairKey(fromId, toId);
    const link = this.linkByPair.get(key);
    if (link) return link.enabled;
    if (this.barriers.has(key) || from.floorIndex !== to.floorIndex) return false;
    const dx = Math.abs(from.x - to.x), dz = Math.abs(from.z - to.z);
    return (dx === 1 && dz === 0) || (dx === 0 && dz === 1);
  }

  neighbors(id: string): NavNode[] {
    const from = this.nodes.get(id);
    if (!from) return [];
    const result: NavNode[] = [];
    for (const other of this.nodes.values()) {
      if (other.id !== id && Math.abs(from.x - other.x) + Math.abs(from.z - other.z) <= 1.001 && this.canTraverse(id, other.id)) {
        result.push(other);
      }
    }
    // Explicit cross-layer/platform links may span more than one metre.
    for (const link of this.links.values()) {
      const adjacent = link.from === id ? link.to : link.to === id ? link.from : null;
      if (adjacent && this.canTraverse(id, adjacent) && !result.some(n => n.id === adjacent)) result.push(this.requireNode(adjacent));
    }
    return result;
  }

  setLinkEnabled(id: string, enabled: boolean): void {
    const link = this.links.get(id);
    if (!link) throw new Error(`Missing nav link: ${id}`);
    if (link.enabled !== enabled) { link.enabled = enabled; this.revision++; }
  }
}
