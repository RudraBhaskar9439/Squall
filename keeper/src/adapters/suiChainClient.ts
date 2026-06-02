import type { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import type { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { STRATA } from "@strata/sdk";
import type { ChainClient, OracleSnapshot } from "../domain/types.ts";

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
}
