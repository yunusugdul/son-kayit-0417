/** Procedural, original Web Audio SFX and gentle coastal wind ambience.
 * No network requests or copyrighted sound assets. Audio starts only after user gesture.
 */
export class AudioManager {
  private context: AudioContext | null = null;
  private atmosphere: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windOscillator: OscillatorNode | null = null;
  private ambienceEnabled = true;

  setAmbienceEnabled(enabled: boolean): void {
    this.ambienceEnabled = enabled;
    const gain = this.windGain, context = this.context;
    if (gain && context) {
      gain.gain.setTargetAtTime(enabled ? 0.010 : 0, context.currentTime, 0.10);
    }
  }
  get isAmbienceEnabled(): boolean { return this.ambienceEnabled; }

  private createCoastalAmbience(context: AudioContext): void {
    if (this.atmosphere) return;
    const duration = 3;
    const length = Math.ceil(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 0x0417; // repeatable, offline procedural source
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const white = seed / 0xffffffff * 2 - 1;
      last = last * 0.98 + white * 0.02;
      data[i] = last;
    }
    const wind = context.createBufferSource();
    wind.buffer = buffer; wind.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 850; filter.Q.value = .45;
    const gain = context.createGain();
    gain.gain.value = this.ambienceEnabled ? .01 : 0;
    wind.connect(filter).connect(gain).connect(context.destination);
    // Very slow wave swell; not a rhythmic music track.
    const lfo = context.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = .14;
    const envelope = context.createGain();
    envelope.gain.value = .0022;
    lfo.connect(envelope).connect(gain.gain);
    wind.start(); lfo.start();
    this.atmosphere = wind; this.windGain = gain; this.windOscillator = lfo;
  }

  async unlock(): Promise<void> {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
      if (this.context.state === 'running') this.createCoastalAmbience(this.context);
    } catch {
      // Text/visual signals remain the source of truth when audio is unavailable.
      this.context = null;
    }
  }

  play(kind: 'pickup' | 'echo' | 'checkpoint' | 'story' | 'error'): void {
    const context = this.context;
    if (!context || context.state !== 'running') return;
    const freq = {pickup: 680, echo: 435, checkpoint: 790, story: 330, error: 190}[kind];
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = kind === 'error' ? 'triangle' : 'sine';
    oscillator.frequency.setValueAtTime(freq, context.currentTime);
    if (kind === 'echo') oscillator.frequency.exponentialRampToValueAtTime(freq * 1.4, context.currentTime + 0.25);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.33);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  suspend(): void { if (this.context?.state === 'running') void this.context.suspend(); }
  async dispose(): Promise<void> {
    this.atmosphere?.stop();
    this.windOscillator?.stop();
    this.atmosphere = null; this.windOscillator = null;
    if (this.context) await this.context.close();
    this.context = null; this.windGain = null;
  }
}
