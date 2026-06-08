// Robustness sweep: run the Monte Carlo across many market regimes and check
// the hedge holds up everywhere (lower drawdown + better Sharpe), not just one
// config.  run: node --experimental-transform-types src/stress.ts
import { monteCarlo, DEFAULTS, type SimParams } from "./model.ts";

const RUNS = 2000;

const regimes: { name: string; over: Partial<SimParams> }[] = [
  { name: "Calm market (IV 35%)", over: { ivBase: 0.35 } },
  { name: "Normal market (IV 65%)", over: {} },
  { name: "High vol (IV 110%)", over: { ivBase: 1.1 } },
  { name: "Thin edge (realized 95%)", over: { realizedFraction: 0.95 } },
  { name: "Fat edge (realized 80%)", over: { realizedFraction: 0.8 } },
  { name: "Conservative (40% deployed)", over: { deployedFraction: 0.4 } },
  { name: "Aggressive (80% deployed)", over: { deployedFraction: 0.8 } },
];

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
let ddWins = 0;
let sharpeWins = 0;

console.log(`\nSquall robustness sweep — Monte Carlo ${RUNS} runs per regime\n`);
console.log(
  "regime".padEnd(30) +
    "naiveDD".padEnd(9) +
    "hedgedDD".padEnd(10) +
    "ΔDD".padEnd(9) +
    "naiveSh".padEnd(9) +
    "hedgedSh",
);
console.log("-".repeat(74));

for (const r of regimes) {
  const mc = monteCarlo({ ...DEFAULTS, ...r.over }, RUNS);
  const ddRed = mc.naive.maxDrawdown - mc.hedged.maxDrawdown;
  if (mc.hedged.maxDrawdown < mc.naive.maxDrawdown) ddWins++;
  if (mc.hedged.sharpe > mc.naive.sharpe) sharpeWins++;
  console.log(
    r.name.padEnd(30) +
      pct(mc.naive.maxDrawdown).padEnd(9) +
      pct(mc.hedged.maxDrawdown).padEnd(10) +
      `-${pct(ddRed)}`.padEnd(9) +
      mc.naive.sharpe.toFixed(2).padEnd(9) +
      mc.hedged.sharpe.toFixed(2),
  );
}

console.log("-".repeat(74));
console.log(
  `\nHedge lowered drawdown in ${ddWins}/${regimes.length} regimes; ` +
    `improved Sharpe in ${sharpeWins}/${regimes.length}.`,
);
console.log(
  ddWins === regimes.length
    ? "✅ Robust: the hedge reduces tail risk across every regime tested.\n"
    : "⚠️ Check regimes where the hedge underperformed.\n",
);
