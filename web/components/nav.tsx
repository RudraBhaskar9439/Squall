"use client";

import Link from "next/link";
import { ConnectButton } from "@mysten/dapp-kit";
import { motion } from "motion/react";

export function Nav() {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#06203a]/40 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 sm:px-8 lg:px-16">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="text-aqua">◆</span> Squall
        </Link>
        <nav className="hidden gap-8 text-sm text-white/60 md:flex">
          <Link href="/#how" className="transition hover:text-white">How it works</Link>
          <Link href="/#features" className="transition hover:text-white">Features</Link>
          <Link href="/#sim" className="transition hover:text-white">Backtest</Link>
          <Link href="/vault" className="transition hover:text-white">Vault</Link>
          <Link href="/docs" className="transition hover:text-white">Docs</Link>
        </nav>
        <div className="dappkit-connect">
          <ConnectButton />
        </div>
      </div>
    </motion.header>
  );
}
