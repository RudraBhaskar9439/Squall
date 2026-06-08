import { DocTitle, Lead, Concept } from "../ui";

export const metadata = { title: "Squall Docs — Core concepts" };

export default function Concepts() {
  return (
    <article>
      <DocTitle>Core concepts</DocTitle>
      <Lead>The five ideas that make Squall work — explained simply.</Lead>

      <Concept t="Being “the house”">
        Every trade needs a counterparty. On DeepBook Predict, the PLP pool takes the other side of
        all trades and earns the premium traders pay — like a casino earning the house edge.
        Squall&apos;s vault supplies that pool, so depositors collectively <b className="text-white">are
        the house.</b>
      </Concept>

      <Concept t="The on-chain volatility index">
        Predict&apos;s OracleSVI publishes BTC&apos;s implied-volatility surface (priced by Block
        Scholes) on-chain. Squall reads it, computes the annualized at-the-money implied vol, and
        publishes it as a shared on-chain <b className="text-white">VolIndex</b> object — the first vol
        benchmark on Sui, readable by any protocol.
      </Concept>

      <Concept t="The vault & vSTRATA (ERC-4626)">
        Squall implements ERC-4626 vault semantics in Move: deposit USDC, receive vSTRATA shares; the
        share price reflects the vault&apos;s value, so it rises as the vault earns. Shares are
        composable — usable elsewhere in Sui DeFi.
      </Concept>

      <Concept t="The hedge">
        A naked volatility seller can be wiped out by one big move. Squall spends a small slice of the
        premium on protection that caps the per-period loss — trading a little yield for a much
        smaller drawdown. (It protects single-day crashes best; see Risk &amp; methodology.)
      </Concept>

      <Concept t="Verifiable track record (Walrus)">
        Most funds ask you to <i>trust</i> their numbers. Squall writes each snapshot — NAV, positions,
        rationale — to Walrus as an immutable, content-addressed blob. Anyone can re-fetch it and
        confirm it never changed. Proof, not promises.
      </Concept>
    </article>
  );
}
