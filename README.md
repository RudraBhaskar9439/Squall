# Squall

**The Ribbon Finance of Sui** — tokenized ERC-4626 structured-yield vaults on
DeepBook Predict, powered by the first on-chain volatility index on Sui, with a
verifiable performance track record on Walrus.

- **Primary track:** DeepBook Predict (Sui Overflow 2026)
- **Bounty hedge:** Walrus (verifiable data / agent memory)

## 🟢 Live on Sui testnet

Full cycle verified end-to-end against **real DeepBook Predict**
(see [`deployments/testnet.json`](deployments/testnet.json)):

| Object | ID |
|---|---|
| Package | `0x6db7afe5…6d3f` |
| Vault (DUSDC/vSTRATA) | `0xbc279cb0…3d9c` |
| PredictStrategy | `0x32d8d720…9572` |
| VolIndex | `0x75217375…7f0c` |

Proven on-chain: `deposit 100 DUSDC → 100B vSTRATA` → `allocate 60 DUSDC into
Predict PLP` → `divest → 60 DUSDC back + NAV report` → `redeem → DUSDC out`,
plus a live `vol_index` update (65%) and **3 verifiable NAV snapshots stored on
Walrus** (the in-app Proof tab re-fetches and verifies them).

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
├── web/                  # Next.js frontend (landing + dashboard + proof + backtest) ✅
└── sim/                  # strategy backtest (naive vs hedged + Monte Carlo) ✅
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
| `predict_strategy` (DeepBook Predict integration) | ✅ **deployed to testnet, full cycle verified** | ✅ live |
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

## Risk, backtesting & robustness

> **Methodology (read this).** The figures below come from a **seeded Monte Carlo
> simulation of the strategy logic** (`sim/`), not an empirical historical
> backtest. Premiums scale with implied vol, realized moves are drawn from a
> normal distribution plus an injected crash, and the hedge is modelled as a
> per-epoch loss floor. It demonstrates the strategy's **risk behaviour** (the
> hedge reduces drawdown) — it is **illustrative, reproducible, and NOT a
> yield guarantee or a real track record.** Real returns depend on actual
> Predict trading volume and the implied-vs-realized vol spread, which only
> emerge on mainnet.

Run it yourself:

```bash
cd sim
pnpm backtest    # 1-year path + 1000-scenario Monte Carlo
pnpm stress      # robustness sweep — 7 regimes × 2000 runs
```

**Backtest (1y, 1000 Monte Carlo runs):** the hedge gives up a little APY to cut
the tail — naive PLP ~18.7% APY / 19.1% max drawdown vs. hedged ~17.7% APY /
**16.5% max drawdown**, higher Sharpe.

**Robustness sweep — max drawdown, naive → hedged (2000 runs each):**

| Regime | naive DD | hedged DD | Sharpe (naive → hedged) |
|---|---|---|---|
| Calm (IV 35%) | 15.8% | **11.8%** | 0.30 → 0.43 |
| Normal (IV 65%) | 18.9% | **16.3%** | 0.86 → 0.88 |
| High vol (IV 110%) | 25.7% | **19.2%** | 1.21 → 1.57 |
| Thin edge (realized 95%) | 23.6% | **20.7%** | 0.17 → 0.18 |
| Fat edge (realized 80%) | 15.0% | **12.4%** | 1.76 → 1.80 |
| Conservative (40% deployed) | 12.9% | **11.7%** | 0.86 → 0.69 |
| Aggressive (80% deployed) | 24.7% | **20.8%** | 0.86 → 0.97 |

The hedge **lowered drawdown in 7/7 regimes** and **improved Sharpe in 6/7** —
the lone exception (low deployment) is the expected insurance-cost tradeoff when
there's little tail risk to insure. Sound across regimes, and not curve-fit.

### Empirical backtest on real BTC history

Run on **real BTC daily closes** (≈2.7 years, including BTC's actual 51%
drawdown). Reproducible — the dataset is committed:

```bash
cd sim && pnpm backtest:historical
```

| Strategy (real BTC path) | Return (CAGR) | Max drawdown | Sharpe |
|---|---|---|---|
| Vol-selling vault (PLP) | ~50% | **20.3%** | 2.10 |
| Squall (hedged) | ~31% | 20.3% | 1.43 |
| **Hold BTC (benchmark)** | ~38% | **51.2%** | — |

**The defensible, model-robust finding: being the house cut max drawdown to
~20% vs BTC's 51%** — a far smoother ride than holding the underlying, while
staying positive. (Drawdown *shape* is robust to assumptions; absolute return
is not — see caveats.)

**Honest methodology + caveats:**
- Real price path → every realized move and drawdown is real. **Implied vol is
  proxied** (trailing realized × ~1.05 vol-risk premium) since free historical
  BTC IV isn't available — so absolute returns are assumption-sensitive and the
  window is a BTC bull market; treat CAGR as illustrative, not a forecast.
- It ignores fees/slippage and assumes Predict-like fills; **real yield depends
  on actual on-chain volume**, which only exists at scale on mainnet.
- The **per-epoch hedge protects single-day crashes** (see the Monte Carlo
  above) but adds little against *slow multi-day* drawdowns — hence hedged ≈
  naive drawdown here. A cumulative-drawdown hedge is future work. We report
  this openly rather than hide it.
- **Not a yield guarantee. You can lose.**

## Key design decisions

- **ERC-4626 semantics in Move** — full `deposit/redeem/mint/withdraw` previews +
  `convertTo*` + `totalAssets`; rounding always favors the vault.
- **Inflation-attack protection** — virtual-offset conversion (`offset_pow`
  virtual shares + 1 virtual asset), mirroring OpenZeppelin's mitigation.
- **NAV model** — cached `deployed_value`, refreshed on `report` (harvest), so
  NAV reads stay O(1) and gas-cheap.
- **Capability security** — every privileged action is gated by a cap bound to a
  specific `vault_id`; a cap for vault A can't touch vault B.
