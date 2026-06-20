import { DocTitle, Lead, P, Step } from "../ui";

export const metadata = { title: "Squall Docs: How it works" };

export default function HowItWorks() {
  return (
    <article>
      <DocTitle>How it works</DocTitle>
      <Lead>The simplest framing: a casino earns from the players. With Squall, you become the house.</Lead>
      <ol className="mt-6 space-y-3">
        <Step n="1" t="Deposit USDC">You receive vSTRATA, a share token representing your slice of the vault.</Step>
        <Step n="2" t="The vault earns">It supplies DeepBook Predict&apos;s PLP pool (the counterparty to traders), collecting the option-seller premium.</Step>
        <Step n="3" t="Hedge & roll">A keeper marks the vault&apos;s value from the live vol surface, auto-rolls each expiry, and a hedge caps single-day crash losses.</Step>
        <Step n="4" t="Withdraw anytime">Burn vSTRATA to cash out your share of the vault&apos;s current value.</Step>
      </ol>
      <P>
        The options and volatility machinery stays under the hood. To a user, it&apos;s just
        deposit → earn → withdraw, and every action is a real on-chain transaction you can verify on
        Suiscan.
      </P>
    </article>
  );
}
