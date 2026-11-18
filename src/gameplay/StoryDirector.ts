import tr from '../content/locales/tr.json';

const strings: Record<string, unknown> = tr;
export function translated(key: string): string {
  let current: unknown = strings;
  for (const part of key.split('.')) {
    if (!current || typeof current !== 'object' || !(part in current)) return key;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : key;
}
/** All story information is always rendered as accessible text; sound is optional. */
export class StoryDirector {
  constructor(private readonly subtitle: HTMLElement) {}
  show(key: string): void {
    this.subtitle.textContent = translated(key);
    this.subtitle.hidden = false;
  }
  dismiss(): void { this.subtitle.hidden = true; }
}
