// SVI volatility math — the brain of Strata's on-chain volatility index.
//
// The Predict OracleSVI publishes raw SVI parameters (a, b, rho, m, sigma) in
// 1e9 fixed-point. This module reconstructs the implied-volatility surface from
// them, extracts the annualized at-the-money (ATM) vol, and scales it for the
// on-chain `vol_index` (1e6 scale: 650000 = 65%). All math is in float space;
// the keeper reads the chain, calls this, and pushes the result.

/** SVI raw parameters in float space (already divided by FLOAT_SCALING). */
export interface SviParams {
  a: number; // base variance level
  b: number; // wing slope (>= 0)
  rho: number; // skew, in (-1, 1)
  m: number; // horizontal shift
  sigma: number; // curvature (> 0)
}

export const FLOAT_SCALING = 1_000_000_000; // on-chain 1e9 fixed-point
export const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;
export const INDEX_SCALE = 1_000_000; // vol_index value scale (1e6)

/** Convert an on-chain 1e9-scaled integer to a float. */
export function fromScaled(raw: number | bigint): number {
  return Number(raw) / FLOAT_SCALING;
}

/** Raw SVI total implied variance w(k) for log-moneyness k. */
export function totalVariance(p: SviParams, k: number): number {
  const d = k - p.m;
  return p.a + p.b * (p.rho * d + Math.sqrt(d * d + p.sigma * p.sigma));
}

/** ATM total variance, w(0). */
export function totalVarianceAtm(p: SviParams): number {
  return totalVariance(p, 0);
}

/** Log-moneyness ln(strike / forward). */
export function logMoneyness(strike: number, forward: number): number {
  return Math.log(strike / forward);
}

/** Time to expiry in years (inputs in ms). Clamped at 0. */
export function yearsToExpiry(nowMs: number, expiryMs: number): number {
  return Math.max(0, (expiryMs - nowMs) / MS_PER_YEAR);
}

/** Annualized implied vol at log-moneyness k for time-to-expiry tYears. */
export function impliedVol(p: SviParams, k: number, tYears: number): number {
  if (tYears <= 0) return 0;
  const w = totalVariance(p, k);
  return w <= 0 ? 0 : Math.sqrt(w / tYears);
}

/** Annualized ATM implied vol as a fraction (e.g. 0.65 = 65%). */
export function impliedVolAtm(p: SviParams, tYears: number): number {
  return impliedVol(p, 0, tYears);
}

/** Convert a vol fraction (0.65) to the on-chain index value (650000). */
export function toIndexValue(volFraction: number): number {
  return Math.round(volFraction * INDEX_SCALE);
}

/** Basic SVI sanity / no-arbitrage guards. Empty array = OK. */
export function validateSvi(p: SviParams): string[] {
  const problems: string[] = [];
  if (p.b < 0) problems.push("b must be >= 0");
  if (Math.abs(p.rho) >= 1) problems.push("|rho| must be < 1");
  if (p.sigma <= 0) problems.push("sigma must be > 0");
  // w(k) stays positive iff a + b*sigma*sqrt(1 - rho^2) >= 0
  const minVar = p.a + p.b * p.sigma * Math.sqrt(1 - p.rho * p.rho);
  if (minVar < 0) problems.push("minimum total variance is negative");
  return problems;
}

/** Full pipeline: raw on-chain oracle fields -> on-chain ATM vol index value. */
export function atmIndexFromOracle(args: {
  a: number | bigint;
  b: number | bigint;
  rho: number | bigint;
  m: number | bigint;
  sigma: number | bigint;
  nowMs: number;
  expiryMs: number;
}): number {
  const p: SviParams = {
    a: fromScaled(args.a),
    b: fromScaled(args.b),
    rho: fromScaled(args.rho),
    m: fromScaled(args.m),
    sigma: fromScaled(args.sigma),
  };
  const t = yearsToExpiry(args.nowMs, args.expiryMs);
  return toIndexValue(impliedVolAtm(p, t));
}
