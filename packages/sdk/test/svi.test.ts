import { test } from "node:test";
import assert from "node:assert/strict";
import {
  totalVarianceAtm,
  impliedVolAtm,
  logMoneyness,
  validateSvi,
  fromScaled,
  toIndexValue,
  atmIndexFromOracle,
  MS_PER_YEAR,
  type SviParams,
} from "../src/svi.ts";

const close = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `${a} != ${b} (eps ${eps})`);

test("totalVarianceAtm computes w(0)", () => {
  // a=0.04, b=0.1, rho=-0.3, m=0, sigma=0.2
  // w(0) = 0.04 + 0.1*( -0.3*0 + sqrt(0 + 0.04) ) = 0.04 + 0.1*0.2 = 0.06
  const p: SviParams = { a: 0.04, b: 0.1, rho: -0.3, m: 0, sigma: 0.2 };
  close(totalVarianceAtm(p), 0.06);
});

test("impliedVolAtm annualizes correctly", () => {
  // w(0)=0.06 over T=0.5y -> iv = sqrt(0.06/0.5) = sqrt(0.12)
  const p: SviParams = { a: 0.04, b: 0.1, rho: -0.3, m: 0, sigma: 0.2 };
  close(impliedVolAtm(p, 0.5), Math.sqrt(0.12));
});

test("impliedVolAtm is 0 at/after expiry", () => {
  const p: SviParams = { a: 0.04, b: 0.1, rho: 0, m: 0, sigma: 0.2 };
  assert.equal(impliedVolAtm(p, 0), 0);
});

test("logMoneyness", () => {
  close(logMoneyness(110, 100), Math.log(1.1));
  close(logMoneyness(100, 100), 0);
});

test("fromScaled converts 1e9 fixed-point", () => {
  close(fromScaled(500_000_000), 0.5);
  close(fromScaled(1_000_000_000), 1.0);
});

test("toIndexValue scales to 1e6", () => {
  assert.equal(toIndexValue(0.65), 650_000);
  assert.equal(toIndexValue(0.3464101615), 346_410);
});

test("validateSvi flags bad params", () => {
  assert.deepEqual(validateSvi({ a: 0.04, b: 0.1, rho: -0.3, m: 0, sigma: 0.2 }), []);
  assert.ok(validateSvi({ a: 0.04, b: -1, rho: 0, m: 0, sigma: 0.2 }).length > 0);
  assert.ok(validateSvi({ a: 0.04, b: 0.1, rho: 1.5, m: 0, sigma: 0.2 }).length > 0);
  assert.ok(validateSvi({ a: 0.04, b: 0.1, rho: 0, m: 0, sigma: 0 }).length > 0);
});

test("atmIndexFromOracle end-to-end (1e9 in -> 1e6 out)", () => {
  // a=0.04, b=0.1, rho=0, m=0, sigma=0.2 ; T=0.5y -> iv=sqrt(0.12)=0.346410..
  const idx = atmIndexFromOracle({
    a: 40_000_000n,
    b: 100_000_000n,
    rho: 0n,
    m: 0n,
    sigma: 200_000_000n,
    nowMs: 0,
    expiryMs: 0.5 * MS_PER_YEAR,
  });
  assert.equal(idx, 346_410);
});
