import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { NavGraph } from './gameplay/NavGraph';
import { NAV_LAYOUT, REQUIRED_MESH_IDS, SOLID_RECTS, ENTRY_LINK_ID } from './gameplay/Stage1Layout';
import { PlayerController } from './gameplay/PlayerController';
import { InteractionSystem, type Interactable } from './gameplay/InteractionSystem';
import { InputManager } from './input/InputManager';
import { OcclusionFade } from './rendering/OcclusionFade';
import { EchoSystem } from './gameplay/EchoSystem';
import { EchoPassage } from './gameplay/EchoPassage';
import { parseLevel, type GameAction } from './content/levelSchema';
import { PuzzleSystem } from './gameplay/PuzzleSystem';
import { StoryDirector, translated } from './gameplay/StoryDirector';
import { SaveManager, blankSave, type GameSave } from './persistence/SaveManager';
import { AudioManager } from './audio/AudioManager';
import { createL01Art, type ArtQuality } from './visual/Stage4Art';
import './style.css';

const FIXED_STEP = 1 / 60;
// On slow software WebGL/GPU frames, simulation should track wall time while
// movement and echo continue to integrate with the safe 1/60 fixed step.
const MAX_FRAME = 0.25;
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
interface Stage2Debug extends Stage1Debug {
  echo(): import('./gameplay/EchoSystem').EchoSnapshot;
  entryLatched(): boolean;
  cassette(): string;
}
interface Stage3Debug extends Stage2Debug {
  flags(): string[];
  checkpoint(): string;
  floorIndex(): number;
  completed(): boolean;
}
interface Stage4Debug extends Stage3Debug {
  artQuality(): ArtQuality;
  triangles(): number;
  gpuMemory(): [number, number];
}

declare global {
  interface Window { __stage0?: Stage0Debug; __stage1?: Stage1Debug; __stage2?: Stage2Debug; __stage3?: Stage3Debug; __stage4?: Stage4Debug; }
}

const view = document.querySelector<HTMLDivElement>('#game-view');
const fallback = document.querySelector<HTMLElement>('#fallback');
const debugPanel = document.querySelector<HTMLOutputElement>('#debug-panel');
const feedback = document.querySelector<HTMLOutputElement>('#feedback');
const prompt = document.querySelector<HTMLOutputElement>('#interaction-prompt');
const echoState = document.querySelector<HTMLOutputElement>('#echo-state');
const echoButton = document.querySelector<HTMLButtonElement>('#echo-control');
if (!view || !fallback || !debugPanel || !feedback || !prompt || !echoState || !echoButton) {
  throw new Error('Gerekli oyun DOM elemanları bulunamadı.');
}
const showDebug = import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug');

function showFallback(): void {
  fallback!.hidden = false;
  debugPanel!.hidden = true;
  feedback!.hidden = true;
  prompt!.hidden = true;
  echoButton!.disabled = true;
  view!.replaceChildren();
}

function webgl2Available(): boolean {
  try { return Boolean(document.createElement('canvas').getContext('webgl2')); }
  catch { return false; }
}
if (!webgl2Available()) showFallback();
else startStage1(view, debugPanel, feedback, prompt).catch(error => {
  console.error('Stage 4 scene failed:', error);
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
  scene.background = new THREE.Color('#142633');
  scene.fog = new THREE.Fog('#142633', 18, 34);
  const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 100);
  camera.position.set(9, 9, 9);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_DPR));
  renderer.domElement.setAttribute('aria-label', 'Postane etrafındaki izometrik diorama; Ada ile yürüyebilir, posta kutusuna tıklayabilirsiniz.');
  renderer.domElement.tabIndex = 0;
  container.appendChild(renderer.domElement);
  const ambient = new THREE.HemisphereLight('#e3d5bd', '#344b5d', 1.65);
  scene.add(ambient);
  const light = new THREE.DirectionalLight('#f7cc86', 2.3);
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

  // Load the authored level contract and its requested graybox asset on demand.
  const response = await fetch(`${import.meta.env.BASE_URL}content/l01/level.json`);
  if (!response.ok) throw new Error('L01 level JSON unavailable');
  const level = parseLevel(await response.json());
  const manifestResponse = await fetch(`${import.meta.env.BASE_URL}${level.assetManifest}`);
  if (!manifestResponse.ok) throw new Error('L01 manifest unavailable');
  const manifest: unknown = await manifestResponse.json();
  if (!manifest || typeof manifest !== 'object' ||
    (manifest as {schemaVersion?:unknown}).schemaVersion !== 1 ||
    (manifest as {geometry?:unknown}).geometry !== 'content/l01/geometry.glb') {
    throw new Error('Unsupported L01 asset manifest');
  }
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
  // The collider array is shared with the interaction system and changes atomically with nav links.
  const liveSolids = SOLID_RECTS.map(rect => ({ ...rect }));
  const doorCollider = liveSolids[2];
  const player = new PlayerController(nav, liveSolids);
  let ada: THREE.Group; // Created by the stage-4 modular character kit.
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.23, 32),
    new THREE.MeshBasicMaterial({ color: '#8be5d1', transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = 0.035;
  marker.visible = false;
  scene.add(marker);

  // Level-owned small graybox props. The initial Blender-exported GLB stays unchanged.
  function block(id: string, x: number, y: number, z: number, w: number, h: number, d: number, color: string): THREE.Mesh {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({color}));
    mesh.name = id;
    mesh.position.set(x,y,z);
    meshMap.set(id,mesh);
    scene.add(mesh);
    return mesh;
  }
  const counter = block('l01_counter',2.85,0.45,-1.0,1.15,0.9,0.5,'#977b64');
  const noteMesh = block('l01_note_counter',2.85,0.95,-1.0,0.42,0.05,0.34,'#f5d9a0');
  const stairA = block('l01_stair_a',2.5,1.31,-1.5,0.98,0.18,0.98,'#72c8b5');
  const stairB = block('l01_stair_b',3.5,1.31,-1.5,0.98,0.18,0.98,'#72c8b5');
  const tapeMesh = block('l01_efe_tape',3.5,1.57,-1.5,0.38,0.24,0.25,'#e1c281');
  // Fixed shelf sits behind the temporary stairway. Visual and nav-layer are separate.
  const shelf = block('l01_shelf',3.5,0.7,-2.1,0.7,1.4,0.38,'#6f7788');
  void counter; void shelf;
  const art = createL01Art(
    scene, ground, grid, plinth, meshMap,
    new THREE.Vector3(1.0, 0.055, -0.5),
    new THREE.Vector3(2.5, 0.055, -1.5),
  );
  ada = art.character;
  ada.position.set(player.position.x, player.position.y, player.position.z);
  const interactive: Interactable[] = [
    { id: 'l01_mailbox', label: 'Posta kutusu', mesh: art.mailboxTarget, position: new THREE.Vector3(-2.5, 0, 0.5) },
    { id: 'l01_door_main', label: 'Kayıp giriş', mesh: meshMap.get('l01_door_main')!, position: new THREE.Vector3(1.55, 0, -0.5) },
    { id: 'l01_sign', label: 'Postane tabelası', mesh: art.signTarget, position: new THREE.Vector3(1.6, 0, 1.4) },
    { id: 'l01_note_counter', label: 'Tezgâhtaki not', mesh: noteMesh, position: new THREE.Vector3(2.85,0,-1.0) },
    { id: 'l01_efe_tape', label: "Efe'nin kaseti", mesh: tapeMesh, position: new THREE.Vector3(3.5,1.4,-1.5), floorIndex: 1 },
  ];
  const interactions = new InteractionSystem(nav, player, liveSolids, interactive);
  const input = new InputManager();
  input.onInteract = () => { if (!paused) interactions.interactNearest(); };
  const fade = new OcclusionFade([
    meshMap.get('l01_wall_east')!, meshMap.get('l01_wall_north')!,
  ]);

  const ownedTapes = new Set<import('./gameplay/EchoSystem').TapeId>();
  const puzzleFlags = new Set<string>();
  const echo = new EchoSystem(level.echoAnchors,level.echoGroups);
  for (const group of echo.groups.values()) {
    for (const meshId of group.objectIds) if (!meshMap.has(meshId)) throw new Error(`Missing echo mesh: ${meshId}`);
    for (const linkId of group.navigationLinkIds ?? []) if (!nav.links.has(linkId)) throw new Error(`Missing echo nav link: ${linkId}`);
  }
  const doorMesh = meshMap.get('l01_door_main')!;
  const doorMaterial = doorMesh.material;
  if (Array.isArray(doorMaterial) || !(doorMaterial instanceof THREE.MeshStandardMaterial)) throw new Error('Door requires glTF standard material');
  const echoMaterial = doorMaterial.clone();
  echoMaterial.transparent = true;
  echoMaterial.depthWrite = false;
  echoMaterial.emissive.set('#45b8ac');
  doorMesh.material = echoMaterial;
  const anchorSpot = new THREE.Vector3(1.0, 0.055, -0.5);
  const anchorMark = new THREE.Mesh(
    new THREE.RingGeometry(0.38, 0.48, 48),
    new THREE.MeshBasicMaterial({ color: '#7fe2cf', transparent: true, opacity: 0.86, side: THREE.DoubleSide }),
  );
  anchorMark.name = 'l01_echo_a_marker';
  anchorMark.rotation.x = -Math.PI / 2;
  anchorMark.position.copy(anchorSpot);
  scene.add(anchorMark);
  const anchorCore = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24),
    new THREE.MeshBasicMaterial({ color: '#bdf9e9', side: THREE.DoubleSide }));
  anchorCore.rotation.x = -Math.PI / 2;
  anchorCore.position.set(anchorSpot.x, anchorSpot.y + 0.008, anchorSpot.z);
  scene.add(anchorCore);

  const anchorBSpot = new THREE.Vector3(2.5,0.055,-1.5);
  const anchorBMark = new THREE.Mesh(
    new THREE.RingGeometry(0.36,0.47,48),
    new THREE.MeshBasicMaterial({color:'#7fe2cf',transparent:true,opacity:0.76,side:THREE.DoubleSide}),
  );
  anchorBMark.name = 'l01_echo_b_marker';
  anchorBMark.rotation.x = -Math.PI/2;
  anchorBMark.position.copy(anchorBSpot);
  anchorBMark.visible = false;
  scene.add(anchorBMark);
  const stairs = [stairA,stairB];
  for (const stair of stairs) {
    const material = stair.material as THREE.MeshLambertMaterial;
    material.transparent = true;
    material.opacity = 0;
    material.depthWrite = false;
    stair.visible = false;
  }
  // During SAFE_HOLD the collider remains disabled. On interior entry a permanent
  // escape route is latched so disappearing echoes never trap the player.
  const passage = new EchoPassage(nav, liveSolids, doorCollider, ENTRY_LINK_ID);
  echo.onPhaseChange = snapshot => {
    passage.apply({...snapshot,traversable:snapshot.groupId === 'l01_entry' && snapshot.traversable});
    nav.setLinkEnabled('l01_link_upper',snapshot.groupId === 'l01_stairs' && snapshot.traversable);
  };
  function updateDoorAppearance(): void {
    const snapshot = echo.snapshot;
    const progress = snapshot.groupId === 'l01_entry' ? snapshot.visualProgress : 0;
    echoMaterial.opacity = passage.isLatched ? 0 : 0.13 + 0.87 * progress;
    doorMesh.visible = echoMaterial.opacity > 0.01;
    echoMaterial.depthWrite = echoMaterial.opacity > 0.98;
    // Reinforce the interaction marker without creating a dynamic shadow or particles.
    (anchorMark.material as THREE.MeshBasicMaterial).opacity = 0.58 + 0.24 * progress;
    const bProgress = snapshot.groupId === 'l01_stairs' ? snapshot.visualProgress : 0;
    for (const stair of stairs) {
      (stair.material as THREE.MeshLambertMaterial).opacity = bProgress;
      stair.visible = bProgress > 0.01;
    }
    anchorBMark.visible = puzzleFlags.has('l01_note_read');
  }
  passage.apply(echo.snapshot);
  updateDoorAppearance();

  function required<T extends HTMLElement>(id: string): T {
    const node = document.getElementById(id);
    if (!node) throw new Error('Missing UI: ' + id);
    return node as T;
  }
  const ui = {
    menu: required<HTMLElement>('menu-overlay'),
    pause: required<HTMLElement>('pause-overlay'),
    complete: required<HTMLElement>('completion-overlay'),
    menuNew: required<HTMLButtonElement>('menu-new'),
    menuContinue: required<HTMLButtonElement>('menu-continue'),
    menuControl: required<HTMLButtonElement>('menu-control'),
    resume: required<HTMLButtonElement>('resume-control'),
    pauseButton: required<HTMLButtonElement>('pause-control'),
    hintButton: required<HTMLButtonElement>('hint-control'),
    subtitleBox: required<HTMLElement>('subtitle-box'),
    subtitle: required<HTMLElement>('subtitle'),
    subtitleDismiss: required<HTMLButtonElement>('subtitle-dismiss'),
    completeMenu: required<HTMLButtonElement>('completion-menu'),
    tapeName: required<HTMLElement>('tape-name'),
    export: required<HTMLButtonElement>('export-control'),
    pauseExport: required<HTMLButtonElement>('pause-export'),
    import: required<HTMLButtonElement>('import-control'),
    importFile: required<HTMLInputElement>('import-file'),
    storageWarning: required<HTMLElement>('storage-warning'),
    quality: required<HTMLSelectElement>('quality-control'),
    ambience: required<HTMLInputElement>('ambience-control'),
  };
  const audio = new AudioManager();
  const saves = new SaveManager();
  const story = new StoryDirector(ui.subtitle);
  let checkpoint: GameSave['checkpointId'] = 'cp_l01_start';
  let completed = false;
  let pendingCompletion = false;
  let puzzle: PuzzleSystem;
  let paused = true;
  let hintIndex = 0;
  let sinceHint = 99;
  let qualityMode: ArtQuality = 'auto';
  function dprLimit(): number {
    const mobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 800;
    return qualityMode === 'low' ? 1 : qualityMode === 'high' ? MAX_DPR : mobile ? 1.25 : MAX_DPR;
  }
  function applyQuality(next: ArtQuality): void {
    qualityMode = next;
    art.setQuality(next, window.innerWidth < 800 || window.matchMedia('(pointer: coarse)').matches);
    ui.quality.value = next;
    try { localStorage.setItem('son-kayit-art-quality', next); } catch { /* private mode */ }
    resize();
  }
  function refreshSaveWarning(): void {
    ui.storageWarning.hidden = !saves.storageFailed;
    if (saves.storageFailed) ui.storageWarning.textContent = translated('ui.saveUnavailable');
  }
  function persist(): void {
    const save: GameSave = {
      schemaVersion:1, levelId:'l01_post_office',checkpointId:checkpoint,
      flags:[...puzzleFlags],tapes:[...ownedTapes],
      completedLevels:completed ? ['l01_post_office'] : [],
      savedAt:new Date().toISOString(),
    };
    saves.save(save);
    refreshSaveWarning();
  }
  function applyAction(action: GameAction): void {
    switch (action.type) {
      case 'setFlag': puzzleFlags.add(action.flag); break;
      case 'grantTape':
        ownedTapes.add(action.tapeId);
        audio.play('pickup');
        tell('Zil kaseti alındı. İz A’ya yaklaş ve Space tuşuna bas.');
        break;
      case 'checkpoint':
        if (action.id !== 'cp_l01_start' && action.id !== 'cp_l01_interior')
          throw new Error('Unknown checkpoint');
        checkpoint = action.id;
        passage.latch();
        audio.play('checkpoint');
        break;
      case 'story':
        story.show(action.key);
        ui.subtitleBox.hidden = false;
        audio.play('story');
        break;
      case 'completeLevel':
        completed = true;
        pendingCompletion = true;
        // Let the player read Efe's full transcript before the chapter-end overlay.
        paused = true;
        audio.play('checkpoint');
        break;
      case 'showMessage': tell(translated(action.key)); break;
      case 'activateEcho': playAnchor(action.anchorId); break;
      case 'setNavLink': nav.setLinkEnabled(action.linkId,action.enabled); break;
      case 'setObjectVisible': {
        const mesh = meshMap.get(action.objectId);
        if (!mesh) throw new Error('Unknown scene object');
        mesh.visible = action.visible; break;
      }
    }
  }
  function begin(save: GameSave): void {
    echo.reset();
    passage.reset();
    puzzleFlags.clear(); for (const flag of save.flags) puzzleFlags.add(flag);
    ownedTapes.clear(); for (const tape of save.tapes) ownedTapes.add(tape);
    checkpoint = save.checkpointId;
    completed = save.completedLevels.includes('l01_post_office');
    pendingCompletion = false;
    const spawn = level.checkpoints.find(cp => cp.id === checkpoint);
    if (!spawn) throw new Error('Missing checkpoint in level');
    player.resetTo(spawn.position[0],spawn.position[2]);
    ada.position.set(player.position.x, player.position.y, player.position.z);
    if (puzzleFlags.has('l01_interior_reached')) passage.latch();
    puzzle = new PuzzleSystem(level.puzzles,puzzleFlags,{apply:applyAction});
    ui.menu.hidden = true;
    ui.pause.hidden = true;
    ui.complete.hidden = !completed;
    ui.subtitleBox.hidden = true;
    hintIndex = 0; sinceHint = 99;
    paused = document.hidden || completed;
    input.clear();
    accumulator = 0; last = performance.now();
    refreshSaveWarning();
    if (!completed && !puzzleFlags.has('l01_tape_found')) {
      story.show('story.l01.intro'); ui.subtitleBox.hidden = false;
    }
    updateDoorAppearance(); updateEchoHud();
  }
  function playAnchor(anchorId: string): void {
    if (paused) return;
    if (!ownedTapes.has('bell')) { tell(translated('ui.tapeNeeded')); audio.play('error'); return; }
    const position = anchorId === 'l01_echo_b' ? anchorBSpot : anchorSpot;
    const distance = Math.hypot(player.position.x - position.x,player.position.z - position.z);
    const result = echo.activate(anchorId,'bell',distance,puzzleFlags);
    const notices: Record<string, string> = {
      started: 'Zil kaydı çalıyor… unutulmuş kapı ortaya çıkıyor.',
      'out-of-range': 'Turkuaz yankı izine yaklaş (en fazla 1,6 m).',
      'wrong-tape': 'Bu iz için uygun kaset seçili değil.',
      'already-active': 'Yankı zaten etkin; süre yenilenmedi.',
      busy: 'Başka bir yankı etkin. Önce tamamlanmasını bekle.',
      cooldown: 'Kaset kısa süreliğine soğuyor.',
      'missing-flag': 'Bu yankı için önce gerekli ipucunu bulmalısın.',
      used: 'Bu yankı daha önce kullanıldı.',
      'unknown-anchor': 'Yankı noktası tanınmadı.',
    };
    tell(result === 'started' && anchorId === 'l01_echo_b' ? 'Basamaklar hatırlanıyor… üst rafa çık.' : notices[result]);
    if (result === 'started') {
      art.record();
      audio.play('echo');
      window.dispatchEvent(new CustomEvent('game:echo', { detail: { anchorId, tapeId: 'bell' } }));
    } else audio.play('error');
  }
  function playEcho(): void {
    void audio.unlock();
    const a = Math.hypot(player.position.x - anchorSpot.x,player.position.z - anchorSpot.z);
    const b = Math.hypot(player.position.x - anchorBSpot.x,player.position.z - anchorBSpot.z);
    const anchorId = puzzleFlags.has('l01_note_read') && b < a ? 'l01_echo_b' : 'l01_echo_a';
    playAnchor(anchorId);
  }
  echoButton!.addEventListener('click', playEcho);
  input.onPlayEcho = playEcho;
  function updateEchoHud(): void {
    const state = echo.snapshot;
    const labels: Record<typeof state.phase, string> = {
      inactive: !ownedTapes.has('bell') ? 'Posta kutusunda kaset ara' :
        puzzleFlags.has('l01_note_read') ? 'İz B: üst raf için zil kasetini çal' :
        passage.isLatched ? 'İçerideki tezgâh notunu oku' : 'İz A: kapıyı hatırla',
      materializing: 'Mekân hatırlanıyor…',
      active: `Yankı açık · ${Math.ceil(state.secondsRemaining)} sn`,
      safe_hold: 'Güvenli bekleme · dayanak korunuyor',
      fading: 'Yankı sönüyor…',
      cooldown: `Bekle · ${Math.ceil(state.secondsRemaining)} sn`,
    };
    const label = passage.isLatched && state.phase === 'inactive' &&
      !puzzleFlags.has('l01_note_read') ? 'Geçit kalıcı olarak güvenli · notu oku' : labels[state.phase];
    if (echoState!.textContent !== label) echoState!.textContent = label;
    ui.tapeName.textContent = ownedTapes.has('bell') ? 'Zil / bell' : 'Kaset henüz bulunmadı';
    echoButton!.disabled = paused || !ownedTapes.has('bell');
  }

  let messageElapsed = 0;
  function tell(text: string): void {
    message.textContent = text;
    message.hidden = false;
    messageElapsed = 3.5;
  }
  interactions.onFeedback = tell;
  interactions.onEvent = ({ id, label }) => {
    if (paused) return;
    art.interact();
    window.dispatchEvent(new CustomEvent('game:interact', { detail: { interactId: id } }));
    if (puzzle.emit('interactId',id)) { persist(); return; }
    if (id === 'l01_door_main') tell(nav.links.get(ENTRY_LINK_ID)?.enabled ?
      'Kapı geçilebilir; içeride güvenli çıkış var.' : 'Kapı kayıp. Turkuaz izde zil kasetini çal.');
    else tell(`${label} incelendi.`);
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
    return raycaster.intersectObjects([ground, ...interactive.map(item => item.mesh), ...stairs], true);
  }
  renderer.domElement.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const item = hits(event).map(hit => interactions.pick(hit.object)).find(Boolean) ?? null;
    hover(item);
  });
  renderer.domElement.addEventListener('pointerleave', () => hover(null));

  renderer.domElement.addEventListener('pointerdown', event => {
    if (paused || event.button !== 0) return;
    void audio.unlock();
    const allHits = hits(event);
    const item = allHits.map(hit => interactions.pick(hit.object)).find(Boolean);
    if (item) {
      player.cancelPath();
      marker.visible = false;
      interactions.interactOrApproach(item);
      return;
    }
    // Touch and mouse use the same raycast and nav; elevated support has a separate floor index.
    const upper = allHits.find(hit => stairs.includes(hit.object as THREE.Mesh) && hit.object.visible);
    const surface = upper ?? allHits.find(hit => hit.object === ground && Math.abs(hit.point.y) < 0.025);
    if (!surface) return;
    const floor = upper ? 1 : 0;
    if (!player.moveTo(surface.point.x, surface.point.z,undefined,floor)) {
      marker.visible = false;
      tell('Buraya giden açık bir yol yok. Başka bir nokta seç.');
      return;
    }
    const target = nav.contains(surface.point.x, surface.point.z,floor)!;
    marker.position.set(target.x, target.worldY + 0.035, target.z);
    marker.visible = player.movingToTarget;
  });

  function resize(): void {
    const width = Math.max(1, container.clientWidth), height = Math.max(1, container.clientHeight);
    const aspect = width / height;
    // Fit the full 10x10 isometric diamond on portrait screens; the old horizontal
    // frustum clipped Ada and the mailbox on 390px phones.
    const worldHeight = Math.max(ORTHO_HEIGHT, 15.6 / Math.max(0.38, aspect));
    camera.left = -worldHeight * aspect / 2;
    camera.right = worldHeight * aspect / 2;
    camera.top = worldHeight / 2;
    camera.bottom = -worldHeight / 2;
    camera.updateProjectionMatrix();
    art.setQuality(qualityMode, window.innerWidth < 800 || window.matchMedia('(pointer: coarse)').matches);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprLimit()));
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', resize);
  resize();
  let accumulator = 0, last = performance.now(), frames = 0, sampleTime = 0, measuredFps = 0;
  function newGame(): void {
    saves.clear();
    const fresh = saves.save(blankSave());
    begin(fresh);
  }
  function returnToMenu(): void {
    ui.menu.hidden = false;
    ui.pause.hidden = true;
    ui.complete.hidden = true;
    ui.subtitleBox.hidden = true;
    ui.menuContinue.disabled = !saves.load();
    paused = true;
    input.clear();
    audio.suspend();
  }
  function togglePause(): void {
    if (!ui.menu.hidden || !ui.complete.hidden || document.hidden) return;
    ui.pause.hidden = !ui.pause.hidden;
    paused = !ui.pause.hidden;
    if (paused) { input.clear(); audio.suspend(); }
    else void audio.unlock();
    accumulator = 0; last = performance.now();
  }
  function showHint(): void {
    if (paused) return;
    const hints = !puzzleFlags.has('l01_tape_found') ?
      ['Önce dış sokaktaki posta kutusunu incele.',
       'Posta kutusuna tıkla ya da yanına gidip E tuşuna bas.',
       'Zil kasetini kutudan al; turkuaz yankı izine yaklaş.'] :
      !puzzleFlags.has('l01_interior_reached') ?
      ['Girişteki turkuaz halkayı bul.',
       'Zil kasetini girişteki halkaya yakınken çal.',
       'Kapı görünürken içeri yürü.'] :
      !puzzleFlags.has('l01_note_read') ?
      ['Postanenin içindeki tezgâha bak.',
       'Tezgâhtaki açık renkli nota dokun.',
       'Notu oku, sonra ikinci turkuaz izi bul.'] :
      ['Üst rafa giden basamaklar silinmiş.',
       'İçerideki turkuaz iz B yanında zil kasetini tekrar çal.',
       'Basamaklar görünürken üstteki kasete dokun veya tıkla.'];
    if (sinceHint >= 25) hintIndex = Math.min(2,hintIndex + 1);
    hintIndex = Math.max(0,hintIndex);
    sinceHint = 0;
    tell(hints[hintIndex]);
  }
  function exportSave(): void {
    const blob = new Blob([saves.exportJson()],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'son-kayit-0417-kayit.json';
    document.body.appendChild(link); link.click(); link.remove();
    URL.revokeObjectURL(url);
  }
  ui.menuNew.addEventListener('click',() => { void audio.unlock(); newGame(); });
  ui.menuContinue.addEventListener('click',() => {
    void audio.unlock();
    const loaded = saves.load();
    if (loaded) begin(loaded);
    else tell('Geçerli kayıt bulunamadı.');
  });
  ui.resume.addEventListener('click',togglePause);
  ui.pauseButton.addEventListener('click',togglePause);
  ui.menuControl.addEventListener('click',returnToMenu);
  ui.completeMenu.addEventListener('click',returnToMenu);
  ui.hintButton.addEventListener('click',showHint);
  ui.quality.addEventListener('change', () => applyQuality(ui.quality.value as ArtQuality));
  let savedAmbience: string | null = null;
  try { savedAmbience = localStorage.getItem('son-kayit-ambience'); } catch { /* private mode */ }
  ui.ambience.checked = savedAmbience !== 'off';
  audio.setAmbienceEnabled(ui.ambience.checked);
  ui.ambience.addEventListener('change', () => {
    audio.setAmbienceEnabled(ui.ambience.checked);
    try { localStorage.setItem('son-kayit-ambience', ui.ambience.checked ? 'on' : 'off'); }
    catch { /* private mode */ }
  });
  let savedQuality: string | null = null;
  try { savedQuality = localStorage.getItem('son-kayit-art-quality'); } catch { /* private mode */ }
  applyQuality(savedQuality === 'high' || savedQuality === 'low' ? savedQuality : 'auto');
  function dismissSubtitle(): void {
    story.dismiss();
    ui.subtitleBox.hidden = true;
    if (pendingCompletion) {
      pendingCompletion = false;
      ui.complete.hidden = false;
      paused = true;
    }
  }
  ui.subtitleDismiss.addEventListener('click',dismissSubtitle);
  ui.export.addEventListener('click',exportSave);
  ui.pauseExport.addEventListener('click',exportSave);
  ui.import.addEventListener('click',() => ui.importFile.click());
  ui.importFile.addEventListener('change',async () => {
    const file = ui.importFile.files?.[0];
    if (!file) return;
    try {
      if (file.size > 32768) throw new Error('Oversized save');
      begin(saves.importJson(await file.text()));
      tell(translated('ui.saved'));
    } catch { tell(translated('ui.importFailed')); audio.play('error'); }
    finally { ui.importFile.value = ''; }
  });
  window.addEventListener('keydown',event => {
    if (event.code === 'Escape' && !event.repeat) { event.preventDefault(); togglePause(); }
    if (event.code === 'KeyH' && !event.repeat) { event.preventDefault(); showHint(); }
    if (event.code === 'Enter' && !ui.subtitleBox.hidden) {
      event.preventDefault(); dismissSubtitle();
    }
  });
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden || !ui.menu.hidden || !ui.pause.hidden || !ui.complete.hidden;
    if (document.hidden) audio.suspend();
    input.clear();
    accumulator = 0;
    last = performance.now();
  });
  ui.menuContinue.disabled = !saves.load();
  refreshSaveWarning();
  if (showDebug) {
    const debugSaved = new URLSearchParams(window.location.search).has('continue') ? saves.load() : null;
    if (debugSaved) begin(debugSaved);
    else newGame(); // Stage 0/1 movement smoke tests start from a clean state.
  }


  const api: Stage4Debug = {
    position: () => [player.position.x, player.position.y + 0.65, player.position.z],
    paused: () => paused,
    drawCalls: () => renderer.info.render.calls,
    fps: () => measuredFps,
    targetActive: () => player.movingToTarget,
    viewport: () => [renderer.domElement.width, renderer.domElement.height],
    route: () => player.route.map(node => node.id),
    cell: () => player.cell?.id ?? null,
    doorEnabled: () => nav.links.get(ENTRY_LINK_ID)?.enabled ?? false,
    echo: () => echo.snapshot,
    entryLatched: () => passage.isLatched,
    cassette: () => [...ownedTapes].join(','),
    flags: () => [...puzzleFlags],
    checkpoint: () => checkpoint,
    floorIndex: () => player.floorIndex,
    completed: () => completed,
    artQuality: () => qualityMode,
    triangles: () => renderer.info.render.triangles,
    gpuMemory: () => [renderer.info.memory.geometries, renderer.info.memory.textures],
    eventIds: () => interactions.events.map(e => e.id),
    meshIds: () => [...meshMap.keys()].sort(),
    hoverId: () => interactions.hoverId,
    project: (x, y, z) => {
      const p = new THREE.Vector3(x, y, z).project(camera);
      const rect = renderer.domElement.getBoundingClientRect();
      return [rect.left + (p.x + 1) * rect.width / 2, rect.top + (1 - p.y) * rect.height / 2];
    },
  };
  if (showDebug) {
    window.__stage0 = api; window.__stage1 = api; window.__stage2 = api; window.__stage3 = api; window.__stage4 = api;
    panel.hidden = false;
  }

  const direction = new THREE.Vector3();
  function fixedUpdate(dt: number): void {
    direction.copy(input.direction(camera));
    const prevX = player.position.x, prevZ = player.position.z;
    player.fixedUpdate(dt, direction.x, direction.z);
    if (!puzzleFlags.has('l01_interior_reached') && player.floorIndex === 0 &&
      player.position.x > 2.28 && player.position.x < 3.78 &&
      player.position.z > -2.72 && player.position.z < 0.72) {
      passage.latch();
      if (puzzle.emit('triggerId','l01_interior_trigger')) persist();
    }
    echo.fixedUpdate(dt, group => group.id === 'l01_stairs' ? player.floorIndex === 1 :
      Math.abs(player.position.x - 2) <= 0.47 && Math.abs(player.position.z + 0.5) <= 0.78);
    sinceHint += dt;
    updateDoorAppearance();
    updateEchoHud();
    ada.position.set(player.position.x, player.position.y, player.position.z);
    art.update(dt, player.position.x - prevX, player.position.z - prevZ,
      echo.snapshot, puzzleFlags.has('l01_note_read'));
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
    fade.update(dt, camera, new THREE.Vector3(ada.position.x, ada.position.y + 0.78, ada.position.z));
    renderer.render(scene, camera);
    if (showDebug) {
      frames++; sampleTime += dt;
      if (sampleTime >= 0.5) {
        measuredFps = Math.round(frames / sampleTime);
        panel.textContent = `FPS: ${measuredFps}\nDraw calls: ${renderer.info.render.calls}\nTriangles: ${renderer.info.render.triangles}\nDPR: ${Math.min(window.devicePixelRatio || 1, dprLimit()).toFixed(2)}\nNav: ${player.cell?.id ?? 'none'}\nDoor: ${nav.links.get(ENTRY_LINK_ID)?.enabled ? 'OPEN' : 'CLOSED'}\nEcho: ${echo.snapshot.phase}`;
        frames = 0; sampleTime = 0;
      }
    }
  }
  requestAnimationFrame(tick);
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault(); paused = true; showFallback();
  });
}
