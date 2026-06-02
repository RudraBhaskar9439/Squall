import { Reveal } from "./reveal";

const steps = [
  { n: "01", title: "Deposit", body: "Deposit dUSDC and receive vSTRATA — a composable ERC-4626 share of the vault." },
  { n: "02", title: "Auto-supply", body: "The vault supplies the DeepBook Predict PLP pool, earning the option-seller premium." },
  { n: "03", title: "Harvest & roll", body: "A keeper marks NAV from the live SVI vol surface and rolls into each new expiry." },
  { n: "04", title: "Redeem", body: "Burn vSTRATA anytime to withdraw your share of the vault's assets." },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <h2 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          How it <span className="text-gradient">works</span>
        </h2>
        <p className="mt-4 max-w-xl text-white/55">
          One deposit becomes a self-rolling, capital-efficient options-premium strategy.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1}>
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-sui/40 hover:bg-white/[0.05]">
              <div className="font-mono text-sm text-sui">{s.n}</div>
              <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
