import { DocTitle, Lead } from "../ui";
import type { ReactNode } from "react";

export const metadata = { title: "Squall Docs: Glossary" };

const GLOSSARY: [string, ReactNode][] = [
  ["APY", "Annual Percentage Yield: yearly return with compounding. Squall's APY figures are labelled backtested / illustrative, never guaranteed."],
  ["Backtest", "Running a strategy over historical or simulated data to see how it would have performed. Ours is reproducible: pnpm backtest:historical."],
  ["Block Scholes", "The options-pricing oracle powering DeepBook Predict's volatility surface, the source Squall derives its vol index from."],
  ["DeepBook", "Sui's native central limit order book (CLOB). DeepBook Predict is its prediction/options layer, which Squall builds on."],
  ["Drawdown", "The drop from a peak to a trough in value; 'max drawdown' is the worst such drop, a key risk measure the hedge aims to cap."],
  ["ERC-4626", "The tokenized-vault standard: deposit an asset, receive shares; share price rises as the vault earns. Squall implements its semantics in Move."],
  ["Hedge", "Insurance against the downside. Squall spends a little premium on protection that caps losses in a crash."],
  ["Implied volatility (IV)", "The market's expectation of future volatility, baked into option prices. Squall's vol index is the on-chain at-the-money implied vol."],
  ["Monte Carlo", "Running thousands of randomized scenarios to see average and tail behaviour. Squall stress-tests across 7 market regimes."],
  ["NAV", "Net Asset Value: total value held by the vault (idle funds + value deployed in the strategy)."],
  ["Oracle", "An on-chain source of external data. Predict's OracleSVI publishes BTC's volatility surface on Sui."],
  ["PLP", "Predict LP: the share token for supplying liquidity to DeepBook Predict's pool. Holding PLP = being the counterparty (the house)."],
  ["Premium", "What option buyers pay sellers. The vault, as the house, collects this premium as its core yield source."],
  ["Realized volatility", "How much the price actually moved (vs implied, what was expected). Sellers profit when implied > realized."],
  ["Sharpe ratio", "Return per unit of risk; higher is better risk-adjusted performance. The hedge raises Sharpe in most regimes."],
  ["Attestation", "One recorded moment of the vault's state (NAV, positions and rationale) written to Walrus as an immutable, content-addressed blob. A numbered entry in the provable track record."],
  ["SVI", "Stochastic Volatility Inspired: a standard model of the implied-vol 'smile'. Predict publishes SVI params; Squall turns them into the vol index."],
  ["Testnet", "A live blockchain for testing with valueless tokens (here, dUSDC). Squall is on Sui testnet; mainnet is next."],
  ["Vault", "A smart contract that pools deposits and runs a strategy. Squall's vault supplies the Predict PLP and issues vSTRATA shares."],
  ["Volatility", "How much a price swings. Squall earns by selling it and hedges against extreme spikes."],
  ["vSTRATA", "Squall's vault share token (ERC-4626 style). Deposit USDC → receive vSTRATA; burn it to withdraw your share."],
  ["Walrus", "Sui's decentralized storage network. Squall writes each snapshot to Walrus as an immutable blob: a verifiable track record."],
  ["Walrus blob", "An immutable chunk of data on Walrus, identified by a content hash (blobId). Anyone can re-fetch and confirm it never changed."],
];

export default function Glossary() {
  return (
    <article>
      <DocTitle>Glossary</DocTitle>
      <Lead>Every term, in plain language. Use ⌘F to search.</Lead>
      <dl className="mt-8 space-y-4">
        {GLOSSARY.map(([term, def]) => (
          <div key={term} className="rounded-xl border border-white/10 bg-[#0b2a40]/30 p-4">
            <dt className="font-semibold text-white">{term}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-white/60">{def}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
