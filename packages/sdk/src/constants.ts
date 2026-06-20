// DeepBook Predict testnet identifiers (from docs.sui.io contract-information,
// pinned to branch predict-testnet-4-16). These change at mainnet launch.
export const TESTNET = {
  predictPackage: "0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138",
  predictRegistry: "0x43af14fed5480c20ff77e2263d5f794c35b9fab7e2212903127062f4fe2a6e64",
  predictObject: "0xc8736204d12f0a7277c86388a68bf8a194b0a14c5538ad13f22cbd8e2a38028a",
  dusdcType: "0xe95040085976bfd54a1a07225cd46c8a2b4e8e2b6732f140a0fc49850ba73e1a::dusdc::DUSDC",
  dusdcCurrency: "0xf3000dff421833d4bb8ed58fac146d691a3aaba2785aa1989af65a7089ca3e9c",
  plpType: "0xf5ea2b3749c65d6e56507cc35388719aadb28f9cab873696a2f8687f5c785138::plp::PLP",
  serverUrl: "https://predict-server.testnet.mystenlabs.com",
  rpcUrl: "https://fullnode.testnet.sui.io:443",
  sourceBranch: "predict-testnet-4-16",
} as const;

// Squall testnet deployment (see deployments/testnet.json). Override via env.
export const STRATA = {
  package: process.env.STRATA_PACKAGE ?? "0x6db7afe5caa78f6c1caedf6546b44af1b1bdc35f6f4f8f3062e3b675f7396d3f",
  vault: process.env.STRATA_VAULT ?? "0xbc279cb0ce8622b5e27c787961b7b39a55ebea0cf6ad993bdea6a43bc55f3d9c",
  strategy: process.env.STRATA_STRATEGY ?? "0x32d8d720b6d2fc49b9c068151db0c84a9bdccc2e4856e8e476c95715213d9572",
  volIndex: process.env.STRATA_VOL_INDEX ?? "0x7521737597f1697c18cd4382a5ff43d62b89cef3667d1d8d02e48cdda9d67f0c",
  adminCap: process.env.STRATA_ADMIN_CAP ?? "0x17652a0aa1e0b7aac15053eb8af4c878691be405f0769255a5176787781b0e9e",
  indexPublisherCap: process.env.STRATA_INDEX_CAP ?? "0x2b9523fefd8bfeeff0f94b87d31112faaad07c7764ec0bba2606b0f73e235876",
} as const;

// On-chain proof anchor (deploy move/proof, then set these). Empty = disabled.
export const PROOF = {
  package: process.env.PROOF_PACKAGE ?? "",
  log: process.env.PROOF_LOG ?? "",
  writerCap: process.env.PROOF_WRITER_CAP ?? "",
} as const;
