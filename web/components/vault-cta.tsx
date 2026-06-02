import Link from "next/link";
import { Reveal } from "./reveal";

export function VaultCta() {
  return (
    <section id="vault" className="relative mx-auto max-w-6xl px-6 py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-sui/10 via-white/[0.03] to-grape/10 p-12 text-center">
          <div className="glow left-1/2 top-0 h-[300px] w-[420px] -translate-x-1/2 bg-sui/20" />
          <h2 className="relative text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Ready to <span className="text-gradient">earn?</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/60">
            Open the vault to deposit DUSDC, watch your balance grow, and verify every transaction on
            Suiscan — with a full performance history on Walrus.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Link
              href="/vault"
              className="rounded-full bg-sui px-7 py-3 font-medium text-ink transition hover:bg-aqua"
            >
              Open the vault →
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
