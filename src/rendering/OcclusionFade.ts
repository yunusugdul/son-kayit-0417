import * as THREE from 'three';

/** Only explicitly tagged front walls may fade; never a global material change. */
export class OcclusionFade {
  private readonly ray = new THREE.Raycaster();
  private readonly direction = new THREE.Vector3();
  constructor(private readonly walls: THREE.Mesh[]) {
    for (const wall of walls) {
      const material = wall.material;
      if (Array.isArray(material)) throw new Error('Occlusion wall needs one material');
      wall.material = material.clone();
      (wall.material as THREE.Material).transparent = true;
    }
  }
  update(dt: number, camera: THREE.Camera, character: THREE.Vector3): void {
    this.direction.copy(character).sub(camera.position);
    const length = this.direction.length();
    if (length < 0.01) return;
    this.ray.set(camera.position, this.direction.normalize());
    this.ray.far = length - 0.05;
    const hidden = new Set(this.ray.intersectObjects(this.walls, false).map(hit => hit.object.id));
    for (const wall of this.walls) {
      const material = wall.material as THREE.MeshStandardMaterial;
      const target = hidden.has(wall.id) ? 0.23 : 1;
      material.opacity = THREE.MathUtils.damp(material.opacity, target, 9, dt);
      material.depthWrite = material.opacity > 0.98;
    }
  }
}
