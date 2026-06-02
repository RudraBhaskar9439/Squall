"use client";

import { useSuiClientQuery } from "@mysten/dapp-kit";
import { motion } from "motion/react";
import { STRATA, EXPLORER } from "@/lib/strata";

type Fields = { value?: string; ema?: string; updates?: string };

export function VolGauge() {
  const { data, isPending } = useSuiClientQuery("getObject", {
    id: STRATA.volIndex,
    options: { showContent: true },
  });

  const content = data?.data?.content;
  const fields = (content && "fields" in content ? content.fields : {}) as Fields;
  const pct = fields.value ? Number(fields.value) / 1e4 : null; // 1e6 scale → %
  const emaPct = fields.ema ? Number(fields.ema) / 1e4 : null;
  const updates = fields.updates ?? "0";

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-white/50">On-chain Volatility Index</div>
          <p className="mt-1 text-xs text-white/40">The first vol benchmark on Sui — readable by any protocol.</p>
        </div>
        <span className="rounded-full border border-teal/30 bg-teal/5 px-2.5 py-1 text-[10px] font-medium tracking-wide text-teal">
          ● LIVE
        </span>
      </div>

      <div className="mt-7 flex items-end gap-3">
        <motion.div
          key={pct ?? "loading"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-gradient text-6xl font-semibold leading-none"
        >
          {isPending ? "—" : pct !== null ? `${pct.toFixed(2)}%` : "n/a"}
        </motion.div>
        {emaPct !== null && <div className="pb-1 text-sm text-white/40">EMA {emaPct.toFixed(2)}%</div>}
      </div>
      <div className="mt-2 text-xs text-white/40">annualized BTC implied volatility</div>

      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-aqua via-sui to-grape"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(pct ?? 0, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-white/30">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      {/* metadata — fills the card with real signal */}
      <div className="mt-7 grid grid-cols-2 gap-3 text-xs">
        <Meta label="Source" value="Predict OracleSVI" />
        <Meta label="Pricing oracle" value="Block Scholes" />
        <Meta label="On-chain updates" value={updates} />
        <Meta label="Powers" value="Squall hedge model" />
      </div>

      <p className="mt-6 text-xs leading-relaxed text-white/45">
        Derived from DeepBook Predict&apos;s SVI surface and published on-chain — so Squall, and any
        other protocol, can price risk against one shared, verifiable benchmark.
      </p>

      <a
        href={`${EXPLORER}/${STRATA.volIndex}`}
        target="_blank"
        rel="noreferrer"
        className="mt-auto inline-block pt-6 text-sm text-sui hover:text-aqua"
      >
        View VolIndex on Suiscan →
      </a>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-white/40">{label}</div>
      <div className="mt-1 font-medium text-white/80">{value}</div>
    </div>
  );
}
