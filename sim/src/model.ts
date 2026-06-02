// Backtest of the Strata premium-harvest strategy.
//
// The PLP vault is the option-seller: each epoch it collects a straddle-like
// premium priced off implied vol, and pays the realized move. When implied vol
// exceeds realized vol, the seller profits on average — but a large move
// (tail) causes a big loss. The "hedged" variant spends part of the premium on
// out-of-the-money protection that pays off on big moves, capping the tail.
//
// We compare the naive PLP seller vs. the Strata hedged vault on the same
// price path, including an injected crash, and report APY / max drawdown /
// Sharpe.
import { gaussian, mulberry32 } from "./rng.ts";

export interface SimParams {
  periods: number; // number of epochs (e.g. 365 daily)
  periodsPerYear: number;
  deployedFraction: number; // share of vault supplied to PLP
  ivBase: number; // base annualized implied vol (e.g. 0.65)
  realizedFraction: number; // realized vol = realizedFraction * ivBase (<1 => seller edge)
  premiumCapture: number; // straddle premium coefficient (~0.8)
  hedgeRatio: number; // insurance cost as a fraction of premium (a yield drag)
  lossFloor: number; // per-epoch loss cap on the deployed strategy (the hedge floor)
  crashEpoch: number; // epoch to inject a crash
  crashMove: number; // crash magnitude (fraction, e.g. 0.25)
  crashIvSpike: number; // IV multiplier during the crash
}

export const DEFAULTS: SimParams = {
  periods: 52, // weekly rolls over a year
  periodsPerYear: 52,
  deployedFraction: 0.6,
  ivBase: 0.65,
  realizedFraction: 0.88, // realized vol ~ 88% of implied => modest seller edge
  premiumCapture: 0.8, // straddle premium coefficient
  hedgeRatio: 0.02, // insurance spend (fraction of premium) — a real yield drag
  lossFloor: 0.1, // hedge caps the deployed strategy's loss at 10% per epoch
  crashEpoch: 38, // a crash ~3/4 through the year
  crashMove: 0.25, // 25% move
  crashIvSpike: 2.5, // (flavor; pricing uses start-of-period IV)
};

export interface Stats {
  apy: number;
  maxDrawdown: number;
  sharpe: number;
  finalNav: number;
}

export interface SimResult {
  navNaive: number[];
  navHedged: number[];
  naive: Stats;
  hedged: Stats;
  crashEpoch: number;
}

const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const std = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length);
};
function maxDrawdown(nav: number[]): number {
  let peak = nav[0];
  let dd = 0;
  for (const v of nav) {
    peak = Math.max(peak, v);
    dd = Math.max(dd, (peak - v) / peak);
  }
  return dd;
}
function sharpe(ret: number[], ppy: number): number {
  const sd = std(ret);
  return sd === 0 ? 0 : (mean(ret) / sd) * Math.sqrt(ppy);
}

export function simulate(params: SimParams = DEFAULTS, seed = 42): SimResult {
  const p = params;
  const dt = 1 / p.periodsPerYear;
  const rng = mulberry32(seed);

  let navN = 1;
  let navH = 1;
  const navNaive = [1];
  const navHedged = [1];
  const retN: number[] = [];
  const retH: number[] = [];

  for (let i = 0; i < p.periods; i++) {
    const isCrash = i === p.crashEpoch;
    // Premium and the hedge strike are priced at the start of the period, off
    // the prevailing implied vol (the crash is an unanticipated realized move).
    const iv = p.ivBase;

    // realized move this epoch
    const realVol = p.realizedFraction * p.ivBase;
    let move = Math.abs(realVol * Math.sqrt(dt) * gaussian(rng));
    if (isCrash) move = p.crashMove;

    // straddle-like premium priced off implied vol
    const premium = p.premiumCapture * iv * Math.sqrt(dt);

    // naive PLP: collect premium, pay the realized move (uncapped tail risk)
    const plp = premium - move;

    // hedged: insurance floors the per-epoch loss at lossFloor, for a small
    // continuous cost (yield drag in calm periods, protection in crashes)
    const cappedPlp = Math.max(plp, -p.lossFloor);
    const hedgeCost = p.hedgeRatio * premium;

    const rN = p.deployedFraction * plp;
    const rH = p.deployedFraction * cappedPlp - hedgeCost;
    navN *= 1 + rN;
    navH *= 1 + rH;
    retN.push(rN);
    retH.push(rH);
    navNaive.push(navN);
    navHedged.push(navH);
  }

  const stats = (nav: number[], ret: number[]): Stats => ({
    apy: nav[nav.length - 1] ** (p.periodsPerYear / p.periods) - 1,
    maxDrawdown: maxDrawdown(nav),
    sharpe: sharpe(ret, p.periodsPerYear),
    finalNav: nav[nav.length - 1],
  });

  return {
    navNaive,
    navHedged,
    naive: stats(navNaive, retN),
    hedged: stats(navHedged, retH),
    crashEpoch: p.crashEpoch,
  };
}

export interface MonteCarloResult {
  runs: number;
  naive: Stats;
  hedged: Stats;
}

/** Average stats across many paths, each with a randomly placed/sized crash —
 *  so the headline numbers aren't a single lucky path. */
export function monteCarlo(params: SimParams = DEFAULTS, runs = 500, baseSeed = 1): MonteCarloResult {
  const pick = mulberry32(baseSeed);
  const acc = {
    naive: { apy: 0, maxDrawdown: 0, sharpe: 0, finalNav: 0 },
    hedged: { apy: 0, maxDrawdown: 0, sharpe: 0, finalNav: 0 },
  };
  for (let i = 0; i < runs; i++) {
    const crashEpoch = Math.floor(pick() * params.periods);
    const crashMove = 0.1 + pick() * 0.25; // 10%–35% tail event
    const r = simulate({ ...params, crashEpoch, crashMove }, (baseSeed * 7919 + i) >>> 0);
    for (const side of ["naive", "hedged"] as const) {
      acc[side].apy += r[side].apy;
      acc[side].maxDrawdown += r[side].maxDrawdown;
      acc[side].sharpe += r[side].sharpe;
      acc[side].finalNav += r[side].finalNav;
    }
  }
  const avg = (s: Stats): Stats => ({
    apy: s.apy / runs,
    maxDrawdown: s.maxDrawdown / runs,
    sharpe: s.sharpe / runs,
    finalNav: s.finalNav / runs,
  });
  return { runs, naive: avg(acc.naive), hedged: avg(acc.hedged) };
}
