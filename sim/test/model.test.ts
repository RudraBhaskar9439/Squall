import { test } from "node:test";
import assert from "node:assert/strict";
import { simulate, DEFAULTS } from "../src/model.ts";

test("is deterministic for a given seed", () => {
  const a = simulate(DEFAULTS, 7);
  const b = simulate(DEFAULTS, 7);
  assert.deepEqual(a.navHedged, b.navHedged);
  assert.deepEqual(a.naive, b.naive);
});

test("produces full NAV paths", () => {
  const r = simulate(DEFAULTS, 42);
  assert.equal(r.navNaive.length, DEFAULTS.periods + 1);
  assert.equal(r.navHedged.length, DEFAULTS.periods + 1);
  assert.equal(r.navNaive[0], 1);
});

test("hedge reduces max drawdown vs naive PLP", () => {
  const r = simulate(DEFAULTS, 42);
  assert.ok(
    r.hedged.maxDrawdown < r.naive.maxDrawdown,
    `hedged DD ${r.hedged.maxDrawdown} should be < naive DD ${r.naive.maxDrawdown}`,
  );
});

test("a bigger crash hurts the naive seller more", () => {
  const mild = simulate({ ...DEFAULTS, crashMove: 0.1 }, 42);
  const severe = simulate({ ...DEFAULTS, crashMove: 0.4 }, 42);
  assert.ok(severe.naive.maxDrawdown > mild.naive.maxDrawdown);
});

test("premium accrues when realized vol stays below implied", () => {
  // no crash, low realized vol -> seller should end above starting NAV
  const r = simulate({ ...DEFAULTS, crashEpoch: -1, realizedFraction: 0.6 }, 42);
  assert.ok(r.naive.finalNav > 1, `finalNav ${r.naive.finalNav}`);
});
