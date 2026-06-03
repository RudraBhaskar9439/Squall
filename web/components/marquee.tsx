"use client";

import { motion } from "motion/react";

/** Giant faint scrolling watermark text, à la Walrus's "Trust The Tusk". */
export function Marquee({ text = "BE THE HOUSE", repeat = 6 }: { text?: string; repeat?: number }) {
  const items = Array.from({ length: repeat });
  return (
    <div className="relative select-none overflow-hidden border-y border-white/5 py-10">
      <motion.div
        className="flex w-max items-center whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      >
        {items.concat(items).map((_, i) => (
          <span
            key={i}
            className="px-8 text-[10vw] font-semibold leading-none tracking-tight text-white/[0.05]"
          >
            {text} <span className="text-sui/20">•</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
