import { NavGraph, type NavNode } from './NavGraph.ts';

/** Deterministic A* with Manhattan heuristic on same-floor cells. No diagonal corner-cutting. */
export function findPath(graph: NavGraph, fromId: string, toId: string): NavNode[] | null {
  const start = graph.nodes.get(fromId), goal = graph.nodes.get(toId);
  if (!start?.walkable || !goal?.walkable) return null;
  const open = new Set([fromId]);
  const cameFrom = new Map<string, string>();
  const g = new Map<string, number>([[fromId, 0]]);
  const h = (node: NavNode): number => node.floorIndex === goal.floorIndex
    ? Math.abs(node.x - goal.x) + Math.abs(node.z - goal.z) : 0;
  const f = (id: string): number => (g.get(id) ?? Infinity) + h(graph.nodes.get(id)!);
  while (open.size) {
    const current = [...open].sort((a, b) => f(a) - f(b) || a.localeCompare(b))[0];
    if (current === toId) {
      const route: NavNode[] = [goal];
      let id = current;
      while (cameFrom.has(id)) { id = cameFrom.get(id)!; route.unshift(graph.nodes.get(id)!); }
      return route;
    }
    open.delete(current);
    for (const neighbor of graph.neighbors(current)) {
      const from = graph.nodes.get(current)!;
      const cost = Math.hypot(from.x - neighbor.x, from.z - neighbor.z, from.worldY - neighbor.worldY);
      const candidate = (g.get(current) ?? Infinity) + cost;
      if (candidate + 1e-9 < (g.get(neighbor.id) ?? Infinity)) {
        cameFrom.set(neighbor.id, current);
        g.set(neighbor.id, candidate);
        open.add(neighbor.id);
      }
    }
  }
  return null;
}
