"use client";

import { ConnectButton } from "@mysten/dapp-kit";
import { motion } from "motion/react";

export function Nav() {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/30 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#top" className="text-lg font-semibold tracking-tight">
          <span className="text-aqua">◆</span> Strata
        </a>
        <nav className="hidden gap-8 text-sm text-white/60 md:flex">
          <a href="#how" className="transition hover:text-white">How it works</a>
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#vault" className="transition hover:text-white">Vault</a>
        </nav>
        <ConnectButton />
      </div>
    </motion.header>
  );
}
