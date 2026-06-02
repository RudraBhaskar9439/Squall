"use client";

import { useEffect, useState } from "react";
import { Reveal } from "./reveal";

type Stats = { apy: number; maxDrawdown: number; sharpe: number; finalNav: number };
type Sim = {
  crashEpoch: number;
  navNaive: number[];
  navHedged: number[];
  path: { naive: Stats; hedged: Stats };
  monteCarlo: { runs: number; naive: Stats; hedged: Stats };
};

const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export function Simulation() {
  const [sim, setSim] = useState<Sim | null>(null);
  useEffect(() => {
    fetch("/simulation.json").then((r) => r.json()).then(setSim).catch(() => setSim(null));
  }, []);

  return (
    <section id="sim" className="relative mx-auto max-w-6xl px-6 py-28">
      <div className="glow left-1/4 top-10 h-[340px] w-[340px] bg-teal/20" />
      <Reveal>
        <h2 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Backtested <span className="text-gradient">risk transfer</span>
        </h2>
        <p className="mt-4 max-w-2xl text-white/55">
          The hedge overlay gives up a little yield to cap the tail. One illustrative year (with a
          crash) plus a {sim?.monteCarlo.runs ?? "1000"}-scenario Monte Carlo.
        </p>
      </Reveal>

      <div className="relative mt-14 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Reveal>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            {sim ? <Chart sim={sim} /> : <div className="h-[260px] animate-pulse rounded-xl bg-white/5" />}
            <div className="mt-4 flex gap-6 text-xs text-white/60">
              <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-grape align-middle" />Naive PLP (unhedged)</span>
              <span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-aqua align-middle" />Squall (hedged)</span>
              <span className="text-white/30">▏ crash</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex h-full flex-col justify-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
            <div className="text-sm text-white/50">Monte Carlo averages ({sim?.monteCarlo.runs ?? "—"} runs)</div>
            <Metric label="APY" naive={sim?.monteCarlo.naive.apy} hedged={sim?.monteCarlo.hedged.apy} fmt={pct} />
            <Metric label="Max drawdown" naive={sim?.monteCarlo.naive.maxDrawdown} hedged={sim?.monteCarlo.hedged.maxDrawdown} fmt={pct} lowerBetter />
            <Metric label="Sharpe" naive={sim?.monteCarlo.naive.sharpe} hedged={sim?.monteCarlo.hedged.sharpe} fmt={(x) => x.toFixed(2)} higherBetter />
            <p className="mt-2 text-xs leading-relaxed text-white/40">
              Across random crash scenarios the hedge meaningfully lowers drawdown and lifts
              risk-adjusted return for a small APY cost — capital preservation, on-chain.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Chart({ sim }: { sim: Sim }) {
  const W = 600;
  const H = 260;
  const pad = 24;
  const all = [...sim.navNaive, ...sim.navHedged];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const n = sim.navNaive.length;
  const x = (i: number) => pad + (i / (n - 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - ((v - min) / (max - min || 1)) * (H - 2 * pad);
  const line = (a: number[]) => a.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const crashX = x(sim.crashEpoch);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* baseline NAV = 1 */}
      <line x1={pad} x2={W - pad} y1={y(1)} y2={y(1)} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
      {/* crash marker */}
      <line x1={crashX} x2={crashX} y1={pad} y2={H - pad} stroke="rgba(255,255,255,0.18)" strokeDasharray="3 3" />
      <text x={crashX + 4} y={pad + 10} fill="rgba(255,255,255,0.35)" fontSize="10">crash</text>
      <polyline points={line(sim.navNaive)} fill="none" stroke="#a78bfa" strokeWidth="2" />
      <polyline points={line(sim.navHedged)} fill="none" stroke="#6fbcf0" strokeWidth="2" />
    </svg>
  );
}

function Metric({
  label,
  naive,
  hedged,
  fmt,
  lowerBetter,
  higherBetter,
}: {
  label: string;
  naive?: number;
  hedged?: number;
  fmt: (x: number) => string;
  lowerBetter?: boolean;
  higherBetter?: boolean;
}) {
  const win =
    naive == null || hedged == null
      ? false
      : lowerBetter
        ? hedged < naive
        : higherBetter
          ? hedged > naive
          : false;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="font-mono text-sm text-grape">{naive == null ? "—" : fmt(naive)}</span>
        <span className="text-[10px] text-white/30">naive → hedged</span>
        <span className={`font-mono text-sm ${win ? "text-teal" : "text-aqua"}`}>
          {hedged == null ? "—" : fmt(hedged)}
        </span>
      </div>
    </div>
  );
}
