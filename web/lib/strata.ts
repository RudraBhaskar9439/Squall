// Squall testnet deployment (mirror of /deployments/testnet.json).
export const STRATA = {
  package: "0x6db7afe5caa78f6c1caedf6546b44af1b1bdc35f6f4f8f3062e3b675f7396d3f",
  vault: "0xbc279cb0ce8622b5e27c787961b7b39a55ebea0cf6ad993bdea6a43bc55f3d9c",
  strategy: "0x32d8d720b6d2fc49b9c068151db0c84a9bdccc2e4856e8e476c95715213d9572",
  volIndex: "0x7521737597f1697c18cd4382a5ff43d62b89cef3667d1d8d02e48cdda9d67f0c",
} as const;

export const TYPES = {
  dusdc: "0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC",
  vstrata: `${STRATA.package}::vstrata::VSTRATA`,
} as const;

export const DECIMALS = { dusdc: 6, vstrata: 9 } as const;

// On-chain virtual-share offset (vault::VaultConfig.offset_pow).
export const OFFSET_POW = 1000;

export const EXPLORER = "https://suiscan.xyz/testnet/object";
export const txUrl = (digest: string) => `https://suiscan.xyz/testnet/tx/${digest}`;

export const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";
export const walrusUrl = (blobId: string) => `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;

export type TrackEntry = {
  epoch: number;
  tsMs: number;
  navAssets: number;
  totalShares: number;
  idle: number;
  deployed: number;
  volIndex: number;
  rationale: string;
  blobId: string;
};
