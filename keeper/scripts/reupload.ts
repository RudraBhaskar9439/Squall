// Re-upload the existing track-record snapshots to Walrus with long storage,
// refreshing their blobIds (use after blobs expire).
//   run: node --experimental-transform-types scripts/reupload.ts
import { writeSnapshot } from "@strata/sdk";
import { readFileSync, writeFileSync } from "node:fs";

const MANIFEST = new URL("../../web/public/track-record.json", import.meta.url).pathname;
const m = JSON.parse(readFileSync(MANIFEST, "utf8")) as {
  entries: ({ blobId: string } & Record<string, unknown>)[];
};

for (const e of m.entries) {
  const { blobId: _old, ...snap } = e;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const id = await writeSnapshot(snap as any, { epochs: 30 });
  e.blobId = id;
  console.log(`epoch ${snap.epoch} -> ${id}`);
}

writeFileSync(MANIFEST, JSON.stringify(m, null, 2));
console.log("manifest updated");
