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

// Strata package + objects — filled in after `sui client publish` to testnet.
export const STRATA = {
  package: process.env.STRATA_PACKAGE ?? "0x0",
  vault: process.env.STRATA_VAULT ?? "0x0",
  strategy: process.env.STRATA_STRATEGY ?? "0x0",
  volIndex: process.env.STRATA_VOL_INDEX ?? "0x0",
  adminCap: process.env.STRATA_ADMIN_CAP ?? "0x0",
  indexPublisherCap: process.env.STRATA_INDEX_CAP ?? "0x0",
} as const;
