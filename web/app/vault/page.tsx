import { Nav } from "@/components/nav";
import { Reveal } from "@/components/reveal";
import { VolGauge } from "@/components/vol-gauge";
import { VaultDashboard } from "@/components/dashboard";
import { TrackRecord } from "@/components/track-record";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Strata — Vault",
  description: "Deposit, withdraw, and track your Strata vault position on Sui testnet.",
};

export default function VaultPage() {
  return (
    <main className="relative">
      <Nav />

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-32">
        <Reveal>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            The <span className="text-gradient">vault</span>
          </h1>
          <p className="mt-3 max-w-2xl text-white/55">
            Deposit DUSDC, earn the option-seller premium on DeepBook Predict, and verify every
            action — transaction hashes on Suiscan, performance history on Walrus.
          </p>
        </Reveal>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-6">
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
