import { Reveal } from "./reveal";

const steps = [
  {
    t: "Deposit",
    d: "Deposit USDC and receive vSTRATA — a composable share of the vault.",
    icon: "M12 3v10m0 0l-4-4m4 4l4-4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3",
  },
  {
    t: "Be the house",
    d: "The vault supplies DeepBook Predict's PLP — earning a share of every trade.",
    icon: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  },
  {
    t: "Hedge & roll",
    d: "A keeper marks NAV from the live vol surface and auto-rolls each expiry, hedging the tail.",
    icon: "M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M18 4v3h-3M6 20v-3h3",
  },
  {
    t: "Withdraw",
    d: "Burn vSTRATA anytime to cash out your share of the vault.",
    icon: "M12 14V4m0 0L8 8m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-16 py-20 sm:py-28 lg:py-32">
      <Reveal>
        <h2 className="text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          How it <span className="text-gradient">works</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-white/55">
          One deposit becomes a self-rolling, hedged, capital-efficient strategy.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <Reveal key={s.t} delay={i * 0.1}>
            <div className="group h-full rounded-3xl border border-white/10 bg-[#0b2a40]/35 backdrop-blur-md p-8 text-center transition hover:border-sui/40 hover:bg-white/[0.05]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#0b2a40]/35 backdrop-blur-md text-aqua transition group-hover:border-sui/40">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </div>
              <div className="mt-5 font-mono text-xs text-white/30">0{i + 1}</div>
              <h3 className="mt-1 text-xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
