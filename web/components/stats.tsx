import { Reveal } from "./reveal";

const stats = [
  { label: "Vault standard", value: "ERC-4626" },
  { label: "On Sui, a first", value: "Vol Index" },
  { label: "Built on", value: "Predict" },
  { label: "Status", value: "Testnet" },
];

export function Stats() {
  return (
    <section className="relative mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-16 py-20">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="bg-ink-2/60 p-8 text-center">
            <div className="text-3xl font-semibold text-gradient">{s.value}</div>
            <div className="mt-2 text-sm text-white/50">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
