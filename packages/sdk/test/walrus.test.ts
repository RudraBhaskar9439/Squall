import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { writeSnapshot, readSnapshot, type Snapshot } from "../src/walrus.ts";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const sample: Snapshot = {
  epoch: 3,
  tsMs: 1_780_000_000_000,
  navAssets: 99_999_999,
  totalShares: 100_000_000_000,
  idle: 40_000_000,
  deployed: 59_999_999,
  volIndex: 650_000,
  rationale: "rolled into next expiry",
};

test("writeSnapshot posts JSON and returns blobId", async () => {
  let sentBody = "";
  globalThis.fetch = (async (_url: string, init: { body: Uint8Array }) => {
    sentBody = new TextDecoder().decode(init.body);
    return { ok: true, json: async () => ({ newlyCreated: { blobObject: { blobId: "BLOB_ABC" } } }) };
  }) as unknown as typeof fetch;

  const blobId = await writeSnapshot(sample);
  assert.equal(blobId, "BLOB_ABC");
  assert.deepEqual(JSON.parse(sentBody), sample); // exact round-trip of the payload
});

test("writeSnapshot handles alreadyCertified blobs", async () => {
  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => ({ alreadyCertified: { blobId: "BLOB_EXISTING" } }),
  })) as unknown as typeof fetch;
  assert.equal(await writeSnapshot(sample), "BLOB_EXISTING");
});

test("readSnapshot parses bytes back into a Snapshot", async () => {
  const bytes = new TextEncoder().encode(JSON.stringify(sample));
  globalThis.fetch = (async () => ({
    ok: true,
    arrayBuffer: async () => bytes.buffer,
  })) as unknown as typeof fetch;
  assert.deepEqual(await readSnapshot("BLOB_ABC"), sample);
});

test("writeSnapshot throws on HTTP error", async () => {
  globalThis.fetch = (async () => ({ ok: false, status: 500 })) as unknown as typeof fetch;
  await assert.rejects(() => writeSnapshot(sample), /walrus write failed: 500/);
});
