"use client";

import { useEffect, useState } from "react";
import { Reveal } from "./reveal";
import { DECIMALS, walrusUrl, type TrackEntry } from "@/lib/strata";

const dusdc = (base: number) => (base / 10 ** DECIMALS.dusdc).toLocaleString(undefined, { maximumFractionDigits: 4 });
const sharePrice = (e: TrackEntry) =>
  e.totalShares > 0 ? (e.navAssets / 10 ** DECIMALS.dusdc / (e.totalShares / 10 ** DECIMALS.vstrata)).toFixed(4) : "—";

export function TrackRecord() {
  const [entries, setEntries] = useState<TrackEntry[]>([]);
  const [verified, setVerified] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch("/track-record.json")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []))
      .catch(() => setEntries([]));
  }, []);

  async function verify(e: TrackEntry) {
    try {
      const r = await fetch(walrusUrl(e.blobId));
      const blob = await r.json();
      setVerified((v) => ({ ...v, [e.epoch]: blob.navAssets === e.navAssets }));
    } catch {
      setVerified((v) => ({ ...v, [e.epoch]: false }));
    }
  }

  return (
    <section id="proof" className="relative mx-auto max-w-6xl px-6 py-28">
      <div className="glow right-1/4 top-10 h-[340px] w-[340px] bg-grape/20" />
      <Reveal>
        <h2 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          A <span className="text-gradient">provable</span> track record
        </h2>
        <p className="mt-4 max-w-2xl text-white/55">
          Every epoch's NAV, positions and rationale are written to Walrus as an immutable,
          content-addressed blob. Anyone can re-fetch a snapshot and confirm it never changed —
          a verifiable history no off-chain fund can offer.
        </p>
      </Reveal>

      <div className="relative mt-14 space-y-4">
        {entries.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-white/40">
            No snapshots yet.
          </div>
        )}
        {entries.map((e, i) => (
          <Reveal key={e.epoch} delay={i * 0.06}>
            <div className="grid items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:grid-cols-[auto_1fr_auto]">
              <div className="font-mono text-sm text-sui">EPOCH {e.epoch}</div>
              <div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  <span className="text-white/80">NAV <b className="font-mono">{dusdc(e.navAssets)}</b> DUSDC</span>
                  <span className="text-white/50">price <b className="font-mono text-white/80">{sharePrice(e)}</b></span>
                  <span className="text-white/50">idle <b className="font-mono text-white/80">{dusdc(e.idle)}</b></span>
                  <span className="text-white/50">PLP <b className="font-mono text-white/80">{dusdc(e.deployed)}</b></span>
                  <span className="text-white/50">vol <b className="font-mono text-white/80">{(e.volIndex / 1e6 * 100).toFixed(1)}%</b></span>
                </div>
                <div className="mt-1 text-xs text-white/40">
                  {new Date(e.tsMs).toLocaleString()} · {e.rationale}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => verify(e)}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/5"
                >
                  {verified[e.epoch] === undefined ? "Verify" : verified[e.epoch] ? "✓ verified" : "✗ mismatch"}
                </button>
                <a
                  href={walrusUrl(e.blobId)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sui hover:text-aqua"
                >
                  Walrus ↗
                </a>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
