// Capture the live vault state into a verifiable Walrus snapshot and append it
// to the frontend's track-record manifest.
//   run: node --experimental-transform-types scripts/snapshot.ts "<rationale>"
import { SuiClient } from "@mysten/sui/client";
import { writeSnapshot, STRATA, type Snapshot } from "@strata/sdk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const RPC = "https://fullnode.testnet.sui.io:443";
const MANIFEST = new URL("../../web/public/track-record.json", import.meta.url).pathname;

function pu64(f: unknown): number {
  if (f == null) return 0;
  if (typeof f === "string" || typeof f === "number") return Number(f);
  const o = f as { value?: unknown; fields?: { value?: unknown } };
  if (o.fields?.value != null) return Number(o.fields.value);
  if (o.value != null) return Number(o.value);
  return 0;
}

async function fieldsOf(client: SuiClient, id: string): Promise<Record<string, unknown>> {
  const obj = await client.getObject({ id, options: { showContent: true } });
  const c = obj.data?.content;
  return (c && "fields" in c ? c.fields : {}) as Record<string, unknown>;
}

async function main() {
  const rationale = process.argv[2] ?? "";
  const client = new SuiClient({ url: RPC });

  const vf = await fieldsOf(client, STRATA.vault);
  const idle = pu64(vf.idle);
  const deployed = pu64(vf.deployed_value);
  // TreasuryCap is wrapped in the Vault, so read total supply from its field.
  const treasury = vf.treasury as { fields?: { total_supply?: unknown } } | undefined;
  const totalShares = pu64(treasury?.fields?.total_supply);
  const volIndex = pu64((await fieldsOf(client, STRATA.volIndex)).value);

  const manifest: { entries: (Snapshot & { blobId: string })[] } = existsSync(MANIFEST)
    ? JSON.parse(readFileSync(MANIFEST, "utf8"))
    : { entries: [] };

  const snapshot: Snapshot = {
    epoch: manifest.entries.length,
    tsMs: Date.now(),
    navAssets: idle + deployed,
    totalShares,
    idle,
    deployed,
    volIndex,
    rationale,
  };

  const blobId = await writeSnapshot(snapshot);
  manifest.entries.push({ ...snapshot, blobId });
  mkdirSync(dirname(MANIFEST), { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`epoch ${snapshot.epoch} | nav ${snapshot.navAssets} | blobId ${blobId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
