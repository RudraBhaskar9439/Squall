import { atmIndexFromOracle } from "@strata/sdk";
import type { ChainClient, Logger } from "../domain/types.ts";

export interface VolIndexUpdaterOpts {
  /** Skip pushes whose index value moved less than this (1e6 scale). */
  minChange: number;
}

/** Reads the front (nearest-expiry) oracle, computes the ATM vol index, and
 *  pushes it on-chain — debounced so tiny moves don't spam transactions. */
export class VolIndexUpdater {
  private last: number | undefined;

  constructor(
    private chain: ChainClient,
    private log: Logger,
    private opts: VolIndexUpdaterOpts = { minChange: 500 },
  ) {}

  async tick(): Promise<{ pushed: boolean; value?: number; digest?: string }> {
    const oracles = await this.chain.listActiveOracles();
    if (oracles.length === 0) {
      this.log.warn("vol-index: no active oracles");
      return { pushed: false };
    }

    const front = [...oracles].sort((a, b) => a.expiryMs - b.expiryMs)[0];
    const value = atmIndexFromOracle({
      a: front.svi.a,
      b: front.svi.b,
      rho: front.svi.rho,
      m: front.svi.m,
      sigma: front.svi.sigma,
      nowMs: this.chain.nowMs(),
      expiryMs: front.expiryMs,
    });

    if (this.last !== undefined && Math.abs(value - this.last) < this.opts.minChange) {
      return { pushed: false, value };
    }

    const digest = await this.chain.pushVolIndex(value);
    this.last = value;
    this.log.info("vol-index pushed", { value, digest });
    return { pushed: true, value, digest };
  }
}
