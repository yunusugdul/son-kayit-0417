import * as THREE from 'three';
import { NavGraph, type NavNode } from './NavGraph';
import { findPath } from './Pathfinding';
import type { BarrierRect } from './Stage1Layout';

const RADIUS = 0.26;
const SPEED = 2.7;

export class PlayerController {
  readonly position = new THREE.Vector3(-3.5, 0, 2.5);
  private path: NavNode[] = [];
  private waypoint = 0;
  private targetRevision = 0;
  private onArrive: (() => void) | null = null;
  private readonly obstacles: BarrierRect[];
  private readonly graph: NavGraph;

  constructor(graph: NavGraph, obstacles: BarrierRect[]) {
    this.graph = graph;
    this.obstacles = obstacles;
  }

  get movingToTarget(): boolean { return this.waypoint < this.path.length; }
  get route(): readonly NavNode[] { return this.path; }
  get cell(): NavNode | null { return this.graph.contains(this.position.x, this.position.z); }

  cancelPath(): void { this.path = []; this.waypoint = 0; this.onArrive = null; }

  moveTo(x: number, z: number, onArrive?: () => void): boolean {
    const from = this.cell;
    const goal = this.graph.contains(x, z);
    if (!from || !goal) return false;
    const path = findPath(this.graph, from.id, goal.id);
    if (!path) return false;
    this.path = path.slice(1);
    this.waypoint = 0;
    this.targetRevision = this.graph.revision;
    this.onArrive = onArrive ?? null;
    if (this.path.length === 0) {
      this.onArrive?.(); this.onArrive = null;
    }
    return true;
  }

  private collides(x: number, z: number): boolean {
    if (x < -5 + RADIUS || x > 5 - RADIUS || z < -5 + RADIUS || z > 5 - RADIUS) return true;
    for (const wall of this.obstacles) {
      const nearX = THREE.MathUtils.clamp(x, wall.minX, wall.maxX);
      const nearZ = THREE.MathUtils.clamp(z, wall.minZ, wall.maxZ);
      if ((x - nearX) ** 2 + (z - nearZ) ** 2 < RADIUS ** 2) return true;
    }
    return false;
  }

  private stepAxis(dx: number, dz: number): boolean {
    const x = this.position.x + dx, z = this.position.z + dz;
    const from = this.cell, to = this.graph.contains(x, z);
    if (!from || !to || !this.graph.canTraverse(from.id, to.id) || this.collides(x, z)) return false;
    this.position.set(x, to.worldY, z);
    return true;
  }

  fixedUpdate(dt: number, inputX: number, inputZ: number): void {
    if (inputX !== 0 || inputZ !== 0) {
      this.cancelPath();
      const norm = Math.hypot(inputX, inputZ);
      const dx = inputX / norm * SPEED * dt;
      const dz = inputZ / norm * SPEED * dt;
      // Axis-by-axis sliding; a blocked x motion cannot tunnel across a wall using z.
      this.stepAxis(dx, 0);
      this.stepAxis(0, dz);
      return;
    }
    if (!this.movingToTarget) return;
    if (this.targetRevision !== this.graph.revision) { this.cancelPath(); return; }
    const target = this.path[this.waypoint];
    const deltaX = target.x - this.position.x, deltaZ = target.z - this.position.z;
    const distance = Math.hypot(deltaX, deltaZ);
    if (distance < 0.035) {
      this.waypoint++;
      if (!this.movingToTarget) {
        const callback = this.onArrive;
        this.cancelPath();
        callback?.();
      }
      return;
    }
    const step = Math.min(distance, SPEED * dt);
    const dx = deltaX / distance * step, dz = deltaZ / distance * step;
    // Only one axis should change for 4-neighbour A* except the initial partial cell.
    const beforeX = this.position.x, beforeZ = this.position.z;
    this.stepAxis(dx, 0);
    this.stepAxis(0, dz);
    if (Math.hypot(beforeX - this.position.x, beforeZ - this.position.z) < 1e-7) this.cancelPath();
  }
}
