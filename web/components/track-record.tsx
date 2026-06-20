"use client";

import { useEffect, useState } from "react";
import { Reveal } from "./reveal";
import {
  DECIMALS,
  walrusUrl,
  walruscanUrl,
  LIVE_SNAPSHOTS_KEY,
  SNAPSHOT_EVENT,
  SNAPSHOT_LABEL,
  type TrackEntry,
} from "@/lib/strata";

const dusdc = (base: number) => (base / 10 ** DECIMALS.dusdc).toLocaleString(undefined, { maximumFractionDigits: 4 });
const sharePrice = (e: TrackEntry) =>
  e.totalShares > 0 ? (e.navAssets / 10 ** DECIMALS.dusdc / (e.totalShares / 10 ** DECIMALS.vstrata)).toFixed(4) : "—";

const LABEL = SNAPSHOT_LABEL.toUpperCase();

function readLive(): TrackEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LIVE_SNAPSHOTS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function TrackRecord() {
  const [entries, setEntries] = useState<TrackEntry[]>([]);
  const [verified, setVerified] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let json: TrackEntry[] = [];

    // merge committed (track-record.json) + live (localStorage) snapshots, newest first.
    const merge = () => {
      const byBlob = new Map<string, TrackEntry>();
      [...json, ...readLive()].forEach((e) => byBlob.set(e.blobId, e));
      setEntries([...byBlob.values()].sort((a, b) => b.tsMs - a.tsMs));
    };

    fetch("/track-record.json")
      .then((r) => r.json())
      .then((d) => {
        json = d.entries ?? [];
        merge();
      })
      .catch(merge);

    window.addEventListener(SNAPSHOT_EVENT, merge);
    window.addEventListener("storage", merge);
    return () => {
      window.removeEventListener(SNAPSHOT_EVENT, merge);
      window.removeEventListener("storage", merge);
    };
  }, []);

  async function verify(e: TrackEntry) {
    try {
      const r = await fetch(walrusUrl(e.blobId));
      const blob = await r.json();
      setVerified((v) => ({ ...v, [e.blobId]: blob.navAssets === e.navAssets }));
    } catch {
      setVerified((v) => ({ ...v, [e.blobId]: false }));
    }
  }

  const total = entries.length;

  return (
    <section id="proof" className="relative mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-16 py-20 sm:py-28 lg:py-32">
      <div className="glow right-1/4 top-10 h-[340px] w-[340px] bg-grape/20" />
      <Reveal>
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          A <span className="text-gradient">provable</span> track record
        </h2>
        <p className="mt-4 max-w-2xl text-white/55">
          Every vault action writes an immutable, content-addressed snapshot to Walrus — NAV,
          positions and rationale. Each one re-fetches and verifies on demand, and links straight
          to Walruscan. A live, verifiable history no off-chain fund can offer.
        </p>
      </Reveal>

      <div className="relative mt-14 space-y-4">
        {total === 0 && (
          <div className="rounded-2xl border border-white/10 bg-[#0b2a40]/35 backdrop-blur-md p-6 text-sm text-white/40">
            No snapshots yet — make a deposit to write the first one.
          </div>
        )}
        {entries.map((e, i) => (
          <Reveal key={e.blobId} delay={i * 0.06}>
            <div
              className={`grid items-center gap-4 rounded-2xl border bg-[#0b2a40]/35 backdrop-blur-md p-6 md:grid-cols-[auto_1fr_auto] ${
                e.isLive ? "border-aqua/40" : "border-white/10"
              }`}
            >
              <div className="font-mono text-sm text-sui">
                {LABEL} #{total - i}
                {e.isLive && (
                  <span className="ml-2 rounded-full border border-aqua/40 bg-aqua/10 px-2 py-0.5 text-[10px] font-sans text-aqua">
                    live
                  </span>
                )}
              </div>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => verify(e)}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80 transition hover:bg-white/5"
                >
                  {verified[e.blobId] === undefined ? "Verify" : verified[e.blobId] ? "✓ verified" : "✗ mismatch"}
                </button>
                <a
                  href={walruscanUrl(e.blobId)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-sui/30 bg-sui/5 px-3 py-1.5 text-xs text-sui transition hover:bg-sui/10"
                >
                  Walruscan ↗
                </a>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
