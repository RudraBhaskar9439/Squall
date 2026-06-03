import { Nav } from "@/components/nav";
import { Reveal } from "@/components/reveal";
import { VolGauge } from "@/components/vol-gauge";
import { VaultDashboard } from "@/components/dashboard";
import { TrackRecord } from "@/components/track-record";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Squall — Vault",
  description: "Deposit, withdraw, and track your Squall vault position on Sui testnet.",
};

export default function VaultPage() {
  return (
    <main className="relative">
      <Nav />

      <section className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-16 pb-8 pt-32">
        <Reveal>
          <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Be the <span className="text-gradient">house</span>
          </h1>
          <p className="mt-3 max-w-2xl text-white/55">
            Deposit USDC and earn a share of DeepBook Predict trading fees — hedged, managed, and
            verifiable. No options knowledge required.
          </p>
        </Reveal>

        {/* dead-simple 3 steps */}
        <Reveal delay={0.1}>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", t: "Deposit USDC", d: "You receive a vault share token." },
              { n: "2", t: "The vault earns", d: "It’s the house on Predict — earning fees from traders, with a hedge capping bad days." },
              { n: "3", t: "Withdraw anytime", d: "Burn your shares to cash out your balance." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="font-mono text-sm text-sui">{s.n}</div>
                <div className="mt-2 font-medium">{s.t}</div>
                <div className="mt-1 text-sm text-white/50">{s.d}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-16 pb-6">
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <Reveal>
            <VolGauge />
          </Reveal>
          <Reveal delay={0.1}>
            <VaultDashboard />
          </Reveal>
        </div>
      </section>

      <TrackRecord />
      <Footer />
    </main>
  );
}
