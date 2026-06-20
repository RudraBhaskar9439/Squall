import { Reveal } from "./reveal";

const features = [
  {
    title: "ERC-4626 vaults",
    body: "Faithful tokenized-vault semantics in Move: previews, conversions, and inflation-attack protection via a virtual-offset.",
    icon: "◳",
  },
  {
    title: "On-chain Vol Index",
    body: "The first volatility index on Sui, derived from DeepBook Predict's SVI surface and readable by any protocol.",
    icon: "∿",
  },
  {
    title: "Verifiable track record",
    body: "Every vault action's NAV, PnL and rationale is written to Walrus: a provable, tamper-proof performance history.",
    icon: "✓",
  },
  {
    title: "Capital efficient",
    body: "A cached NAV model keeps reads O(1); fees accrue as dilution so capital stays fully invested.",
    icon: "⚡",
  },
];

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-16 py-20 sm:py-28 lg:py-32">
      <div className="glow right-0 top-1/4 h-[360px] w-[360px] bg-grape/20" />
      <Reveal>
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          Built like <span className="text-gradient">real infrastructure</span>
        </h2>
      </Reveal>
      <div className="relative mt-14 grid gap-6 md:grid-cols-2">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.08}>
            <div className="flex h-full gap-5 rounded-2xl border border-white/10 bg-[#0b2a40]/35 backdrop-blur-md p-7">
              <div className="text-2xl text-aqua">{f.icon}</div>
              <div>
                <h3 className="text-xl font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{f.body}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
