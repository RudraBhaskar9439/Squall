// Run the backtest, print a summary, and write web/public/simulation.json
// for the on-site Simulation chart.
//   run: node --experimental-transform-types src/run.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { simulate, monteCarlo, DEFAULTS } from "./model.ts";

const OUT = new URL("../../web/public/simulation.json", import.meta.url).pathname;

const PATH_SEED = 23;
const r = simulate(DEFAULTS, PATH_SEED);
const mc = monteCarlo(DEFAULTS, 1000);
const pct = (x: number) => `${(x * 100).toFixed(2)}%`;
const row = (label: string, s: { apy: number; maxDrawdown: number; sharpe: number; finalNav: number }) =>
  `${label.padEnd(14)}${pct(s.apy).padEnd(11)}${pct(s.maxDrawdown).padEnd(11)}${s.sharpe.toFixed(2).padEnd(9)}${s.finalNav.toFixed(3)}`;

console.log("\nStrata premium-harvest backtest (1y, weekly rolls)\n");
console.log(`Illustrative path (seed ${PATH_SEED}, crash @ epoch ${DEFAULTS.crashEpoch})`);
console.log("              APY        maxDD      Sharpe   finalNAV");
console.log(row("naive PLP", r.naive));
console.log(row("Strata hedged", r.hedged));
console.log(`\nMonte Carlo (${mc.runs} random crash scenarios) — averages`);
console.log("              APY        maxDD      Sharpe   finalNAV");
console.log(row("naive PLP", mc.naive));
console.log(row("Strata hedged", mc.hedged));

// Downsample paths for a lightweight chart payload.
const step = Math.max(1, Math.floor(r.navNaive.length / 180));
const sample = (a: number[]) => a.filter((_, i) => i % step === 0);

const payload = {
  generatedSeed: PATH_SEED,
  params: DEFAULTS,
  crashEpoch: r.crashEpoch,
  navNaive: sample(r.navNaive),
  navHedged: sample(r.navHedged),
  path: { naive: r.naive, hedged: r.hedged },
  monteCarlo: { runs: mc.runs, naive: mc.naive, hedged: mc.hedged },
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(payload, null, 2));
console.log(`\nwrote ${OUT}\n`);
