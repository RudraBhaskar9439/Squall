import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/** Tiny JSON-file state store for crash recovery (resume after restart). */
export class StateStore<T extends object> {
  constructor(
    private path: string,
    private defaults: T,
  ) {}

  load(): T {
    if (!existsSync(this.path)) return { ...this.defaults };
    try {
      return { ...this.defaults, ...JSON.parse(readFileSync(this.path, "utf8")) };
    } catch {
      return { ...this.defaults };
    }
  }

  save(state: T): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(state, null, 2));
  }
}
