/** Minimal Web Audio SFX; no external files or audio-only puzzle clues. */
export class AudioManager {
  private context: AudioContext | null = null;
  async unlock(): Promise<void> {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { this.context = null; } // Text remains the source of truth.
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
}
