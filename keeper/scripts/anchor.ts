import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { readFileSync } from "node:fs";
import { SuiChainClient } from "../src/adapters/suiChainClient.ts";
import { consoleLogger } from "../src/core/logger.ts";

// Anchor the committed track-record snapshots on-chain — one ProofLog entry per
// snapshot, hash-chained via prevBlob. Run once after deploying move/proof to
// seed the on-chain log; the keeper can call chain.anchorProof(...) per epoch.
//
// Requires env:
//   KEEPER_SECRET_KEY   — holds the ProofWriterCap
//   PROOF_PACKAGE / PROOF_LOG / PROOF_WRITER_CAP
// Optional: TRACK_RECORD (path to track-record.json; defaults to the web app's).

type Entry = {
  epoch: number;
  tsMs: number;
  navAssets: number;
  totalShares: number;
  blobId: string;
  prevBlob?: string;
};

async function main(): Promise<void> {
  const secret = process.env.KEEPER_SECRET_KEY;
  if (!secret) throw new Error("KEEPER_SECRET_KEY not set");

  const path = process.env.TRACK_RECORD ?? "../web/public/track-record.json";
  const data = JSON.parse(readFileSync(path, "utf8")) as { entries: Entry[] };
  const entries = (data.entries ?? []).slice().sort((a, b) => a.tsMs - b.tsMs);

  const client = new SuiClient({ url: getFullnodeUrl("testnet") });
  const signer = Ed25519Keypair.fromSecretKey(secret);
  const chain = new SuiChainClient(client, signer);

  let prevBlob = "";
  for (const e of entries) {
    const digest = await chain.anchorProof({
      epoch: e.epoch,
      tsMs: e.tsMs,
      navAssets: e.navAssets,
      totalShares: e.totalShares,
      blobId: e.blobId,
      prevBlob: e.prevBlob ?? prevBlob,
    });
    consoleLogger.info("anchored", { epoch: e.epoch, blobId: e.blobId, digest });
    prevBlob = e.blobId;
  }
  consoleLogger.info("done", { count: entries.length });
}

main().catch((e) => {
  consoleLogger.error("anchor failed", { e: String(e) });
  process.exit(1);
});
