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

const LABEL = SNAPSHOT_LABEL;

// formatting helpers ---------------------------------------------------------
const n2 = (base: number, dec = DECIMALS.dusdc) =>
  (base / 10 ** dec).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const priceNum = (e: TrackEntry) =>
  e.totalShares > 0 ? e.navAssets / 10 ** DECIMALS.dusdc / (e.totalShares / 10 ** DECIMALS.vstrata) : 0;
const pct1 = (vol1e6: number) => `${((vol1e6 / 1e6) * 100).toFixed(1)}%`;
const dateUTC = (ts: number) =>
  new Date(ts).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", day: "numeric", year: "numeric" });
const timeUTC = (ts: number) =>
  `${new Date(ts).toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} UTC`;
const trunc = (id: string) => (id.length > 10 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id);

const COLS =
  "grid grid-cols-[120px_repeat(4,minmax(0,1fr))_72px_minmax(200px,auto)] items-center gap-x-4";

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

  // Re-fetch the blob from Walrus and confirm both its contents (NAV) and its
  // chain link (prevBlob must equal the previous snapshot's blobId).
  async function verify(e: TrackEntry, i: number) {
    try {
      const r = await fetch(walrusUrl(e.blobId));
      const blob = await r.json();
      const navOk = blob.navAssets === e.navAssets;
      const older = entries[i + 1];
      const chainOk =
        typeof blob.prevBlob === "string" && blob.prevBlob !== ""
          ? !!older && blob.prevBlob === older.blobId
          : true; // seed snapshots predate the hash-chain
      setVerified((v) => ({ ...v, [e.blobId]: navOk && chainOk }));
    } catch {
      setVerified((v) => ({ ...v, [e.blobId]: false }));
    }
  }

  const total = entries.length;
  const newest = entries[0];
  const oldest = entries[total - 1];
  const ret =
    oldest && priceNum(oldest) > 0 ? (priceNum(newest) / priceNum(oldest) - 1) * 100 : 0;

  return (
    <section id="proof" className="relative mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-16 py-20 sm:py-28 lg:py-32">
      <div className="glow right-1/4 top-10 h-[340px] w-[340px] bg-grape/20" />
      <Reveal>
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          A <span className="text-gradient">provable</span> track record
        </h2>
        <p className="mt-4 max-w-2xl text-white/55">
          Every vault action writes an immutable, content-addressed snapshot to Walrus: NAV,
          positions and rationale. Each snapshot is hash-chained to the one before it, so the whole
          history is tamper-evident, re-fetch any entry to confirm both its contents and its link.
          A live, verifiable record no off-chain fund can offer.
        </p>
      </Reveal>

      {/* summary band */}
      <Reveal delay={0.05}>
        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-4">
          <Stat label="Current NAV" value={newest ? `${n2(newest.navAssets)}` : "n/a"} unit="DUSDC" />
          <Stat
            label="All-time return"
            value={total > 1 ? `${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%` : "n/a"}
            valueClass={total > 1 ? (ret >= 0 ? "text-teal" : "text-rose-400") : ""}
          />
          <Stat label={`${LABEL}s`} value={String(total)} />
          <Stat label="Live since" value={oldest ? dateUTC(oldest.tsMs) : "n/a"} />
        </div>
      </Reveal>

      {/* table */}
      <Reveal delay={0.1}>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0b2a40]/35 backdrop-blur-md">
          {/* header */}
          <div className={`${COLS} border-b border-white/10 px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-white/40`}>
            <div>{LABEL}</div>
            <div className="text-right">NAV (DUSDC)</div>
            <div className="text-right">Share price</div>
            <div className="text-right">Idle</div>
            <div className="text-right">In PLP</div>
            <div className="text-right">Vol</div>
            <div className="text-right">Proof</div>
          </div>

          {total === 0 && (
            <div className="px-6 py-8 text-sm text-white/40">
              No snapshots yet. Make a deposit to write the first one.
            </div>
          )}

          {entries.map((e, i) => (
            <div
              key={e.blobId}
              className={`${COLS} gap-y-1 border-t border-white/5 px-6 py-4 transition hover:bg-white/[0.025] ${
                e.isLive ? "bg-aqua/[0.04]" : ""
              }`}
            >
              {/* id */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-sm text-sui">#{total - i}</span>
                {e.isLive && (
                  <span className="rounded-full border border-aqua/40 bg-aqua/10 px-1.5 py-0.5 text-[10px] text-aqua">
                    live
                  </span>
                )}
                {e.prevBlob && (
                  <span
                    title={`hash-chained to ${e.prevBlob}`}
                    className="rounded-full border border-white/15 px-1.5 py-0.5 text-[10px] text-white/45"
                  >
                    🔗 chained
                  </span>
                )}
              </div>

              {/* numbers */}
              <div className="text-right font-mono text-sm tabular-nums text-white/90">{n2(e.navAssets)}</div>
              <div className="text-right font-mono text-sm tabular-nums text-white/70">{priceNum(e).toFixed(4)}</div>
              <div className="text-right font-mono text-sm tabular-nums text-white/70">{n2(e.idle)}</div>
              <div className="text-right font-mono text-sm tabular-nums text-white/70">{n2(e.deployed)}</div>
              <div className="text-right font-mono text-sm tabular-nums text-white/70">{pct1(e.volIndex)}</div>

              {/* proof */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => verify(e, i)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    verified[e.blobId] === true
                      ? "border-teal/40 bg-teal/10 text-teal"
                      : verified[e.blobId] === false
                        ? "border-rose-400/40 bg-rose-400/10 text-rose-300"
                        : "border-white/15 text-white/70 hover:bg-white/5"
                  }`}
                >
                  {verified[e.blobId] === undefined ? "Verify" : verified[e.blobId] ? "✓ verified" : "✗ mismatch"}
                </button>
                <a
                  href={walruscanUrl(e.blobId)}
                  target="_blank"
                  rel="noreferrer"
                  title={e.blobId}
                  className="flex items-center gap-1 rounded-full border border-sui/25 bg-sui/5 px-2.5 py-1 font-mono text-xs text-sui transition hover:bg-sui/10"
                >
                  {trunc(e.blobId)} <span className="text-[10px]">↗</span>
                </a>
              </div>

              {/* sub-line: timestamp + rationale */}
              <div className="col-span-full mt-0.5 text-xs text-white/40">
                {timeUTC(e.tsMs)} · {e.rationale}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

function Stat({
  label,
  value,
  unit,
  valueClass = "",
}: {
  label: string;
  value: string;
  unit?: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-[#0b2a40]/50 px-5 py-4">
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`font-mono text-xl font-semibold tabular-nums ${valueClass}`}>{value}</span>
        {unit && <span className="text-xs text-white/40">{unit}</span>}
      </div>
    </div>
  );
}
