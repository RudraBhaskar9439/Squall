import { test } from "node:test";
import assert from "node:assert/strict";
import { MS_PER_YEAR } from "@strata/sdk";
import { VolIndexUpdater } from "../src/services/volIndexUpdater.ts";
import { MockChainClient } from "../src/adapters/mockChainClient.ts";
import type { OracleSnapshot } from "../src/domain/types.ts";

const silentLog = { info() {}, warn() {}, error() {} };

function oracle(expiryMs: number): OracleSnapshot {
  // a=0.04, b=0.1, rho=0, m=0, sigma=0.2 (1e9-scaled)
  return {
    oracleId: "0xoracle",
    expiryMs,
    spot: 100,
    forward: 100,
    svi: { a: 40_000_000n, b: 100_000_000n, rho: 0n, m: 0n, sigma: 200_000_000n },
  };
}

test("pushes computed index from the front oracle", async () => {
  const chain = new MockChainClient([oracle(0.5 * MS_PER_YEAR)], 0);
  const u = new VolIndexUpdater(chain, silentLog, { minChange: 1 });
  const r = await u.tick();
  assert.equal(r.pushed, true);
  assert.equal(r.value, 346_410); // sqrt(0.06/0.5) -> 0.34641 -> 1e6 scale
  assert.deepEqual(chain.pushed, [346_410]);
});

test("debounces pushes below the change threshold", async () => {
  const chain = new MockChainClient([oracle(0.5 * MS_PER_YEAR)], 0);
  const u = new VolIndexUpdater(chain, silentLog, { minChange: 500 });
  await u.tick(); // first push
  const r = await u.tick(); // identical value -> skip
  assert.equal(r.pushed, false);
  assert.equal(chain.pushed.length, 1);
});

test("picks the nearest-expiry oracle", async () => {
  const chain = new MockChainClient(
    [oracle(2 * MS_PER_YEAR), oracle(0.25 * MS_PER_YEAR)],
    0,
  );
  const u = new VolIndexUpdater(chain, silentLog, { minChange: 1 });
  const r = await u.tick();
  // front = 0.25y -> sqrt(0.06/0.25) = sqrt(0.24) = 0.489898 -> 489898
  assert.equal(r.value, 489_898);
});

test("no active oracles -> no push", async () => {
  const chain = new MockChainClient([], 0);
  const u = new VolIndexUpdater(chain, silentLog);
  const r = await u.tick();
  assert.equal(r.pushed, false);
});
