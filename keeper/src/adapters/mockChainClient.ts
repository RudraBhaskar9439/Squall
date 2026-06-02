import type { ChainClient, OracleSnapshot } from "../domain/types.ts";

/** In-memory ChainClient for tests and dry runs. */
export class MockChainClient implements ChainClient {
  public pushed: number[] = [];

  constructor(
    public oracles: OracleSnapshot[],
    private now = 0,
  ) {}

  nowMs(): number {
    return this.now;
  }

  setNow(ms: number): void {
    this.now = ms;
  }

  async listActiveOracles(): Promise<OracleSnapshot[]> {
    return this.oracles;
  }

  async pushVolIndex(value: number): Promise<string> {
    this.pushed.push(value);
    return `mock-digest-${this.pushed.length}`;
  }
}
