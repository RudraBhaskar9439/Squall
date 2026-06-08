// Empirical backtest on REAL BTC price history (Binance daily closes).
// Runs the premium-harvest strategy over the actual path — including BTC's real
// crashes. Implied vol is proxied from trailing realized vol × a vol-risk
// premium (free historical BTC IV isn't readily available), but the price path
// — and therefore every realized move and drawdown — is real.
//   run: node --experimental-transform-types src/historical.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const DATA = new URL("../data/btc-daily.json", import.meta.url).pathname;
const OUT = new URL("../../web/public/historical.json", import.meta.url).pathname;

const P = {
  deployedFraction: 0.6,
  premiumCapture: 0.8, // ATM straddle coefficient (~sqrt(2/pi))
  ivMarkup: 1.05, // implied ≈ realized + ~5% vol-risk premium (conservative, literature-grounded)
  realizedWindow: 30,
  lossFloor: 0.12, // hedge caps the deployed strategy's daily loss
  hedgeRatio: 0.02, // insurance cost as a fraction of premium
  ppy: 365,
};

async function loadCloses(): Promise<number[]> {
  if (existsSync(DATA)) return JSON.parse(readFileSync(DATA, "utf8"));
  const res = await fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=1000");
  const k = (await res.json()) as string[][];
  const closes = k.map((r) => parseFloat(r[4]));
  mkdirSync(dirname(DATA), { recursive: true });
  writeFileSync(DATA, JSON.stringify(closes));
  return closes;
}

const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const std = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / a.length);
};
function maxDrawdown(nav: number[]) {
  let peak = nav[0];
  let dd = 0;
  for (const v of nav) {
    peak = Math.max(peak, v);
    dd = Math.max(dd, (peak - v) / peak);
  }
  return dd;
}
const trailingVol = (rets: number[], i: number, w: number) => {
  const s = rets.slice(Math.max(0, i - w), i);
  if (s.length < 5) return 0.6;
  return std(s) * Math.sqrt(365);
};

async function main() {
  const closes = await loadCloses();
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));

  const dt = 1 / 365;
  let navN = 1;
  let navH = 1;
  const arrN = [1];
  const arrH = [1];
  const retN: number[] = [];
  const retH: number[] = [];

  for (let i = 0; i < rets.length; i++) {
    const iv = Math.max(0.15, trailingVol(rets, i, P.realizedWindow)) * P.ivMarkup;
    const premium = P.premiumCapture * iv * Math.sqrt(dt);
    const move = Math.abs(rets[i]);
    const plp = premium - move;
    const capped = Math.max(plp, -P.lossFloor);
    const cost = P.hedgeRatio * premium;
    const rN = P.deployedFraction * plp;
    const rH = P.deployedFraction * capped - cost;
    navN *= 1 + rN;
    navH *= 1 + rH;
    retN.push(rN);
    retH.push(rH);
    arrN.push(navN);
    arrH.push(navH);
  }

  const years = rets.length / 365;
  const stat = (nav: number[], ret: number[]) => ({
    apy: nav[nav.length - 1] ** (1 / years) - 1,
    maxDrawdown: maxDrawdown(nav),
    sharpe: (mean(ret) / std(ret)) * Math.sqrt(P.ppy),
    finalNav: nav[nav.length - 1],
  });
  const naive = stat(arrN, retN);
  const hedged = stat(arrH, retH);
  const btcHoldNav = closes[closes.length - 1] / closes[0];
  const btcDD = maxDrawdown(closes);
  const btcApy = btcHoldNav ** (1 / years) - 1;

  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
  console.log(`\nEmpirical backtest on REAL BTC daily history (${rets.length} days, ~${years.toFixed(1)}y)\n`);
  console.log("                APY        maxDD      Sharpe   finalNAV");
  const row = (l: string, s: { apy: number; maxDrawdown: number; sharpe: number; finalNav: number }) =>
    `${l.padEnd(16)}${pct(s.apy).padEnd(11)}${pct(s.maxDrawdown).padEnd(11)}${s.sharpe.toFixed(2).padEnd(9)}${s.finalNav.toFixed(3)}`;
  console.log(row("naive PLP", naive));
  console.log(row("Squall hedged", hedged));
  console.log(`${"hold BTC".padEnd(16)}${pct(btcApy).padEnd(11)}${pct(btcDD).padEnd(11)}${"—".padEnd(9)}${btcHoldNav.toFixed(3)}`);
  console.log(`\nBTC drew down ${pct(btcDD)} over the window; the hedged vault's worst drawdown was ${pct(hedged.maxDrawdown)}.`);

  const step = Math.max(1, Math.floor(arrN.length / 200));
  const sample = (a: number[]) => a.filter((_, i) => i % step === 0);
  writeFileSync(
    OUT,
    JSON.stringify({ days: rets.length, years, naive, hedged, btc: { apy: btcApy, maxDrawdown: btcDD, finalNav: btcHoldNav }, navNaive: sample(arrN), navHedged: sample(arrH) }, null, 2),
  );
  console.log(`\nwrote ${OUT}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
