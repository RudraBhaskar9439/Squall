import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Stats } from "@/components/stats";
import { HowItWorks } from "@/components/how-it-works";
import { Features } from "@/components/features";
import { Simulation } from "@/components/simulation";
import { Marquee } from "@/components/marquee";
import { VaultCta } from "@/components/vault-cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <Marquee text="BE THE HOUSE" />
      <Simulation />
      <VaultCta />
      <Footer />
    </main>
  );
}
