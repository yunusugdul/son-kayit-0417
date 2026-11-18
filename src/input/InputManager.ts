import * as THREE from 'three';

export class InputManager {
  private pressed = new Set<string>();
  private readonly navigationKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);
  onInteract: (() => void) | null = null;

  constructor() {
    window.addEventListener('keydown', event => {
      if (this.navigationKeys.has(event.code) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault(); this.pressed.add(event.code);
      }
      if (event.code === 'KeyE' && !event.repeat) this.onInteract?.();
    });
    window.addEventListener('keyup', event => this.pressed.delete(event.code));
    window.addEventListener('blur', () => this.clear());
  }

  clear(): void { this.pressed.clear(); }
  direction(camera: THREE.Camera): THREE.Vector3 {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const vertical = Number(this.pressed.has('KeyW') || this.pressed.has('ArrowUp'))
      - Number(this.pressed.has('KeyS') || this.pressed.has('ArrowDown'));
    const horizontal = Number(this.pressed.has('KeyD') || this.pressed.has('ArrowRight'))
      - Number(this.pressed.has('KeyA') || this.pressed.has('ArrowLeft'));
    return forward.multiplyScalar(vertical).addScaledVector(right, horizontal);
  }
}
