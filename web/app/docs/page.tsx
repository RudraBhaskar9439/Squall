import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { STRATA } from "@/lib/strata";

export const metadata = {
  title: "Squall — Docs",
  description: "How Squall works — concepts, developer guide, and a full glossary.",
};

const NAV = [
  ["intro", "Introduction"],
  ["how", "How it works"],
  ["concepts", "Core concepts"],
  ["devs", "For developers"],
  ["risk", "Risk & methodology"],
  ["glossary", "Glossary"],
];

const GLOSSARY: [string, React.ReactNode][] = [
  ["APY", "Annual Percentage Yield — the yearly return, compounding included. We label Squall's APY figures 'backtested / illustrative,' never guaranteed."],
  ["Backtest", "Running a strategy over historical or simulated data to see how it would have performed. Ours is reproducible: run pnpm backtest:historical."],
  ["Block Scholes", "The options-pricing oracle that powers DeepBook Predict's volatility surface — the source Squall derives its vol index from."],
  ["DeepBook", "Sui's native central limit order book (CLOB). DeepBook Predict is its prediction/options layer that Squall builds on."],
  ["Drawdown", "The drop from a peak to a trough in value. 'Max drawdown' is the worst such drop — a key risk measure. Squall's hedge aims to cap it."],
  ["ERC-4626", "The tokenized-vault standard: deposit an asset, receive shares that represent your slice; the share price rises as the vault earns. Squall implements its semantics in Move."],
  ["Hedge", "Insurance against the downside. Squall spends a little of the premium on protection that caps losses in a crash."],
  ["Implied volatility (IV)", "The market's expectation of future volatility, baked into option prices. Squall's vol index is the on-chain ATM implied vol."],
  ["Monte Carlo", "Running thousands of randomized scenarios to see how a strategy behaves on average and in the tails. Squall stress-tests across 7 market regimes."],
  ["NAV", "Net Asset Value — the total value held by the vault (idle funds + value deployed in the strategy)."],
  ["Oracle", "An on-chain source of external data (e.g., prices, volatility). Predict's OracleSVI publishes BTC's volatility surface on Sui."],
  ["PLP", "Predict LP — the share token you get for supplying liquidity to DeepBook Predict's pool. Holding PLP = being the counterparty (“the house”) to traders."],
  ["Premium", "What option buyers pay sellers. The vault, as the seller/house, collects this premium as its core yield source."],
  ["Realized volatility", "How much the price actually moved (vs. implied, which is what the market expected). Sellers profit when implied > realized."],
  ["Sharpe ratio", "Return per unit of risk. Higher is better risk-adjusted performance. The hedge raises Sharpe in most regimes."],
  ["Snapshot (epoch)", "One recorded moment of the vault's state (NAV, positions, vol) written to Walrus. The label 'epoch' here = a snapshot sequence number, not a Sui/Walrus epoch."],
  ["SVI", "Stochastic Volatility Inspired — a standard math model of the implied-volatility 'smile.' Predict publishes SVI params; Squall turns them into the vol index."],
  ["Testnet", "A live blockchain for testing with valueless tokens (here, dUSDC). Squall is deployed on Sui testnet; mainnet is next."],
  ["Vault", "A smart contract that pools deposits and runs a strategy on them. Squall's vault supplies the Predict PLP and issues vSTRATA shares."],
  ["Volatility", "How much a price swings. High volatility = bigger moves. Squall earns by selling it and hedges against extreme spikes."],
  ["vSTRATA", "Squall's vault share token (ERC-4626 style). Deposit USDC → receive vSTRATA; burn it to withdraw your share of the vault."],
  ["Walrus", "Sui's decentralized storage network. Squall writes each snapshot to Walrus as an immutable, content-addressed blob — a verifiable track record."],
  ["Walrus blob", "An immutable chunk of data on Walrus, identified by a content hash (blobId). Anyone can re-fetch it and confirm it never changed."],
];

export default function DocsPage() {
  return (
    <main className="relative">
      <Nav />
      <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-28 sm:px-8 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[210px_1fr]">
          {/* sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1 text-sm">
              <div className="mb-3 text-xs font-medium uppercase tracking-wide text-white/35">Docs</div>
              {NAV.map(([id, label]) => (
                <a key={id} href={`#${id}`} className="block rounded-lg px-3 py-1.5 text-white/55 transition hover:bg-white/5 hover:text-white">
                  {label}
                </a>
              ))}
            </nav>
          </aside>

          {/* content */}
          <article className="max-w-3xl space-y-16 leading-relaxed text-white/70">
            <Section id="intro" title="Introduction">
              <p>
                <b className="text-white">Squall</b> is a structured-yield protocol on Sui — the
                Ribbon Finance of Sui. You deposit USDC and the vault becomes{" "}
                <b className="text-white">&ldquo;the house&rdquo;</b> on DeepBook Predict: it supplies
                the liquidity pool and earns a share of trading fees, with a hedge that caps the worst
                days. You withdraw anytime.
              </p>
              <p className="mt-4">
                Two things on Sui didn&apos;t exist before Squall: <b className="text-white">DeFi
                option vaults</b> and an <b className="text-white">on-chain volatility index</b>.
                Squall ships both, and writes a <b className="text-white">verifiable track record to
                Walrus</b>. It&apos;s live on Sui testnet.
              </p>
            </Section>

            <Section id="how" title="How it works">
              <p>The simplest framing: a casino earns from the players. Here, <b className="text-white">you become the house.</b></p>
              <ol className="mt-4 space-y-3">
                <Step n="1" t="Deposit USDC">You receive <b className="text-white">vSTRATA</b>, a share token representing your slice of the vault.</Step>
                <Step n="2" t="The vault earns">It supplies DeepBook Predict&apos;s PLP pool — the counterparty to traders — collecting the option-seller premium.</Step>
                <Step n="3" t="Hedge & roll">A keeper marks the vault&apos;s value from the live vol surface, auto-rolls each expiry, and a hedge caps single-day crash losses.</Step>
                <Step n="4" t="Withdraw anytime">Burn vSTRATA to cash out your share of the vault&apos;s current value.</Step>
              </ol>
              <p className="mt-4 text-sm text-white/45">
                The options/volatility machinery stays under the hood — to you it&apos;s just deposit
                → earn → withdraw.
              </p>
            </Section>

            <Section id="concepts" title="Core concepts">
              <Concept t="Being “the house”">
                Every trade needs a counterparty. On DeepBook Predict, the <b className="text-white">PLP
                pool</b> takes the other side of all trades and earns the premium traders pay — like
                a casino earning the house edge. Squall&apos;s vault supplies that pool, so depositors
                collectively <b className="text-white">are the house.</b>
              </Concept>
              <Concept t="The on-chain volatility index">
                Predict&apos;s <b className="text-white">OracleSVI</b> publishes BTC&apos;s
                implied-volatility surface (priced by Block Scholes) on-chain. Squall reads it,
                computes the annualized at-the-money implied vol, and publishes it as a shared
                on-chain <b className="text-white">VolIndex</b> object — the first vol benchmark on
                Sui, readable by any protocol.
              </Concept>
              <Concept t="The vault & vSTRATA (ERC-4626)">
                Squall implements ERC-4626 vault semantics in Move: deposit USDC, receive vSTRATA
                shares; the share price reflects the vault&apos;s value, so it rises as the vault
                earns. Shares are composable — usable elsewhere in Sui DeFi.
              </Concept>
              <Concept t="The hedge">
                A naked vol seller can be wiped out by one big move. Squall spends a small slice of
                the premium on protection that caps the per-period loss — trading a little yield for
                a much smaller drawdown. (It protects single-day crashes best; see Risk.)
              </Concept>
              <Concept t="Verifiable track record (Walrus)">
                Most funds ask you to <i>trust</i> their numbers. Squall writes each snapshot — NAV,
                positions, rationale — to <b className="text-white">Walrus</b> as an immutable blob.
                Anyone can re-fetch it and confirm it never changed. Proof, not promises.
              </Concept>
            </Section>

            <Section id="devs" title="For developers">
              <p>Squall is live on Sui testnet. Deployed objects:</p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
{`package    ${STRATA.package}
vault      ${STRATA.vault}
volIndex   ${STRATA.volIndex}
strategy   ${STRATA.strategy}`}
              </pre>
              <p className="mt-6">Read the on-chain vol index from any app:</p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
{`import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });
const obj = await client.getObject({
  id: "${STRATA.volIndex}",
  options: { showContent: true },
});
const vol = Number(obj.data.content.fields.value) / 1e6; // e.g. 0.65 = 65%`}
              </pre>
              <p className="mt-6">Run the analysis yourself (all reproducible):</p>
              <pre className="mt-3 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
{`pnpm healthcheck            # live on-chain + Walrus + tests
cd sim && pnpm backtest             # synthetic Monte Carlo
cd sim && pnpm backtest:historical  # real BTC empirical backtest
cd sim && pnpm stress               # robustness across 7 regimes`}
              </pre>
            </Section>

            <Section id="risk" title="Risk & methodology">
              <p>
                Squall is a <b className="text-white">risk strategy, not risk-free.</b> You can lose:
                in a crash (the hedge caps but doesn&apos;t eliminate losses), when realized vol
                exceeds implied, or from the hedge&apos;s cost in calm markets.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-white/55">
                <li>Backtest figures use a <b className="text-white/80">seeded model / proxied implied vol</b> — illustrative of the strategy&apos;s risk behaviour, not a yield guarantee.</li>
                <li>The robust, real-data finding: on ~2.7 years of real BTC, the vault&apos;s max drawdown was <b className="text-white/80">~20% vs 51% for holding BTC.</b></li>
                <li>The per-period hedge protects single-day crashes well; against slow multi-day drawdowns it adds little — we document this openly.</li>
                <li>Real yield depends on actual on-chain trading volume, which scales on mainnet.</li>
              </ul>
            </Section>

            <Section id="glossary" title="Glossary">
              <p className="mb-6 text-sm text-white/45">Every term, in plain language. Use ⌘F to search.</p>
              <dl className="space-y-4">
                {GLOSSARY.map(([term, def]) => (
                  <div key={term} className="rounded-xl border border-white/10 bg-[#0b2a40]/30 p-4">
                    <dt className="font-semibold text-white">{term}</dt>
                    <dd className="mt-1 text-sm text-white/60">{def}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          </article>
        </div>
      </div>
      <Footer />
    </main>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight text-gradient sm:text-3xl">{title}</h2>
      {children}
    </section>
  );
}

function Step({ n, t, children }: { n: string; t: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 rounded-xl border border-white/10 bg-[#0b2a40]/30 p-4">
      <span className="font-mono text-sm text-sui">{n}</span>
      <span><b className="text-white">{t}</b> — <span className="text-white/60">{children}</span></span>
    </li>
  );
}

function Concept({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 first:mt-0">
      <h3 className="text-lg font-semibold text-white">{t}</h3>
      <p className="mt-1.5 text-white/65">{children}</p>
    </div>
  );
}
