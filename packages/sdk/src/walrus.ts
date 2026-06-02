// Walrus blob storage — the verifiable track-record layer.
//
// Each epoch the keeper writes a JSON Snapshot to Walrus (immutable,
// content-addressed). Anyone can re-fetch a blobId and confirm the content
// never changed — a provable performance history no off-chain dashboard can
// offer. Uses the public Walrus testnet publisher/aggregator HTTP API.

export const WALRUS = {
  publisher: "https://publisher.walrus-testnet.walrus.space",
  aggregator: "https://aggregator.walrus-testnet.walrus.space",
} as const;

/** One epoch's verifiable vault snapshot. */
export interface Snapshot {
  epoch: number;
  tsMs: number;
  navAssets: number; // total_assets, DUSDC base units
  totalShares: number; // vSTRATA base units
  idle: number; // undeployed DUSDC
  deployed: number; // value marked in the strategy (PLP)
  volIndex: number; // on-chain vol index, 1e6 scale
  rationale: string; // human-readable strategy note
}

export interface WalrusOpts {
  publisher?: string;
  aggregator?: string;
  epochs?: number; // storage duration in Walrus epochs
}

/** Write raw bytes/text to Walrus, returning the content-addressed blobId. */
export async function writeBlob(data: Uint8Array | string, opts: WalrusOpts = {}): Promise<string> {
  const publisher = opts.publisher ?? WALRUS.publisher;
  const epochs = opts.epochs ?? 5;
  const body = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const res = await fetch(`${publisher}/v1/blobs?epochs=${epochs}`, { method: "PUT", body });
  if (!res.ok) throw new Error(`walrus write failed: ${res.status}`);
  const json = (await res.json()) as {
    newlyCreated?: { blobObject?: { blobId?: string } };
    alreadyCertified?: { blobId?: string };
  };
  const blobId = json.newlyCreated?.blobObject?.blobId ?? json.alreadyCertified?.blobId;
  if (!blobId) throw new Error("walrus: no blobId in response");
  return blobId;
}

/** Read raw bytes from Walrus by blobId. */
export async function readBlob(blobId: string, opts: WalrusOpts = {}): Promise<Uint8Array> {
  const aggregator = opts.aggregator ?? WALRUS.aggregator;
  const res = await fetch(`${aggregator}/v1/blobs/${blobId}`);
  if (!res.ok) throw new Error(`walrus read failed: ${res.status}`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function writeSnapshot(s: Snapshot, opts: WalrusOpts = {}): Promise<string> {
  return writeBlob(JSON.stringify(s), opts);
}

export async function readSnapshot(blobId: string, opts: WalrusOpts = {}): Promise<Snapshot> {
  const bytes = await readBlob(blobId, opts);
  return JSON.parse(new TextDecoder().decode(bytes)) as Snapshot;
}

export function walrusBlobUrl(blobId: string, aggregator = WALRUS.aggregator): string {
  return `${aggregator}/v1/blobs/${blobId}`;
}
