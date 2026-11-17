import * as THREE from 'three';
import './style.css';

/** Aşama 0: engel/nav/bulmaca içermeyen, gerçek 3D başlangıç sahnesi. */
const WORLD_HALF = 5;
const ADA_RADIUS = 0.26;
const MOVE_LIMIT = WORLD_HALF - ADA_RADIUS;
const SPEED = 2.7;
const FIXED_STEP = 1 / 60;
const MAX_FRAME = 0.1;
const ORTHO_HEIGHT = 12;
const MAX_DPR = 1.5;

interface Stage0DebugAPI {
  readonly position: () => [number, number, number];
  readonly paused: () => boolean;
  readonly drawCalls: () => number;
  readonly fps: () => number;
  readonly targetActive: () => boolean;
  readonly viewport: () => [number, number];
}

declare global {
  interface Window {
    __stage0?: Stage0DebugAPI;
  }
}

const view = document.querySelector<HTMLDivElement>('#game-view');
const fallback = document.querySelector<HTMLElement>('#fallback');
const debugPanel = document.querySelector<HTMLOutputElement>('#debug-panel');
if (!view || !fallback || !debugPanel) throw new Error('Sahne için gerekli DOM elemanları bulunamadı.');

const debug = import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug');
function showFallback(): void {
  fallback!.hidden = false;
  debugPanel!.hidden = true;
  view!.replaceChildren();
}

// WebGLRenderer WebGL2 ister; hata durumunda oyuncu boş/siyah ekran görmez.
const probe = document.createElement('canvas');
let webgl2Supported = false;
try {
  webgl2Supported = Boolean(probe.getContext('webgl2'));
} catch {
  webgl2Supported = false;
}

if (!webgl2Supported) {
  showFallback();
} else {
  try {
    startStage0(view, debugPanel, showFallback, debug);
  } catch (error) {
    console.error('Three.js renderer başlatılamadı.', error);
    showFallback();
  }
}

function startStage0(
  container: HTMLDivElement,
  panel: HTMLOutputElement,
  fallbackHandler: () => void,
  showDebug: boolean,
): void {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1d2c3a');

  const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 100);
  camera.position.set(9, 9, 9); // Azimut 45°, yükseliş yaklaşık 35°.
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
  renderer.domElement.setAttribute('aria-label', '3 boyutlu izometrik diorama. Sarı küp Ada. Zemine tıklayarak hareket ettirebilirsiniz.');
  renderer.domElement.setAttribute('tabindex', '0');
  container.appendChild(renderer.domElement);

  const ambient = new THREE.HemisphereLight('#e5e3d7', '#425565', 2);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight('#e5b363', 2);
  keyLight.position.set(-4, 8, 5);
  scene.add(keyLight);

  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.35, 10),
    new THREE.MeshLambertMaterial({ color: '#75848c' }),
  );
  ground.position.y = -0.175;
  scene.add(ground);

  // Zeminin ölçüsünü anlaşılır kılan ince grid; henüz çarpışma/engel yok.
  const grid = new THREE.GridHelper(10, 10, '#9bb1b5', '#82989d');
  grid.position.y = 0.008;
  scene.add(grid);

  const side = new THREE.Mesh(
    new THREE.BoxGeometry(10.45, 0.18, 10.45),
    new THREE.MeshLambertMaterial({ color: '#3a5862' }),
  );
  side.position.y = -0.44;
  scene.add(side);

  const ada = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.3, 0.5),
    new THREE.MeshLambertMaterial({ color: '#e5b363' }),
  );
  ada.position.y = 0.65;
  scene.add(ada);

  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.17, 0.23, 32),
    new THREE.MeshBasicMaterial({ color: '#8be5d1', transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.035;
  marker.visible = false;
  scene.add(marker);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hit = new THREE.Vector3();
  const moveTarget = new THREE.Vector3();
  const direction = new THREE.Vector3();
  // XZ zemin düzlemi üzerinde, ekran doğrultusuna göre dört yön.
  const forward = new THREE.Vector3(-1, 0, -1).normalize();
  const right = new THREE.Vector3(1, 0, -1).normalize();
  const pressed = new Set<string>();
  let hasMoveTarget = false;
  let paused = document.hidden;
  let accumulator = 0;
  let last = performance.now();
  let frameCount = 0;
  let sampleTime = 0;
  let measuredFps = 0;

  const navigationKeys = new Set([
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
  ]);
  function keyDown(event: KeyboardEvent): void {
    if (!navigationKeys.has(event.code)) return;
    // Yalnız oyun kontrol tuşlarında tarayıcı kaydırmasını engelle.
    if (!event.altKey && !event.ctrlKey && !event.metaKey) event.preventDefault();
    pressed.add(event.code);
  }
  function keyUp(event: KeyboardEvent): void {
    pressed.delete(event.code);
  }
  function clearKeys(): void {
    pressed.clear();
  }
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', clearKeys);

  function onVisibility(): void {
    paused = document.hidden;
    pressed.clear();
    accumulator = 0;
    last = performance.now(); // Sekme arka plandayken geçen süre simülasyona aktarılmaz.
  }
  document.addEventListener('visibilitychange', onVisibility);

  renderer.domElement.addEventListener('pointerdown', (event: PointerEvent) => {
    if (paused || event.button !== 0) return;
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    // Sadece zeminin üst yüzeyine tıklama geçerli; boşluklar hedef sayılmaz.
    const groundHit = raycaster.intersectObject(ground, false).find(({ point }) => Math.abs(point.y) < 0.02);
    if (!groundHit) return;
    hit.copy(groundHit.point);
    moveTarget.set(
      THREE.MathUtils.clamp(hit.x, -MOVE_LIMIT, MOVE_LIMIT),
      0,
      THREE.MathUtils.clamp(hit.z, -MOVE_LIMIT, MOVE_LIMIT),
    );
    marker.position.set(moveTarget.x, marker.position.y, moveTarget.z);
    marker.visible = true;
    hasMoveTarget = true;
  });

  function resize(): void {
    const width = Math.max(1, container.clientWidth);
    const height = Math.max(1, container.clientHeight);
    const aspect = width / height;
    camera.left = (-ORTHO_HEIGHT * aspect) / 2;
    camera.right = (ORTHO_HEIGHT * aspect) / 2;
    camera.top = ORTHO_HEIGHT / 2;
    camera.bottom = -ORTHO_HEIGHT / 2;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', resize);
  resize();

  function fixedUpdate(dt: number): void {
    direction.set(0, 0, 0);
    if (pressed.has('KeyW') || pressed.has('ArrowUp')) direction.add(forward);
    if (pressed.has('KeyS') || pressed.has('ArrowDown')) direction.sub(forward);
    if (pressed.has('KeyD') || pressed.has('ArrowRight')) direction.add(right);
    if (pressed.has('KeyA') || pressed.has('ArrowLeft')) direction.sub(right);
    if (direction.lengthSq() > 0) {
      hasMoveTarget = false;
      marker.visible = false;
      ada.position.addScaledVector(direction.normalize(), SPEED * dt);
    } else if (hasMoveTarget) {
      direction.set(moveTarget.x - ada.position.x, 0, moveTarget.z - ada.position.z);
      const distance = direction.length();
      if (distance <= 0.03) {
        hasMoveTarget = false;
        marker.visible = false;
      } else {
        ada.position.addScaledVector(direction.normalize(), Math.min(distance, SPEED * dt));
      }
    }
    ada.position.x = THREE.MathUtils.clamp(ada.position.x, -MOVE_LIMIT, MOVE_LIMIT);
    ada.position.z = THREE.MathUtils.clamp(ada.position.z, -MOVE_LIMIT, MOVE_LIMIT);
  }

  if (showDebug) {
    panel.hidden = false;
    window.__stage0 = {
      position: () => [ada.position.x, ada.position.y, ada.position.z],
      paused: () => paused,
      drawCalls: () => renderer.info.render.calls,
      fps: () => measuredFps,
      targetActive: () => hasMoveTarget,
      viewport: () => [renderer.domElement.width, renderer.domElement.height],
    };
  }

  function tick(now: number): void {
    requestAnimationFrame(tick);
    const dt = Math.min(MAX_FRAME, Math.max(0, (now - last) / 1000));
    last = now;
    if (paused) return;

    accumulator += dt;
    while (accumulator >= FIXED_STEP) {
      fixedUpdate(FIXED_STEP);
      accumulator -= FIXED_STEP;
    }
    renderer.render(scene, camera);
    if (showDebug) {
      frameCount++;
      sampleTime += dt;
      if (sampleTime >= 0.5) {
        measuredFps = Math.round(frameCount / Math.max(0.001, sampleTime));
        panel.textContent = `FPS: ${measuredFps}\nDraw calls: ${renderer.info.render.calls}\nTriangles: ${renderer.info.render.triangles}\nDPR: ${Math.min(window.devicePixelRatio || 1, MAX_DPR).toFixed(1)}\nY: ${ada.position.y.toFixed(2)}`;
        frameCount = 0;
        sampleTime = 0;
      }
    }
  }
  requestAnimationFrame(tick);

  renderer.domElement.addEventListener('webglcontextlost', (event: Event) => {
    event.preventDefault();
    paused = true;
    fallbackHandler();
  });
}
