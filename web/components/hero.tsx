"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { EASE } from "@/lib/anim";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
};

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* gradient glows */}
      <div className="glow left-1/4 top-1/4 h-[420px] w-[420px] bg-sui/40" />
      <div className="glow right-1/4 top-1/3 h-[380px] w-[380px] bg-grape/30" />
      <div className="glow bottom-10 left-1/2 h-[300px] w-[520px] -translate-x-1/2 bg-teal/20" />

      <motion.div style={{ y, opacity }} variants={container} initial="hidden" animate="show" className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div variants={item} className="mx-auto mb-6 w-fit rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-white/70">
          ◆ Live on Sui testnet · Built on DeepBook Predict
        </motion.div>
        <motion.h1 variants={item} className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          Structured yield,
          <br />
          <span className="text-gradient">built on volatility.</span>
        </motion.h1>
        <motion.p variants={item} className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-white/60">
          Strata is the Ribbon Finance of Sui — tokenized ERC-4626 vaults on DeepBook Predict,
          powered by the first on-chain volatility index on Sui, with a verifiable track record on Walrus.
        </motion.p>
        <motion.div variants={item} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="#vault" className="rounded-full bg-sui px-6 py-3 font-medium text-ink transition hover:bg-aqua">
            Open the vault
          </a>
          <a href="#how" className="rounded-full border border-white/15 px-6 py-3 font-medium text-white/80 transition hover:bg-white/5">
            How it works
          </a>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-white/40">
        scroll ↓
      </motion.div>
    </section>
  );
}
