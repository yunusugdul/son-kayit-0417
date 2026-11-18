import type { GameAction, PuzzleDef } from '../content/levelSchema.ts';

export interface PuzzlePorts {
  apply(action: GameAction): void;
}
export class PuzzleSystem {
  private readonly fired = new Set<string>();
  private readonly definitions: PuzzleDef[];
  private readonly flags: ReadonlySet<string>;
  private readonly ports: PuzzlePorts;
  constructor(definitions: PuzzleDef[], flags: ReadonlySet<string>, ports: PuzzlePorts) {
    this.definitions = definitions;
    this.flags = flags;
    this.ports = ports;
    for (const puzzle of definitions) {
      if (puzzle.then.some(action => action.type === 'setFlag') &&
          puzzle.then.filter(action => action.type === 'setFlag')
            .every(action => action.type === 'setFlag' && this.flags.has(action.flag))) {
        this.fired.add(puzzle.id);
      }
    }
  }
  emit(kind: 'interactId' | 'triggerId', id: string): boolean {
    let handled = false;
    for (const puzzle of this.definitions) {
      if (puzzle.when[kind] !== id || this.fired.has(puzzle.id)) continue;
      this.fired.add(puzzle.id);
      for (const action of puzzle.then) this.ports.apply(action);
      handled = true;
    }
    return handled;
  }
  hasFired(id: string): boolean { return this.fired.has(id); }
}
