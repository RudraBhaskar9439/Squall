# Strata

**The Ribbon Finance of Sui** — tokenized ERC-4626 structured-yield vaults on
DeepBook Predict, powered by the first on-chain volatility index on Sui, with a
verifiable performance track record on Walrus.

- **Primary track:** DeepBook Predict (Sui Overflow 2026)
- **Bounty hedge:** Walrus (verifiable data / agent memory)

---

## Monorepo layout

```
strata/
├── move/strata/          # Sui Move package (on-chain protocol)
│   ├── sources/
│   │   ├── math.move       # reusable fixed-point + ERC-4626 conversion math
│   │   ├── access.move     # Admin / Keeper / Strategy capabilities
│   │   ├── vstrata.move    # vSTRATA share token (one-time witness + treasury)
│   │   ├── vault.move      # generic ERC-4626 vault core (strategy-agnostic)
│   │   └── vol_index.move  # on-chain volatility index (EMA-smoothed)
│   └── tests/              # Move unit tests
├── packages/sdk/         # shared @strata/sdk (typed on-chain client) — TODO
├── keeper/               # crash-safe off-chain automation (roll/index/walrus) — TODO
├── web/                  # Next.js frontend (zkLogin + dapp-kit) — TODO
└── sim/                  # strategy backtest / simulation — TODO
```

The Move design keeps the **vault core generic** (`Vault<A, S>`) so it works with
any asset/strategy; the Predict-specific logic plugs in via a capability-bound
strategy module (next phase).

---

## Build status

| Module | Status | Tests |
|---|---|---|
| `math` (ERC-4626 math + inflation guard) | ✅ done | covered via vault |
| `access` (capabilities, vault-bound) | ✅ done | ✅ |
| `vstrata` (share token) | ✅ done | — |
| `vault` (ERC-4626 core + strategy hooks) | ✅ done | ✅ 4 tests |
| `vol_index` (on-chain vol index) | ✅ done | ✅ 2 tests |
| `predict_strategy` (DeepBook Predict integration) | ⏳ next | — |
| `fees` (mgmt/perf fee, high-water mark) | ⏳ todo | — |
| `@strata/sdk` | ⏳ todo | — |
| keeper services | ⏳ todo | — |
| web frontend | ⏳ todo | — |
| simulation | ⏳ todo | — |

Run the on-chain tests:

```bash
cd move/strata
sui move test
```

---

## Build roadmap (phases)

- **Phase 0 — Foundation & validation spike.** Toolchain, repo, dUSDC faucet,
  read Predict codebase (`predict-testnet-4-16`), prove the 4 load-bearing calls
  (supply/redeem, read OracleSVI, read NAV mark, write Walrus). *Gate: NAV read.*
- **Phase 1 — ERC-4626 vault core.** ✅ **Done** (math, access, vstrata, vault, vol_index, tests).
- **Phase 2 — Keeper & auto-roll.** Event-driven roll loop, idempotent + resumable.
- **Phase 3 — Vol index wiring.** Keeper derives ATM IV from OracleSVI → `vol_index::update`.
- **Phase 4 — Frontend.** zkLogin onboarding, deposit/withdraw, NAV/APY, vol gauge.
- **Phase 5 — Walrus track record.** Per-epoch snapshots (MemWal + raw-blob fallback).
- **Phase 6 — Simulation.** Backtest premium-harvest + hedge; drawdown comparison.
- **Phase 7 — Stretch, polish, submission.** Hedge overlay, demo video, deck.

---

## Key design decisions

- **ERC-4626 semantics in Move** — full `deposit/redeem/mint/withdraw` previews +
  `convertTo*` + `totalAssets`; rounding always favors the vault.
- **Inflation-attack protection** — virtual-offset conversion (`offset_pow`
  virtual shares + 1 virtual asset), mirroring OpenZeppelin's mitigation.
- **NAV model** — cached `deployed_value`, refreshed on `report` (harvest), so
  NAV reads stay O(1) and gas-cheap.
- **Capability security** — every privileged action is gated by a cap bound to a
  specific `vault_id`; a cap for vault A can't touch vault B.
