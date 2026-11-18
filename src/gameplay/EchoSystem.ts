/** Aşama 2: deltaTime-driven, deterministic single-echo state machine. No wall-clock timers. */
export type TapeId = 'bell' | 'oven' | 'tram' | 'clock' | 'harbor' | 'archive';
export type EchoPhase = 'inactive' | 'materializing' | 'active' | 'safe_hold' | 'fading' | 'cooldown';

export interface EchoAnchorDef {
  id: string;
  tapeId: TapeId;
  echoGroupId: string;
  activeSeconds: number;
  cooldownSeconds: number;
  activationRadius: number;
  oneShot?: boolean;
  requiredFlags?: string[];
}
export interface EchoGroupDef {
  id: string;
  objectIds: string[];
  navigationLinkIds?: string[];
  supportObjectIds?: string[];
  protectedVolumeIds?: string[];
}
export interface EchoSnapshot {
  phase: EchoPhase;
  anchorId: string | null;
  groupId: string | null;
  secondsRemaining: number;
  visualProgress: number;
  traversable: boolean;
}
export type EchoActivationResult = 'started' | 'already-active' | 'busy' | 'cooldown' |
  'unknown-anchor' | 'wrong-tape' | 'missing-flag' | 'out-of-range' | 'used';

const MATERIALIZE_SECONDS = 0.4;
const FADE_SECONDS = 0.6;

export class EchoSystem {
  readonly anchors = new Map<string, EchoAnchorDef>();
  readonly groups = new Map<string, EchoGroupDef>();
  readonly usedOneShots = new Set<string>();
  private phase: EchoPhase = 'inactive';
  private current: EchoAnchorDef | null = null;
  private remaining = 0;
  onPhaseChange: ((snapshot: EchoSnapshot) => void) | null = null;

  constructor(anchors: EchoAnchorDef[], groups: EchoGroupDef[]) {
    for (const group of groups) {
      if (this.groups.has(group.id)) throw new Error(`Duplicate echo group: ${group.id}`);
      if (!group.objectIds.length) throw new Error(`Empty echo group: ${group.id}`);
      this.groups.set(group.id, { ...group });
    }
    for (const anchor of anchors) {
      if (this.anchors.has(anchor.id)) throw new Error(`Duplicate echo anchor: ${anchor.id}`);
      if (!this.groups.has(anchor.echoGroupId)) throw new Error(`Missing echo group: ${anchor.echoGroupId}`);
      if (anchor.activeSeconds < 2 || anchor.activeSeconds > 60 || !Number.isFinite(anchor.activeSeconds))
        throw new Error(`Invalid echo duration: ${anchor.id}`);
      if (!(anchor.cooldownSeconds > 0) || !Number.isFinite(anchor.cooldownSeconds) ||
        !(anchor.activationRadius > 0) || !Number.isFinite(anchor.activationRadius))
        throw new Error(`Invalid echo cooldown/radius: ${anchor.id}`);
      this.anchors.set(anchor.id, { ...anchor, requiredFlags: [...(anchor.requiredFlags ?? [])] });
    }
  }

  /** New game starts with no active or held echo. */
  reset(): void {
    this.phase = 'inactive'; this.current = null; this.remaining = 0;
    this.usedOneShots.clear();
    this.onPhaseChange?.(this.snapshot);
  }

  get snapshot(): EchoSnapshot {
    let visualProgress = 0;
    if (this.phase === 'materializing') visualProgress = 1 - this.remaining / MATERIALIZE_SECONDS;
    else if (this.phase === 'active' || this.phase === 'safe_hold') visualProgress = 1;
    else if (this.phase === 'fading') visualProgress = this.remaining / FADE_SECONDS;
    return {
      phase: this.phase,
      anchorId: this.current?.id ?? null,
      groupId: this.current?.echoGroupId ?? null,
      secondsRemaining: this.remaining,
      visualProgress: Math.max(0, Math.min(1, visualProgress)),
      traversable: this.phase === 'active' || this.phase === 'safe_hold',
    };
  }

  /** Caller supplies measured distance; no hidden teleport or automatic tape acquisition. */
  activate(anchorId: string, tapeId: TapeId | null, distance: number, flags: ReadonlySet<string>): EchoActivationResult {
    const anchor = this.anchors.get(anchorId);
    if (!anchor) return 'unknown-anchor';
    if (this.phase === 'cooldown') return 'cooldown';
    if (this.phase !== 'inactive') return this.current?.id === anchorId ? 'already-active' : 'busy';
    if (tapeId !== anchor.tapeId) return 'wrong-tape';
    if (!(distance <= anchor.activationRadius) || distance < 0) return 'out-of-range';
    if (anchor.requiredFlags?.some(flag => !flags.has(flag))) return 'missing-flag';
    if (anchor.oneShot && this.usedOneShots.has(anchor.id)) return 'used';
    this.current = anchor;
    if (anchor.oneShot) this.usedOneShots.add(anchor.id);
    this.transition('materializing', MATERIALIZE_SECONDS);
    return 'started';
  }

  /** Evaluates protection at each transition and while held; called only by the fixed game loop. */
  fixedUpdate(deltaTime: number, isProtected: (group: EchoGroupDef) => boolean): void {
    if (!Number.isFinite(deltaTime) || deltaTime < 0) throw new Error('Invalid echo deltaTime');
    let dt = deltaTime;
    let transitions = 0;
    while (this.current && transitions++ < 8) {
      if (this.phase === 'safe_hold') {
        if (isProtected(this.groups.get(this.current.echoGroupId)!)) return;
        this.transition('fading', FADE_SECONDS);
        if (dt === 0) return;
        continue;
      }
      if (this.phase === 'inactive') return;
      const advance = Math.min(dt, this.remaining);
      this.remaining = Math.max(0, this.remaining - advance);
      dt -= advance;
      if (this.remaining > 1e-9) return;
      if (this.phase === 'materializing') this.transition('active', this.current.activeSeconds);
      else if (this.phase === 'active') {
        if (isProtected(this.groups.get(this.current.echoGroupId)!)) this.transition('safe_hold', 0);
        else this.transition('fading', FADE_SECONDS);
      }
      else if (this.phase === 'fading') this.transition('cooldown', this.current.cooldownSeconds);
      else if (this.phase === 'cooldown') {
        this.current = null;
        this.transition('inactive', 0);
      }
      if (dt <= 1e-9) return;
    }
  }

  private transition(phase: EchoPhase, seconds: number): void {
    this.phase = phase;
    this.remaining = seconds;
    this.onPhaseChange?.(this.snapshot);
  }
}
