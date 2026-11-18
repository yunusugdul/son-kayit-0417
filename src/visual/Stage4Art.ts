import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { EchoSnapshot } from '../gameplay/EchoSystem';

/**
 * L01's reusable low-poly art kit. Collision/navigation remains owned by Stage1Layout:
 * these decorative meshes never alter a puzzle collider or navigation link.
 * Geometry is combined by palette material; no downloaded textures, shadow maps, or external assets.
 */
const C = {
  stone: '#75848c', paving: '#9a9c91', grout: '#647c78', ivory: '#d9c9aa',
  plaster: '#c9b79d', paper: '#f2deb8', copper: '#b87552',
  rust: '#995942', dark: '#1d2c3a', slate: '#405663', sea: '#355967',
  wood: '#735a4b', honey: '#c69d68', teal: '#58d7c4', glass: '#6d9da4',
  glow: '#e5b363', greenery: '#526f5d', ink: '#263844',
} as const;
type Color = keyof typeof C;
export type ArtQuality = 'auto' | 'high' | 'low';

class Kit {
  private byColor = new Map<Color, THREE.BufferGeometry[]>();
  private add(geometry: THREE.BufferGeometry, color: Color, x: number, y: number, z: number,
    rx = 0, ry = 0, rz = 0): void {
    const transform = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
      new THREE.Vector3(1, 1, 1),
    );
    geometry.applyMatrix4(transform);
    const geometries = this.byColor.get(color) ?? [];
    geometries.push(geometry);
    this.byColor.set(color, geometries);
  }
  box(x: number, y: number, z: number, w: number, h: number, d: number, color: Color,
    rx = 0, ry = 0, rz = 0): void {
    this.add(new THREE.BoxGeometry(w, h, d), color, x, y, z, rx, ry, rz);
  }
  cylinder(x: number, y: number, z: number, radius: number, height: number, color: Color,
    top = radius, sides = 8, rx = 0, ry = 0, rz = 0): void {
    this.add(new THREE.CylinderGeometry(top, radius, height, sides), color, x, y, z, rx, ry, rz);
  }
  sphere(x: number, y: number, z: number, radius: number, color: Color): void {
    this.add(new THREE.IcosahedronGeometry(radius, 1), color, x, y, z);
  }
  finish(target: THREE.Group, name: string): void {
    for (const [color, geometries] of this.byColor) {
      const merged = geometries.length > 1 ? mergeGeometries(geometries, false) : geometries[0];
      if (!merged) throw new Error('Modüler model birleştirilemedi: ' + name);
      if (merged !== geometries[0] || geometries.length > 1) {
        geometries.forEach(geometry => geometry.dispose());
      }
      const mesh = new THREE.Mesh(merged, new THREE.MeshLambertMaterial({ color: C[color] }));
      mesh.name = name + '_' + color;
      target.add(mesh);
    }
    this.byColor.clear();
  }
}

/** Draw on a tiny, in-memory label canvas. No image download, font or texture atlas. */
function signTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 160;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('2D sign canvas unavailable');
  context.clearRect(0, 0, 512, 160);
  context.textAlign = 'center';
  context.fillStyle = '#f3e2c4';
  context.font = 'bold 69px Georgia, serif';
  context.fillText('POSTANE', 256, 83);
  context.font = '23px sans-serif';
  context.letterSpacing = '7px';
  context.fillText('SON KAYIT  ·  04.17', 256, 126);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

/** A readable stylized Ada, built from 11 independent parts for low-cost animation. */
class AdaModel {
  readonly root = new THREE.Group();
  private leftArm = new THREE.Group();
  private rightArm = new THREE.Group();
  private leftLeg = new THREE.Group();
  private rightLeg = new THREE.Group();
  private body = new THREE.Group();
  private elapsed = 0;
  private interaction = 0;
  private recording = 0;
  private facing = Math.PI / 4;
  constructor() {
    this.root.name = 'CHAR_Ada_11_parts';
    const cloth = new THREE.MeshLambertMaterial({ color: '#c77755' });
    const pants = new THREE.MeshLambertMaterial({ color: '#344e5b' });
    const skin = new THREE.MeshLambertMaterial({ color: '#e6bd94' });
    const hair = new THREE.MeshLambertMaterial({ color: '#3b3437' });
    const bag = new THREE.MeshLambertMaterial({ color: '#a78662' });
    const teal = new THREE.MeshLambertMaterial({ color: '#5cbcaf' });
    const dark = new THREE.MeshLambertMaterial({ color: '#223540' });
    const boot = new THREE.MeshLambertMaterial({ color: '#342f36' });
    const add = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material,
      x: number, y: number, z: number): THREE.Mesh => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(.34, 20),
      new THREE.MeshBasicMaterial({ color: '#172f38', transparent: true, opacity: .37, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .045;
    this.root.add(shadow);
    this.body.position.y = .78;
    this.root.add(this.body);
    add(this.body, new THREE.CylinderGeometry(.28, .32, .65, 7), cloth, 0, .04, 0);
    add(this.body, new THREE.BoxGeometry(.58, .12, .1), teal, 0, .33, .25); // scarf
    add(this.body, new THREE.BoxGeometry(.14, .49, .26), bag, -.33, -.05, -.2); // satchel
    add(this.body, new THREE.IcosahedronGeometry(.3, 1), skin, 0, .62, 0); // face
    add(this.body, new THREE.SphereGeometry(.30, 8, 5, 0, Math.PI * 2, 0, Math.PI * .55),
      hair, 0, .75, -.025);
    add(this.body, new THREE.CylinderGeometry(.33, .33, .08, 9), dark, 0, .88, 0); // cap brim
    add(this.body, new THREE.CylinderGeometry(.26, .29, .22, 9), dark, 0, .98, -.03);
    for (const [sign, joint] of [[-1, this.leftArm], [1, this.rightArm]] as const) {
      joint.position.set(sign * .32, .24, 0);
      add(joint, new THREE.CylinderGeometry(.095, .115, .50, 7), cloth, sign * .04, -.23, 0);
      add(joint, new THREE.IcosahedronGeometry(.10, 0), skin, sign * .045, -.49, 0);
      this.body.add(joint);
    }
    add(this.rightArm, new THREE.BoxGeometry(.24, .16, .27), dark, .065, -.49, .11); // player
    add(this.rightArm, new THREE.CylinderGeometry(.045, .045, .02, 8), teal, .02, -.392, .18);
    for (const [sign, joint] of [[-1, this.leftLeg], [1, this.rightLeg]] as const) {
      joint.position.set(sign * .16, .51, 0);
      add(joint, new THREE.CylinderGeometry(.105, .115, .48, 7), pants, 0, -.25, 0);
      add(joint, new THREE.BoxGeometry(.22, .13, .32), boot, 0, -.51, .07);
      this.root.add(joint);
    }
    this.root.rotation.y = this.facing;
  }
  interact(): void { this.interaction = .45; }
  record(): void { this.recording = 1.7; }
  update(dt: number, dx: number, dz: number, reducedMotion: boolean): void {
    this.elapsed += dt;
    this.interaction = Math.max(0, this.interaction - dt);
    this.recording = Math.max(0, this.recording - dt);
    const moving = Math.hypot(dx, dz) > 0.0003;
    if (moving) {
      const target = Math.atan2(dx, dz);
      const delta = Math.atan2(Math.sin(target - this.facing), Math.cos(target - this.facing));
      this.facing += delta * Math.min(1, dt * 10);
    }
    this.root.rotation.y = this.facing;
    const cadence = Math.sin(this.elapsed * 10) * (moving ? .52 : 0);
    this.leftLeg.rotation.x = cadence;
    this.rightLeg.rotation.x = -cadence;
    this.leftArm.rotation.x = -cadence * .7;
    this.rightArm.rotation.x = cadence * .7 - (this.interaction > 0 ? .95 : 0)
      - (this.recording > 0 ? .48 : 0);
    this.body.position.y = .78 + (reducedMotion ? 0 : moving ?
      Math.abs(Math.sin(this.elapsed * 10)) * .027 : Math.sin(this.elapsed * 2) * .015);
  }
}

function mailbox(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PROP_PostBox';
  group.position.set(-2.5, 0, .5);
  const kit = new Kit();
  kit.cylinder(0, .46, 0, .12, .9, 'dark', .095, 8);
  kit.cylinder(0, .96, 0, .27, .07, 'copper', .31, 8);
  kit.box(0, 1.25, 0, .71, .61, .50, 'copper');
  kit.box(0, 1.58, 0, .79, .09, .59, 'rust');
  kit.box(0, 1.34, .258, .49, .09, .035, 'dark');
  kit.box(0, 1.09, .265, .42, .19, .045, 'ivory');
  kit.box(0, .12, 0, .52, .14, .52, 'slate');
  kit.finish(group, 'PROP_PostBox');
  return group;
}

function postaneSign(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'PROP_PostaneSign';
  group.position.set(1.45, 0, 1.38);
  const kit = new Kit();
  kit.box(0, 1.14, 0, .14, 2.28, .14, 'wood');
  kit.box(.65, 2.02, 0, 1.72, .55, .17, 'dark');
  kit.box(.65, 2.02, .095, 1.80, .62, .07, 'copper');
  kit.box(.65, 2.02, .138, 1.67, .48, .02, 'slate');
  kit.box(.65, 1.70, 0, 1.98, .085, .22, 'honey');
  kit.finish(group, 'PROP_SignBoard');
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.60, .43),
    new THREE.MeshBasicMaterial({ map: signTexture(), transparent: true, depthWrite: false }));
  label.name = 'PROP_PostaneSign_Label';
  label.position.set(.65, 2.025, .155);
  group.add(label);
  return group;
}

function buildEnvironment(scene: THREE.Scene, ground: THREE.Mesh, grid: THREE.GridHelper,
  plinth: THREE.Mesh, meshMap: Map<string, THREE.Mesh>): { permanent: THREE.Group; details: THREE.Group; lamps: THREE.PointLight[] } {
  grid.visible = false;
  (ground.material as THREE.MeshLambertMaterial).color.set('#637879');
  (plinth.material as THREE.MeshLambertMaterial).color.set('#344a53');
  for (const id of ['l01_wall_west_south', 'l01_wall_west_north',
    'l01_wall_east', 'l01_wall_north', 'l01_wall_south', 'l01_fence',
    'l01_mailbox', 'l01_sign']) {
    const mesh = meshMap.get(id);
    if (mesh) mesh.visible = false; // authored collision mesh remains loaded and mapped
  }
  const permanent = new THREE.Group();
  permanent.name = 'ENV_L01_Modular_Postane';
  scene.add(permanent);
  const details = new THREE.Group();
  details.name = 'ENV_L01_CosmeticDetails';
  scene.add(details);
  const floor = new Kit();
  // A quiet coastal stone boardwalk, never used for raycasting/collision.
  floor.box(2.98, .026, -1.0, 2.03, .055, 4.06, 'grout');
  for (let iz = 0; iz < 7; iz++) {
    floor.box(2.98, .057, -2.73 + iz * .57, 1.98, .017, .024, 'stone');
  }
  floor.box(0, -.31, 0, 10.2, .09, 10.2, 'dark');
  floor.box(-4.95, -.10, 0, .18, .20, 10.1, 'sea');
  floor.box(0, -.10, -4.95, 10.1, .20, .18, 'sea');
  // A broken sea-wall and rippling ocean beyond the back-left perimeter.
  for (let i = 0; i < 5; i++) {
    floor.box(-4.67, .11, -4.25 + i * .55, .33, .25, .47, i % 2 ? 'stone' : 'slate');
  }
  floor.finish(permanent, 'ENV_GroundTrim');
  const stones = new THREE.InstancedMesh(
    new THREE.BoxGeometry(.94, .035, .94),
    new THREE.MeshLambertMaterial({ color: C.paving }), 100,
  );
  stones.name = 'ENV_Pavers_100_Instances';
  const matrix = new THREE.Matrix4();
  const shades = ['#97a79b', '#a7a89a', '#b1ada0', '#9eaea6'];
  for (let i = 0; i < 100; i++) {
    const x = i % 10 - 4.5, z = Math.floor(i / 10) - 4.5;
    matrix.makeTranslation(x, .020, z);
    stones.setMatrixAt(i, matrix);
    stones.setColorAt(i, new THREE.Color(shades[(i * 7 + Math.floor(i / 10)) % shades.length]));
  }
  stones.instanceMatrix.needsUpdate = true;
  permanent.add(stones);

  const building = new Kit();
  // Cutaway architecture: silhouette and facade are legible while Ada stays visible inside.
  building.box(3, .14, -1, 2.30, .25, 4.35, 'slate'); // stone footing
  building.box(3, .22, -1, 2.1, .23, 4.2, 'stone');
  building.box(2.03, 1.00, -2.0, .15, 2.0, 1.94, 'plaster'); // back entrance wall
  building.box(2.03, 1.00, .49, .15, 2.0, .96, 'plaster');
  building.box(3, 1.03, -3.02, 2.09, 2.06, .15, 'ivory'); // northern rear
  building.box(3.98, .43, -1.0, .18, .86, 4.1, 'plaster'); // low east cutaway
  building.box(2.97, .43, .99, 2.0, .86, .17, 'plaster'); // front cutaway
  // Brick courses, walnut sill and vertical pillar supports.
  for (const x of [2.04, 3.98]) for (const z of [-2.94, .98]) {
    building.box(x, .95, z, .20, 1.88, .20, 'stone');
    building.box(x, 1.91, z, .30, .15, .30, 'copper');
  }
  for (const z of [-2.9, -.95, .94]) {
    building.box(4.01, .86, z, .23, .12, .24, 'honey');
  }
  building.box(3, 2.11, -3.03, 2.3, .18, .24, 'honey');
  building.box(2.0, 1.99, -.49, .30, .15, 1.29, 'honey'); // lintel
  building.box(2.0, .95, -1.09, .26, 1.94, .22, 'wood');
  building.box(2.0, .95, .09, .26, 1.94, .22, 'wood');
  // Two roof shingles form a gable on only the rear strip, leaving the puzzle interior open.
  building.box(2.48, 2.37, -2.78, 1.30, .13, 1.12, 'copper', 0, 0, .42);
  building.box(3.52, 2.37, -2.78, 1.30, .13, 1.12, 'rust', 0, 0, -.42);
  building.box(3, 2.64, -2.78, .22, .13, 1.23, 'honey');
  for (let k = 0; k < 4; k++) {
    building.box(2.1 + k * .58, 2.18, -2.25, .045, .22, .08, 'honey');
  }
  // High rear windows and decorative teal shutters.
  for (const x of [2.54, 3.50]) {
    building.box(x, 1.35, -2.928, .46, .66, .060, 'wood');
    building.box(x, 1.36, -2.879, .32, .47, .025, 'glass');
    building.box(x, 1.36, -2.859, .04, .49, .033, 'honey');
    building.box(x, 1.36, -2.858, .35, .04, .033, 'honey');
    building.box(x-.27, 1.36, -2.91, .12, .63, .08, 'greenery');
    building.box(x+.27, 1.36, -2.91, .12, .63, .08, 'greenery');
  }
  // Copper rain gutter / cream cornice on front wall.
  building.box(3, .91, 1.0, 2.22, .12, .26, 'honey');
  building.box(4.06, .92, -1, .11, .11, 4.18, 'honey');
  // Existing fence collider at x=-1; rebuilt as a three-post wooden picket.
  for (const z of [-1.95, -.50, .95]) {
    building.box(-1, .63, z, .22, 1.25, .22, 'wood');
    building.cylinder(-1, 1.30, z, .17, .25, 'copper', 0, 5);
  }
  for (const y of [.39, .86]) building.box(-1, y, -.5, .12, .12, 3.1, 'honey');
  building.finish(permanent, 'ENV_PostOffice_Kit');

  const scenery = new Kit();
  // Lamp-posts, timber supports, plants, crates and a tiny old harbor bench.
  for (const [x, z] of [[-3.75, -3.55], [.80, 3.65]] as const) {
    scenery.cylinder(x, .98, z, .075, 1.96, 'dark', .055, 8);
    scenery.cylinder(x, 1.99, z, .20, .13, 'copper');
    scenery.box(x, 2.21, z, .36, .36, .36, 'honey');
    scenery.box(x, 2.21, z, .29, .28, .29, 'glow');
    scenery.cylinder(x, 2.46, z, .32, .13, 'dark', .06, 4);
  }
  for (const [x, z, r] of [[-4.08, 2.90, .34], [-4.06, 2.34, .27],
    [4.43, -3.57, .26]] as const) {
    scenery.cylinder(x, .25, z, r, .44, 'wood', r * .88, 7);
    scenery.sphere(x, .59, z, r * 1.15, 'greenery');
  }
  for (const [x,z,scale] of [[4.32, 2.65, 1],[3.67, 2.99,.73]] as const) {
    scenery.box(x,.26 * scale,z,.52 * scale,.52 * scale,.49 * scale,'wood');
    scenery.box(x,.45 * scale,z,.56 * scale,.055 * scale,.52 * scale,'honey');
  }
  for (const z of [-2.2,-1.6,-1.0,.3]) scenery.cylinder(-4.57,.19,z,.11,.38,'slate',.08,6);
  scenery.box(-3.1, .28, -3.0, 1.20, .13, .43, 'honey');
  scenery.box(-3.1, .65, -3.19, 1.20, .61, .1, 'wood');
  for(const x of [-3.55,-2.65]) scenery.box(x,.31,-3.0,.12,.57,.42,'dark');
  scenery.finish(details, 'ENV_HarborDecor');

  // Flat local lights, no shadow map ever requested.
  const lamps = [[-3.75, -3.55], [.80, 3.65]].map(([x,z]) => {
    const lamp = new THREE.PointLight(C.glow, 7, 4, 2);
    lamp.position.set(x, 2.23, z);
    scene.add(lamp);
    return lamp;
  });
  return { permanent, details, lamps };
}

function echoHalo(scene: THREE.Scene, position: THREE.Vector3, name: string) {
  const group = new THREE.Group();
  group.name = name;
  group.position.copy(position);
  scene.add(group);
  const rings = [0.62, .81].map((radius, i) => {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(radius - .02, radius + .02, 40),
      new THREE.MeshBasicMaterial({
        color: C.teal, transparent: true, opacity: 0, depthWrite: false,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = .005 + i * .009;
    group.add(mesh);
    return mesh;
  });
  const particles = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(.035, 0),
    new THREE.MeshBasicMaterial({ color: C.teal, transparent: true, opacity: .8, depthWrite: false }),
    12,
  );
  group.add(particles);
  particles.visible = false;
  return { group, rings, particles };
}

export function createL01Art(
  scene: THREE.Scene,
  ground: THREE.Mesh,
  grid: THREE.GridHelper,
  plinth: THREE.Mesh,
  meshMap: Map<string, THREE.Mesh>,
  anchorA: THREE.Vector3,
  anchorB: THREE.Vector3,
) {
  const environment = buildEnvironment(scene, ground, grid, plinth, meshMap);
  const mail = mailbox(); scene.add(mail);
  const sign = postaneSign(); scene.add(sign);
  const character = new AdaModel();
  scene.add(character.root);
  const echoA = echoHalo(scene, anchorA, 'ECHO_A_SeaGlass_Rings');
  const echoB = echoHalo(scene, anchorB, 'ECHO_B_SeaGlass_Rings');
  let quality: ArtQuality = 'auto';
  let clock = 0;
  let low = false;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const onMotion = (event: MediaQueryListEvent) => { reducedMotion = event.matches; };
  motionQuery.addEventListener('change', onMotion);

  function setQuality(next: ArtQuality, mobile = false): void {
    quality = next;
    low = quality === 'low' || (quality === 'auto' && mobile);
    environment.details.visible = !low;
    environment.lamps[1].visible = !low;
    echoA.particles.visible = !low && echoA.particles.visible;
    echoB.particles.visible = !low && echoB.particles.visible;
  }
  function animateHalo(
    halo: ReturnType<typeof echoHalo>, active: boolean, progress: number, revealed: boolean,
    dt: number,
  ): void {
    halo.group.visible = revealed;
    if (!revealed) return;
    halo.rings.forEach((ring, i) => {
      (ring.material as THREE.MeshBasicMaterial).opacity = active ? (.18 + .21 * progress) : 0;
      const offset = reducedMotion ? 1 : 1 + .055 * Math.sin(clock * 2 + i * 2);
      ring.scale.setScalar(offset);
    });
    const show = active && !low && !reducedMotion;
    halo.particles.visible = show;
    if (show) {
      const dummy = new THREE.Object3D();
      for (let i = 0; i < halo.particles.count; i++) {
        const angle = i * Math.PI * 2 / halo.particles.count + clock * .25;
        const radius = .43 + (i % 3) * .11;
        dummy.position.set(Math.cos(angle) * radius, .05 + ((clock * .16 + i * .13) % 1) * .82,
          Math.sin(angle) * radius);
        dummy.scale.setScalar(.5 + progress * .7);
        dummy.updateMatrix();
        halo.particles.setMatrixAt(i, dummy.matrix);
      }
      halo.particles.instanceMatrix.needsUpdate = true;
    }
    void dt;
  }
  function update(dt: number, dx: number, dz: number, echo: EchoSnapshot, bRevealed: boolean): void {
    clock += dt;
    character.update(dt, dx, dz, reducedMotion);
    animateHalo(echoA, echo.groupId === 'l01_entry' && echo.visualProgress > 0,
      echo.groupId === 'l01_entry' ? echo.visualProgress : 0, true, dt);
    animateHalo(echoB, echo.groupId === 'l01_stairs' && echo.visualProgress > 0,
      echo.groupId === 'l01_stairs' ? echo.visualProgress : 0, bRevealed, dt);
    if (!low && !reducedMotion) {
      const pulse = 1 + Math.sin(clock * 1.35) * .05;
      environment.lamps[0].intensity = 7 * pulse;
      environment.lamps[1].intensity = 7 * (2 - pulse);
    }
  }
  function dispose(): void {
    motionQuery.removeEventListener('change', onMotion);
    for (const root of [environment.permanent, environment.details, mail, sign,
      character.root, echoA.group, echoB.group]) {
      root.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose();
          material.dispose();
        }
      });
      root.removeFromParent();
    }
    for(const lamp of environment.lamps) lamp.removeFromParent();
  }
  setQuality('auto', window.matchMedia('(max-width: 800px)').matches);
  return {
    character: character.root,
    mailboxTarget: mail,
    signTarget: sign.getObjectByName('PROP_PostaneSign_Label')!,
    setQuality,
    update,
    interact: () => character.interact(),
    record: () => character.record(),
    dispose,
    get quality() { return quality; },
    get reducedMotion() { return reducedMotion; },
  };
}
