import { test } from "node:test";
import assert from "node:assert/strict";
import type { Snapshot } from "@strata/sdk";
import { Snapshotter } from "../src/services/snapshotter.ts";
import { MockChainClient } from "../src/adapters/mockChainClient.ts";

const silentLog = { info() {}, warn() {}, error() {} };

test("builds a snapshot from chain state and writes it", async () => {
  const chain = new MockChainClient(
    [],
    1_780_000_000_000,
    { idle: 40_000_000, deployed: 59_999_999, totalAssets: 99_999_999, totalShares: 100_000_000_000 },
    650_000,
  );

  const written: Snapshot[] = [];
  const fakeWrite = async (s: Snapshot) => {
    written.push(s);
    return `BLOB_${s.epoch}`;
  };

  const snap = new Snapshotter(chain, silentLog, fakeWrite);
  const r = await snap.capture("rolled into next expiry");

  assert.equal(r.blobId, "BLOB_0");
  assert.equal(r.snapshot.navAssets, 99_999_999);
  assert.equal(r.snapshot.deployed, 59_999_999);
  assert.equal(r.snapshot.totalShares, 100_000_000_000);
  assert.equal(r.snapshot.volIndex, 650_000);
  assert.equal(r.snapshot.tsMs, 1_780_000_000_000);
  assert.equal(r.snapshot.rationale, "rolled into next expiry");
  assert.deepEqual(written, [r.snapshot]);
});

test("epoch increments across captures", async () => {
  const chain = new MockChainClient([], 0);
  const snap = new Snapshotter(chain, silentLog, async () => "BLOB");
  const a = await snap.capture();
  const b = await snap.capture();
  assert.equal(a.snapshot.epoch, 0);
  assert.equal(b.snapshot.epoch, 1);
});
