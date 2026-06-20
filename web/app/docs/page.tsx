import { DocTitle, Lead, P } from "./ui";

export const metadata = {
  title: "Squall Docs: Introduction",
  description: "What Squall is and the gap it fills on Sui.",
};

export default function Intro() {
  return (
    <article>
      <DocTitle>Introduction</DocTitle>
      <Lead>
        Squall is a structured-yield protocol on Sui, the Ribbon Finance of Sui. Deposit USDC and
        the vault becomes &ldquo;the house&rdquo; on DeepBook Predict: it supplies the liquidity
        pool, earns a share of trading fees, hedges the worst days, and you withdraw anytime.
      </Lead>
      <P>
        Two things didn&apos;t exist on Sui before Squall: <b className="text-white">DeFi option
        vaults</b> and an <b className="text-white">on-chain volatility index</b>. Squall ships both,
        and writes a <b className="text-white">verifiable track record to Walrus</b>. It&apos;s live on
        Sui testnet today.
      </P>
      <P>
        These docs explain every concept in plain language. Start with{" "}
        <b className="text-white">How it works</b>, dive into <b className="text-white">Core
        concepts</b>, integrate via <b className="text-white">For developers</b>, and look up any term
        in the <b className="text-white">Glossary</b>.
      </P>
    </article>
  );
}
