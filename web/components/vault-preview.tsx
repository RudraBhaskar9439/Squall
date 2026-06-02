"use client";

import { useSuiClientQuery } from "@mysten/dapp-kit";
import { motion } from "motion/react";
import { Reveal } from "./reveal";
import { VaultDashboard } from "./dashboard";
import { STRATA, EXPLORER } from "@/lib/strata";

type Fields = { value?: string; ema?: string; updates?: string };

export function VaultPreview() {
  const { data, isPending } = useSuiClientQuery("getObject", {
    id: STRATA.volIndex,
    options: { showContent: true },
  });

  const content = data?.data?.content;
  const fields = (content && "fields" in content ? content.fields : {}) as Fields;
  const pct = fields.value ? (Number(fields.value) / 1_000_000) * 100 : null;
  const emaPct = fields.ema ? (Number(fields.ema) / 1_000_000) * 100 : null;

  return (
    <section id="vault" className="relative mx-auto max-w-6xl px-6 py-28">
      <div className="glow left-0 top-10 h-[360px] w-[360px] bg-teal/20" />
      <Reveal>
        <h2 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Live on <span className="text-gradient">testnet</span>
        </h2>
        <p className="mt-4 max-w-xl text-white/55">
          Reading directly from the deployed contracts. This volatility index is updated on-chain.
        </p>
      </Reveal>

      <div className="relative mt-14 grid gap-6 lg:grid-cols-2">
        {/* Vol index gauge */}
        <Reveal>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="text-sm text-white/50">On-chain Volatility Index</div>
            <div className="mt-4 flex items-end gap-3">
              <motion.div
                key={pct ?? "loading"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl font-semibold text-gradient"
              >
                {isPending ? "—" : pct !== null ? `${pct.toFixed(2)}%` : "n/a"}
              </motion.div>
              {emaPct !== null && (
                <div className="pb-2 text-sm text-white/40">EMA {emaPct.toFixed(2)}%</div>
              )}
            </div>
            <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-aqua via-sui to-grape"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct ?? 0, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <a
              href={`${EXPLORER}/${STRATA.volIndex}`}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block text-sm text-sui hover:text-aqua"
            >
              View VolIndex on Suiscan →
            </a>
          </div>
        </Reveal>

        {/* Interactive vault dashboard (live deposit/withdraw) */}
        <Reveal delay={0.1}>
          <VaultDashboard />
        </Reveal>
      </div>
    </section>
  );
}
