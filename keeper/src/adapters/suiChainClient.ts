import type { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { STRATA, PROOF } from "@strata/sdk";
import type { ChainClient, OracleSnapshot, VaultState } from "../domain/types.ts";

export type ProofAnchor = {
  epoch: number;
  tsMs: number;
  navAssets: number;
  totalShares: number;
  blobId: string;
  prevBlob: string;
};

function pu64(f: unknown): number {
  if (f == null) return 0;
  if (typeof f === "string" || typeof f === "number") return Number(f);
  const o = f as { value?: unknown; fields?: { value?: unknown } };
  if (o.fields?.value != null) return Number(o.fields.value);
  if (o.value != null) return Number(o.value);
  return 0;
}

/** Real Sui testnet ChainClient. Reads OracleSVI state and submits vol-index
 *  updates. Oracle querying is stubbed until wired to live testnet data
 *  (Phase 3 deploy) — the push path is complete. */
export class SuiChainClient implements ChainClient {
  constructor(
    private client: SuiClient,
    private signer: Ed25519Keypair,
  ) {}

  nowMs(): number {
    return Date.now();
  }

  async listActiveOracles(): Promise<OracleSnapshot[]> {
    // TODO(phase-3 deploy): query OracleSVIUpdated events or the predict-server
    // API for active oracles, then read each OracleSVI object for
    // spot/forward/svi/expiry. Parse i64 rho/m. Returns [] until wired.
    return [];
  }

  async pushVolIndex(value: number): Promise<string> {
    const tx = new Transaction();
    tx.moveCall({
      target: `${STRATA.package}::vol_index::update`,
      arguments: [
        tx.object(STRATA.volIndex),
        tx.object(STRATA.indexPublisherCap),
        tx.pure.u64(value),
        tx.pure.u64(this.nowMs()),
      ],
    });
    const res = await this.client.signAndExecuteTransaction({
      signer: this.signer,
      transaction: tx,
    });
    return res.digest;
  }

  async readVaultState(): Promise<VaultState> {
    const obj = await this.client.getObject({ id: STRATA.vault, options: { showContent: true } });
    const content = obj.data?.content;
    const fields = (content && "fields" in content ? content.fields : {}) as Record<string, unknown>;
    const idle = pu64(fields.idle);
    const deployed = pu64(fields.deployed_value);
    // TreasuryCap is wrapped in the Vault, so read total supply from its field.
    const treasury = fields.treasury as { fields?: { total_supply?: unknown } } | undefined;
    const totalShares = pu64(treasury?.fields?.total_supply);
    return { idle, deployed, totalAssets: idle + deployed, totalShares };
  }

  async readVolIndex(): Promise<number> {
    const obj = await this.client.getObject({ id: STRATA.volIndex, options: { showContent: true } });
    const content = obj.data?.content;
    const fields = (content && "fields" in content ? content.fields : {}) as Record<string, unknown>;
    return pu64(fields.value);
  }

  /** Commit a snapshot to the on-chain ProofLog (gated by the writer cap). */
  async anchorProof(a: ProofAnchor): Promise<string> {
    if (!PROOF.package || !PROOF.log || !PROOF.writerCap) {
      throw new Error("PROOF_PACKAGE / PROOF_LOG / PROOF_WRITER_CAP not configured");
    }
    const tx = new Transaction();
    tx.moveCall({
      target: `${PROOF.package}::proof::anchor`,
      arguments: [
        tx.object(PROOF.log),
        tx.object(PROOF.writerCap),
        tx.pure.u64(a.epoch),
        tx.pure.u64(a.tsMs),
        tx.pure.u64(a.navAssets),
        tx.pure.u64(a.totalShares),
        tx.pure.string(a.blobId),
        tx.pure.string(a.prevBlob),
      ],
    });
    const res = await this.client.signAndExecuteTransaction({ signer: this.signer, transaction: tx });
    return res.digest;
  }
}
