"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
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

  // wave drifts/scales away on scroll
  const waveScale = useTransform(scrollYProgress, [0, 1], [1, 1.5]);
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

      {/* animated wave — full-bleed, BEHIND the glass */}
      <motion.div
        style={{ scale: waveScale, y: waveY, opacity: waveOpacity }}
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
      >
        <BigWave />
      </motion.div>

      {/* frosted glass panel — wave shows through it blurred, sharp around the edges */}
      <motion.div
        style={{ y: panelY, opacity: panelOpacity }}
        className="relative z-10 w-full max-w-3xl"
      >
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.04] px-6 py-12 text-center shadow-[0_30px_120px_-30px_rgba(77,162,255,0.35)] backdrop-blur-2xl sm:px-14 sm:py-16"
        >
          {/* glass sheen */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />

          <div className="relative">
            <motion.div
              variants={item}
              className="mx-auto mb-6 w-fit rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-white/75"
            >
              🌀 Live on Sui testnet · Built on DeepBook Predict
            </motion.div>
            <motion.h1
              variants={item}
              className="text-balance text-4xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl"
            >
              Structured yield,
              <br />
              <span className="text-gradient">built on volatility.</span>
            </motion.h1>
            <motion.p
              variants={item}
              className="mx-auto mt-6 max-w-xl text-pretty text-base text-white/65 sm:text-lg"
            >
              The Ribbon Finance of Sui — tokenized vaults on DeepBook Predict, powered by the first
              on-chain volatility index on Sui, with a verifiable track record on Walrus.
            </motion.p>
            <motion.div variants={item} className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/vault"
                className="rounded-full bg-sui px-6 py-3 font-medium text-ink transition hover:bg-aqua"
              >
                Open the vault →
              </Link>
              <a
                href="#how"
                className="rounded-full border border-white/15 px-6 py-3 font-medium text-white/80 transition hover:bg-white/5"
              >
                How it works
              </a>
            </motion.div>
          </div>
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

function BigWave() {
  const d1 = "M-220 260 q150 -120 300 0 t300 0 t300 0 t300 0 t300 0 t300 0";
  const d2 = "M-220 300 q150 -90 300 0 t300 0 t300 0 t300 0 t300 0 t300 0";
  const d3 = "M-220 220 q150 -150 300 0 t300 0 t300 0 t300 0 t300 0 t300 0";

  return (
    <motion.svg
      viewBox="0 0 1200 520"
      className="w-[160vw] max-w-[1900px]"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.3, ease: EASE }}
    >
      <defs>
        <linearGradient id="hw" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6fbcf0" />
          <stop offset="50%" stopColor="#4da2ff" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
        <filter id="blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>
      <motion.path
        d={d3} fill="none" stroke="url(#hw)" strokeWidth="90" strokeLinecap="round"
        opacity="0.20" filter="url(#blur)"
        animate={{ x: [0, -300, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d={d2} fill="none" stroke="url(#hw)" strokeWidth="34" strokeLinecap="round" opacity="0.5"
        animate={{ x: [0, -200, 0] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d={d1} fill="none" stroke="url(#hw)" strokeWidth="58" strokeLinecap="round"
        animate={{ x: [0, -260, 0] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}
