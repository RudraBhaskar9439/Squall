import type { Logger } from "../domain/types.ts";

/** Minimal structured JSON logger. */
export const consoleLogger: Logger = {
  info: (m, meta) => console.log(JSON.stringify({ level: "info", m, meta, t: Date.now() })),
  warn: (m, meta) => console.warn(JSON.stringify({ level: "warn", m, meta, t: Date.now() })),
  error: (m, meta) => console.error(JSON.stringify({ level: "error", m, meta, t: Date.now() })),
};
