import { writeSnapshot, type Snapshot } from "@strata/sdk";
import type { ChainClient, Logger } from "../domain/types.ts";

/** Builds a verifiable vault snapshot from chain state and writes it to Walrus.
 *  The Walrus writer is injectable so it can be tested without the network. */
export class Snapshotter {
  private epoch: number;

  constructor(
    private chain: ChainClient,
    private log: Logger,
    private write: (s: Snapshot) => Promise<string> = writeSnapshot,
    startEpoch = 0,
  ) {
    this.epoch = startEpoch;
  }

  async capture(rationale = ""): Promise<{ blobId: string; snapshot: Snapshot }> {
    const v = await this.chain.readVaultState();
    const volIndex = await this.chain.readVolIndex();
    const snapshot: Snapshot = {
      epoch: this.epoch++,
      tsMs: this.chain.nowMs(),
      navAssets: v.totalAssets,
      totalShares: v.totalShares,
      idle: v.idle,
      deployed: v.deployed,
      volIndex,
      rationale,
    };
    const blobId = await this.write(snapshot);
    this.log.info("snapshot written to walrus", { blobId, epoch: snapshot.epoch });
    return { blobId, snapshot };
  }
}
