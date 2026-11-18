import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { NavGraph } from './gameplay/NavGraph';
import { NAV_LAYOUT, REQUIRED_MESH_IDS, SOLID_RECTS, ENTRY_LINK_ID } from './gameplay/Stage1Layout';
import { PlayerController } from './gameplay/PlayerController';
import { InteractionSystem, type Interactable } from './gameplay/InteractionSystem';
import { InputManager } from './input/InputManager';
import { OcclusionFade } from './rendering/OcclusionFade';
import './style.css';

const FIXED_STEP = 1 / 60;
const MAX_FRAME = 0.1;
const ORTHO_HEIGHT = 12;
const MAX_DPR = 1.5;

interface Stage0Debug {
  readonly position: () => [number, number, number];
  readonly paused: () => boolean;
  readonly drawCalls: () => number;
  readonly fps: () => number;
  readonly targetActive: () => boolean;
  readonly viewport: () => [number, number];
}
interface Stage1Debug extends Stage0Debug {
  route(): string[];
  cell(): string | null;
  doorEnabled(): boolean;
  eventIds(): string[];
  meshIds(): string[];
  hoverId(): string | null;
  project(x: number, y: number, z: number): [number, number];
}
declare global {
  interface Window { __stage0?: Stage0Debug; __stage1?: Stage1Debug; }
}

const view = document.querySelector<HTMLDivElement>('#game-view');
const fallback = document.querySelector<HTMLElement>('#fallback');
const debugPanel = document.querySelector<HTMLOutputElement>('#debug-panel');
const feedback = document.querySelector<HTMLOutputElement>('#feedback');
const prompt = document.querySelector<HTMLOutputElement>('#interaction-prompt');
if (!view || !fallback || !debugPanel || !feedback || !prompt) {
  throw new Error('Gerekli Stage 1 DOM elemanları bulunamadı.');
}
const showDebug = import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug');

function showFallback(): void {
  fallback!.hidden = false;
  debugPanel!.hidden = true;
  feedback!.hidden = true;
  prompt!.hidden = true;
  view!.replaceChildren();
}

function webgl2Available(): boolean {
  try { return Boolean(document.createElement('canvas').getContext('webgl2')); }
  catch { return false; }
}
if (!webgl2Available()) showFallback();
else startStage1(view, debugPanel, feedback, prompt).catch(error => {
  console.error('Stage 1 scene failed:', error);
  const note = fallback!.querySelector('p');
  if (note) note.textContent = '3D model yüklenemedi. Lütfen sayfayı yenileyin veya bağlantınızı kontrol edin.';
  showFallback();
});

async function startStage1(
  container: HTMLDivElement,
  panel: HTMLOutputElement,
  message: HTMLOutputElement,
  interactionPrompt: HTMLOutputElement,
): Promise<void> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#1d2c3a');
  const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 100);
  camera.position.set(9, 9, 9);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
  renderer.domElement.setAttribute('aria-label', 'Postane etrafındaki izometrik diorama; Ada ile yürüyebilir, posta kutusuna tıklayabilirsiniz.');
  renderer.domElement.tabIndex = 0;
  container.appendChild(renderer.domElement);
  const ambient = new THREE.HemisphereLight('#e5e3d7', '#425565', 2);
  scene.add(ambient);
  const light = new THREE.DirectionalLight('#e5b363', 2);
  light.position.set(-4, 8, 5);
  scene.add(light);

  const ground = new THREE.Mesh(new THREE.BoxGeometry(10, 0.35, 10),
    new THREE.MeshLambertMaterial({ color: '#75848c' }));
  ground.position.y = -0.175;
  ground.name = 'walkable-ground';
  scene.add(ground);
  const grid = new THREE.GridHelper(10, 10, '#9bb1b5', '#82989d');
  grid.position.y = 0.008;
  scene.add(grid);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(10.45, 0.18, 10.45),
    new THREE.MeshLambertMaterial({ color: '#3a5862' }));
  plinth.position.y = -0.44;
  scene.add(plinth);

  // Fail loudly on invalid asset IDs; no invisible fallback wall collisions.
  const loaded = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}content/l01/geometry.glb`);
  const meshMap = new Map<string, THREE.Mesh>();
  loaded.scene.traverse(child => {
    if (!(child instanceof THREE.Mesh)) return;
    if (meshMap.has(child.name)) throw new Error(`Duplicate geometry mesh ID: ${child.name}`);
    meshMap.set(child.name, child);
  });
  for (const id of REQUIRED_MESH_IDS) if (!meshMap.has(id)) throw new Error(`Missing geometry mesh ID: ${id}`);
  scene.add(loaded.scene);
  const nav = new NavGraph(NAV_LAYOUT);
  if (nav.links.get(ENTRY_LINK_ID)?.enabled !== false) throw new Error('Door must begin closed.');
  const player = new PlayerController(nav, SOLID_RECTS);
  const ada = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.5),
    new THREE.MeshLambertMaterial({ color: '#e5b363' }));
  ada.position.set(player.position.x, 0.65, player.position.z);
  scene.add(ada);
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.23, 32),
    new THREE.MeshBasicMaterial({ color: '#8be5d1', transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.035;
  marker.visible = false;
  scene.add(marker);

  const interactive: Interactable[] = [
    { id: 'l01_mailbox', label: 'Posta kutusu', mesh: meshMap.get('l01_mailbox')!, position: new THREE.Vector3(-2.5, 0, 0.5) },
    { id: 'l01_door_main', label: 'Kapalı postane kapısı', mesh: meshMap.get('l01_door_main')!, position: new THREE.Vector3(1.55, 0, -0.5) },
    { id: 'l01_sign', label: 'Postane tabelası', mesh: meshMap.get('l01_sign')!, position: new THREE.Vector3(1.6, 0, 1.4) },
  ];
  const interactions = new InteractionSystem(nav, player, SOLID_RECTS, interactive);
  const input = new InputManager();
  input.onInteract = () => interactions.interactNearest();
  const fade = new OcclusionFade([
    meshMap.get('l01_wall_east')!, meshMap.get('l01_wall_north')!,
  ]);

  let messageElapsed = 0;
  function tell(text: string): void {
    message.textContent = text;
    message.hidden = false;
    messageElapsed = 3.5;
  }
  interactions.onFeedback = tell;
  interactions.onEvent = ({ id, label }) => {
    window.dispatchEvent(new CustomEvent('game:interact', { detail: { interactId: id } }));
    tell(id === 'l01_door_main' ? 'Kapı şu an kapalı. Onu açacak kayıt henüz yok.' : `${label} incelendi. (Etkileşim olayı)`);
  };

  const hoverMaterials = new Map<string, { material: THREE.MeshStandardMaterial; emissive: THREE.Color }>();
  for (const item of interactive) {
    const mesh = item.mesh as THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      hoverMaterials.set(item.id, { material: mesh.material, emissive: mesh.material.emissive.clone() });
    }
  }
  function hover(item: Interactable | null): void {
    interactions.setHover(item);
    for (const obj of interactive) {
      const saved = hoverMaterials.get(obj.id);
      if (saved) saved.material.emissive.copy(saved.emissive).addScalar(obj === item ? 0.19 : 0);
    }
    renderer.domElement.style.cursor = item ? 'pointer' : 'default';
    interactionPrompt.textContent = item ? `${item.label} · Tıkla veya yaklaşınca E` : '';
    interactionPrompt.hidden = !item;
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function hits(event: PointerEvent): THREE.Intersection[] {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return [];
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
      -((event.clientY - rect.top) / rect.height * 2 - 1));
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects([ground, ...interactive.map(item => item.mesh)], true);
  }
  renderer.domElement.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const item = hits(event).map(hit => interactions.pick(hit.object)).find(Boolean) ?? null;
    hover(item);
  });
  renderer.domElement.addEventListener('pointerleave', () => hover(null));

  let paused = document.hidden;
  renderer.domElement.addEventListener('pointerdown', event => {
    if (paused || event.button !== 0) return;
    const allHits = hits(event);
    const item = allHits.map(hit => interactions.pick(hit.object)).find(Boolean);
    if (item) {
      player.cancelPath();
      marker.visible = false;
      interactions.interactOrApproach(item);
      return;
    }
    // Raycast ground, not an infinite plane; never teleport to unreachable nodes.
    const surface = allHits.find(hit => hit.object === ground && Math.abs(hit.point.y) < 0.025);
    if (!surface) return;
    if (!player.moveTo(surface.point.x, surface.point.z)) {
      marker.visible = false;
      tell('Buraya giden açık bir yol yok. Başka bir nokta seç.');
      return;
    }
    const target = nav.contains(surface.point.x, surface.point.z)!;
    marker.position.set(target.x, 0.035, target.z);
    marker.visible = player.movingToTarget;
  });

  function resize(): void {
    const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight);
    const aspect = width / height;
    // Preserve floor readability when portrait screens have a narrow horizontal frustum.
    const worldHeight = Math.max(ORTHO_HEIGHT, 10 / Math.max(0.5, aspect));
    camera.left = -worldHeight * aspect / 2;
    camera.right = worldHeight * aspect / 2;
    camera.top = worldHeight / 2;
    camera.bottom = -worldHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', resize);
  resize();
  let accumulator = 0, last = performance.now(), frames = 0, sampleTime = 0, measuredFps = 0;
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    input.clear();
    accumulator = 0;
    last = performance.now();
  });

  const api: Stage1Debug = {
    position: () => [player.position.x, player.position.y + 0.65, player.position.z],
    paused: () => paused,
    drawCalls: () => renderer.info.render.calls,
    fps: () => measuredFps,
    targetActive: () => player.movingToTarget,
    viewport: () => [renderer.domElement.width, renderer.domElement.height],
    route: () => player.route.map(node => node.id),
    cell: () => player.cell?.id ?? null,
    doorEnabled: () => nav.links.get(ENTRY_LINK_ID)?.enabled ?? false,
    eventIds: () => interactions.events.map(e => e.id),
    meshIds: () => [...meshMap.keys()].sort(),
    hoverId: () => interactions.hoverId,
    project: (x, y, z) => {
      const p = new THREE.Vector3(x, y, z).project(camera);
      const rect = renderer.domElement.getBoundingClientRect();
      return [rect.left + (p.x + 1) * rect.width / 2, rect.top + (1 - p.y) * rect.height / 2];
    },
  };
  if (showDebug) { window.__stage0 = api; window.__stage1 = api; panel.hidden = false; }

  const direction = new THREE.Vector3();
  function fixedUpdate(dt: number): void {
    direction.copy(input.direction(camera));
    player.fixedUpdate(dt, direction.x, direction.z);
    ada.position.set(player.position.x, player.position.y + 0.65, player.position.z);
    if (!player.movingToTarget) marker.visible = false;
    if (messageElapsed > 0) {
      messageElapsed -= dt;
      if (messageElapsed <= 0) message.hidden = true;
    }
  }
  function tick(now: number): void {
    requestAnimationFrame(tick);
    const dt = Math.min(MAX_FRAME, Math.max(0, (now - last) / 1000));
    last = now;
    if (paused) return;
    accumulator += dt;
    while (accumulator >= FIXED_STEP) { fixedUpdate(FIXED_STEP); accumulator -= FIXED_STEP; }
    fade.update(dt, camera, ada.position);
    renderer.render(scene, camera);
    if (showDebug) {
      frames++; sampleTime += dt;
      if (sampleTime >= 0.5) {
        measuredFps = Math.round(frames / sampleTime);
        panel.textContent = `FPS: ${measuredFps}\nDraw calls: ${renderer.info.render.calls}\nTriangles: ${renderer.info.render.triangles}\nDPR: ${Math.min(window.devicePixelRatio || 1, MAX_DPR).toFixed(1)}\nNav: ${player.cell?.id ?? 'none'}\nDoor: CLOSED`;
        frames = 0; sampleTime = 0;
      }
    }
  }
  requestAnimationFrame(tick);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); paused = true; showFallback();
  });
}
