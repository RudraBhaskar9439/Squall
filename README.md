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
│   │   ├── fees.move           # management + performance fees (high-water mark)
│   │   ├── vol_index.move      # on-chain volatility index (EMA-smoothed)
│   │   └── predict_strategy.move # DeepBook Predict PLP premium-harvest strategy
│   └── tests/              # Move unit tests (+ mock_strategy harness)
├── packages/sdk/         # @strata/sdk: SVI vol math + testnet constants ✅
├── keeper/               # off-chain automation (vol-index updater, mock+sui clients) ✅ skeleton
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
| `vault` (ERC-4626 core + strategy hooks + fee accrual) | ✅ done | ✅ |
| `vol_index` (on-chain vol index) | ✅ done | ✅ 2 tests |
| `fees` (mgmt/perf fee, high-water mark) | ✅ done | ✅ 4 tests |
| `mock_strategy` (test harness) + integration cycle | ✅ done | ✅ 1 test |
| `predict_strategy` (DeepBook Predict integration) | ✅ code done, typechecks vs real Predict API | deploy pending |
| `@strata/sdk` (SVI vol math + constants) | ✅ done | ✅ 8 tests |
| `keeper` (vol-index updater + clients) | ✅ skeleton | ✅ 4 tests |

Run the off-chain tests:

```bash
pnpm install
pnpm -r test   # 8 SDK + 4 keeper
```
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
- **Phase 2 — Fees + integration tests.** ✅ **Done** (fees with HWM, mock strategy, full deposit→harvest→fee cycle).
- **Phase 3 — DeepBook Predict integration.** 🔨 In progress — `predict_strategy`
  written and typechecking against the real Predict package (`supply`/`withdraw`
  on testnet pkg `0xf5ea2b37…5138`). **Remaining to deploy:** (1) dUSDC from the
  faucet, (2) the real testnet package IDs for `deepbook` + `token` (placeholders
  in the cloned manifests for now — ask the DeepBook Telegram), (3) publish + run
  one live deposit→supply→harvest→withdraw cycle.
- **Phase 4 — Keeper & auto-roll.** Event-driven roll loop, idempotent + resumable.

### Local build setup

The Move package depends on the DeepBook Predict source. Clone it next to `move/`:

```bash
git clone --branch predict-testnet-4-16 --depth 1 \
  https://github.com/MystenLabs/deepbookv3.git deepbook-ref
# set distinct addresses in deepbook-ref/packages/{predict,deepbook,token}/Move.toml
# (predict = 0xf5ea2b37…5138; deepbook/token = placeholders until real IDs known)
```

Requires **Sui CLI ≥ 1.73** (matches testnet; older versions lack `coin_registry`).
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
