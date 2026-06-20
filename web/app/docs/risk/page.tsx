import { DocTitle, Lead, P, Note } from "../ui";

export const metadata = { title: "Squall Docs: Risk & methodology" };

export default function Risk() {
  return (
    <article>
      <DocTitle>Risk &amp; methodology</DocTitle>
      <Lead>Squall is a risk strategy, not risk-free. Here&apos;s the honest picture.</Lead>
      <P>You can lose money: in a crash (the hedge caps but doesn&apos;t eliminate losses), when realized volatility exceeds implied, or from the hedge&apos;s cost in calm markets.</P>

      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/60">
        <li>Backtest figures use a <b className="text-white/80">seeded model with proxied implied vol</b>, illustrative of the strategy&apos;s risk behaviour, not a yield guarantee.</li>
        <li>The robust, real-data finding: across ~2.7 years of real BTC history, the vault&apos;s max drawdown was <b className="text-white/80">~20% vs ~51% for holding BTC</b>.</li>
        <li>The per-period hedge protects single-day crashes well; against slow multi-day drawdowns it adds little, and we document this openly rather than hide it.</li>
        <li>Real yield depends on actual on-chain trading volume, which only scales on mainnet.</li>
      </ul>

      <Note>
        Reproduce everything yourself: <code className="font-mono">pnpm backtest</code>,{" "}
        <code className="font-mono">pnpm backtest:historical</code>,{" "}
        <code className="font-mono">pnpm stress</code> (in <code className="font-mono">/sim</code>),
        and <code className="font-mono">pnpm healthcheck</code> at the repo root.
      </Note>
    </article>
  );
}
