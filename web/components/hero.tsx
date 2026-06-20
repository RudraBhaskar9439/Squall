"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { EASE } from "@/lib/anim";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.35 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // wave drifts away on scroll (translate + fade only — no scale, so the
  // blurred layer never has to re-rasterize while scrolling)
  const waveY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const waveOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  // glass panel parallax
  const panelY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const panelOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section
      ref={ref}
      id="top"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 sm:px-8"
    >
      <div className="glow left-[15%] top-[20%] h-[460px] w-[460px] bg-sui/30" />
      <div className="glow right-[15%] top-[30%] h-[420px] w-[420px] bg-grape/25" />

      {/* animated wave: full-bleed, behind everything */}
      <motion.div
        style={{ y: waveY, opacity: waveOpacity, willChange: "transform, opacity" }}
        className="pointer-events-none absolute inset-0 z-0"
      >
        <BigWave />
      </motion.div>

      {/* soft, edgeless scrim so the text stays legible over the wave (no box) */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(5,6,10,0.78) 0%, rgba(5,6,10,0.35) 45%, transparent 72%)",
        }}
      />

      {/* hero copy: floats over the wave */}
      <motion.div
        style={{ y: panelY, opacity: panelOpacity }}
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-3xl text-center"
      >
        <motion.div
          variants={item}
          className="mx-auto mb-6 w-fit rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white/75 backdrop-blur-sm"
        >
          🌀 Live on Sui testnet · Built on DeepBook Predict
        </motion.div>
        <motion.h1
          variants={item}
          className="text-balance text-4xl font-semibold leading-[1.04] tracking-tight drop-shadow-[0_2px_30px_rgba(0,0,0,0.6)] sm:text-6xl lg:text-7xl"
        >
          Structured yield,
          <br />
          <span className="text-gradient">built on volatility.</span>
        </motion.h1>
        <motion.p
          variants={item}
          className="mx-auto mt-6 max-w-xl text-pretty text-base text-white/70 drop-shadow-[0_2px_16px_rgba(0,0,0,0.7)] sm:text-lg"
        >
          The Ribbon Finance of Sui. Tokenized vaults on DeepBook Predict, powered by the first
          on-chain volatility index on Sui, with a verifiable track record on Walrus.
        </motion.p>
        <motion.div variants={item} className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/vault"
            className="rounded-full bg-sui px-6 py-3 font-medium text-ink shadow-lg shadow-sui/20 transition hover:bg-aqua"
          >
            Open the vault →
          </Link>
          <a
            href="#how"
            className="rounded-full border border-white/15 bg-black/20 px-6 py-3 font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/5"
          >
            How it works
          </a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-xs text-white/40"
      >
        scroll ↓
      </motion.div>
    </section>
  );
}

// Build a wave that runs far past both edges of the viewport (16 humps from
// well off-screen left to well off-screen right) so the drift animation never
// exposes an end-cap — the wave reads as full-bleed across the whole page.
function wave(y: number, amp: number) {
  let d = `M-900 ${y} q150 ${-amp} 300 0`;
  for (let i = 0; i < 16; i++) d += " t300 0";
  return d;
}
const D1 = wave(260, 120);
const D2 = wave(300, 90);
const D3 = wave(220, 150);

// One drifting wave layer. Each layer is its own compositor texture: the only
// thing that animates is a CSS transform (translateX), so the browser slides a
// cached bitmap instead of repainting the path/blur each frame. The soft glow
// uses a CSS blur (rasterized once) rather than an SVG filter (re-blurred per
// frame — the original cause of the jank on low-end GPUs).
function WaveLayer({
  d,
  width,
  opacity,
  dist,
  duration,
  blur = 0,
  animate,
}: {
  d: string;
  width: number;
  opacity: number;
  dist: number;
  duration: number;
  blur?: number;
  animate: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        opacity,
        filter: blur ? `blur(${blur}px)` : undefined,
        willChange: "transform",
      }}
      animate={animate ? { x: [0, -dist, 0] } : undefined}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 1200 520" className="w-[160vw] min-w-[1100px] overflow-visible" aria-hidden="true">
        <path d={d} fill="none" stroke="url(#hw)" strokeWidth={width} strokeLinecap="round" />
      </svg>
    </motion.div>
  );
}

function BigWave() {
  const reduce = useReducedMotion();
  const animate = !reduce;

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, ease: EASE }}
    >
      {/* shared gradient (referenced by every layer) */}
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          <linearGradient id="hw" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6fbcf0" />
            <stop offset="50%" stopColor="#4da2ff" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>

      <WaveLayer d={D3} width={90} opacity={0.2} blur={16} dist={300} duration={16} animate={animate} />
      <WaveLayer d={D2} width={34} opacity={0.5} dist={200} duration={13} animate={animate} />
      <WaveLayer d={D1} width={58} opacity={1} dist={260} duration={11} animate={animate} />
    </motion.div>
  );
}
