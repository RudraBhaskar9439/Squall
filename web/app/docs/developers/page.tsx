import { DocTitle, Lead, H2, P, Code } from "../ui";
import { STRATA } from "@/lib/strata";

export const metadata = { title: "Squall Docs: For developers" };

export default function Developers() {
  return (
    <article>
      <DocTitle>For developers</DocTitle>
      <Lead>Squall is live on Sui testnet, and its vol index is a public primitive any protocol can read.</Lead>

      <H2>Deployed objects (testnet)</H2>
      <Code>{`package    ${STRATA.package}
vault      ${STRATA.vault}
volIndex   ${STRATA.volIndex}
strategy   ${STRATA.strategy}`}</Code>

      <H2>Read the on-chain vol index</H2>
      <P>Any app can read Squall&apos;s volatility benchmark in a few lines:</P>
      <Code>{`import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const client = new SuiClient({ url: getFullnodeUrl("testnet") });
const obj = await client.getObject({
  id: "${STRATA.volIndex}",
  options: { showContent: true },
});
const vol = Number(obj.data.content.fields.value) / 1e6; // e.g. 0.65 = 65%`}</Code>

      <H2>Run the analysis (all reproducible)</H2>
      <Code>{`pnpm healthcheck                    # live on-chain + Walrus + tests
cd sim && pnpm backtest             # synthetic Monte Carlo
cd sim && pnpm backtest:historical  # real BTC empirical backtest
cd sim && pnpm stress               # robustness across 7 regimes`}</Code>

      <P>
        The repo is a pnpm monorepo: <code className="font-mono text-white/80">move/strata</code>{" "}
        (contracts), <code className="font-mono text-white/80">packages/sdk</code> (vol math + Walrus
        client), <code className="font-mono text-white/80">keeper</code> (automation),{" "}
        <code className="font-mono text-white/80">sim</code> (backtests), and{" "}
        <code className="font-mono text-white/80">web</code> (this app).
      </P>
    </article>
  );
}
