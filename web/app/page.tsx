import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Stats } from "@/components/stats";
import { HowItWorks } from "@/components/how-it-works";
import { Features } from "@/components/features";
import { VaultPreview } from "@/components/vault-preview";
import { TrackRecord } from "@/components/track-record";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Stats />
      <HowItWorks />
      <Features />
      <VaultPreview />
      <TrackRecord />
      <Footer />
    </main>
  );
}
