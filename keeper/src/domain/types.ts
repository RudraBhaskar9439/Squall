// Core domain interfaces. Services depend on these, not on concrete clients,
// so the keeper logic is testable with a mock and swappable to real Sui RPC.

/** A snapshot of one OracleSVI, with raw 1e9-scaled SVI params. */
export interface OracleSnapshot {
  oracleId: string;
  expiryMs: number;
  spot: number;
  forward: number;
  svi: { a: bigint; b: bigint; rho: bigint; m: bigint; sigma: bigint };
}

/** Everything the keeper needs from the chain, behind one seam. */
export interface ChainClient {
  nowMs(): number;
  listActiveOracles(): Promise<OracleSnapshot[]>;
  pushVolIndex(value: number): Promise<string>; // returns tx digest
}

export interface Logger {
  info(msg: string, meta?: unknown): void;
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
}
