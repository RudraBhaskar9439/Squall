"use client";

import { motion, useScroll, useTransform } from "motion/react";

// fixed bubble set (no random → no hydration mismatch)
const BUBBLES = [
  { l: "6%", s: 5, delay: 0, dur: 16 },
  { l: "14%", s: 8, delay: 4, dur: 20 },
  { l: "23%", s: 4, delay: 8, dur: 14 },
  { l: "33%", s: 7, delay: 2, dur: 18 },
  { l: "44%", s: 5, delay: 6, dur: 22 },
  { l: "52%", s: 9, delay: 1, dur: 17 },
  { l: "61%", s: 4, delay: 9, dur: 15 },
  { l: "70%", s: 6, delay: 3, dur: 19 },
  { l: "79%", s: 8, delay: 7, dur: 21 },
  { l: "88%", s: 5, delay: 5, dur: 16 },
  { l: "94%", s: 4, delay: 10, dur: 14 },
];

export function SeaBackground() {
  const { scrollYProgress } = useScroll();
  const surface = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const abyss = useTransform(scrollYProgress, [0.45, 1], [0, 1]);
  const rays = useTransform(scrollYProgress, [0, 0.3], [0.6, 0]);
  const coralO = useTransform(scrollYProgress, [0.6, 0.92], [0, 1]);
  const coralY = useTransform(scrollYProgress, [0.6, 1], [90, 0]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#04111f]">
      {/* depth gradient (surface → deep) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b3050] via-[#06203a] to-[#03101d]" />
      {/* surface glow fades as you descend */}
      <motion.div
        style={{ opacity: surface }}
        className="absolute inset-0 bg-gradient-to-b from-[#10456b] via-[#0a2c46]/50 to-transparent"
      />
      {/* abyss deepens as you descend */}
      <motion.div
        style={{ opacity: abyss }}
        className="absolute inset-0 bg-gradient-to-b from-transparent via-[#02101e] to-[#01060d]"
      />

      {/* god rays from the surface */}
      <motion.div style={{ opacity: rays }} className="absolute inset-0">
        <div className="absolute -top-[10%] left-[18%] h-[95vh] w-40 rotate-[14deg] bg-gradient-to-b from-white/[0.07] to-transparent blur-2xl" />
        <div className="absolute -top-[10%] left-[38%] h-[95vh] w-28 rotate-[8deg] bg-gradient-to-b from-white/[0.05] to-transparent blur-2xl" />
        <div className="absolute -top-[10%] left-[60%] h-[95vh] w-36 rotate-[18deg] bg-gradient-to-b from-white/[0.06] to-transparent blur-2xl" />
        <div className="absolute -top-[10%] left-[80%] h-[95vh] w-24 rotate-[10deg] bg-gradient-to-b from-white/[0.04] to-transparent blur-2xl" />
      </motion.div>

      {/* caustic light blobs */}
      <div className="glow left-[8%] top-[14%] h-[420px] w-[420px] bg-teal/15" />
      <div className="glow right-[10%] top-[42%] h-[460px] w-[460px] bg-sui/10" />

      {/* rising bubbles */}
      {BUBBLES.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white/10"
          style={{ left: b.l, bottom: -20, width: b.s, height: b.s }}
          animate={{ y: ["0vh", "-115vh"], opacity: [0, 0.5, 0] }}
          transition={{ duration: b.dur, delay: b.delay, repeat: Infinity, ease: "easeIn" }}
        />
      ))}

      {/* coral reef at the seabed (reveals near the bottom) */}
      <motion.div style={{ opacity: coralO, y: coralY }} className="absolute inset-x-0 bottom-0">
        <Coral />
      </motion.div>
    </div>
  );
}

function Coral() {
  const weeds = [
    { x: 150, h: 150 },
    { x: 360, h: 110 },
    { x: 1050, h: 160 },
    { x: 1280, h: 120 },
  ];
  return (
    <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="block w-full">
      <defs>
        <linearGradient id="reef" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a3a48" />
          <stop offset="100%" stopColor="#021018" />
        </linearGradient>
        <linearGradient id="weed" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#0e5563" />
          <stop offset="100%" stopColor="#0e5563" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* reef mound */}
      <path
        d="M0 260 L0 175 Q 180 120 360 160 T 720 150 T 1080 165 T 1440 150 L1440 260 Z"
        fill="url(#reef)"
      />
      {/* coral fans */}
      <path d="M600 260 q -10 -70 30 -90 q -10 50 20 60 q 20 -40 40 -30 q -20 30 0 60 Z" fill="#0a3a48" opacity="0.9" />
      <path d="M820 260 q 10 -60 -25 -80 q 8 45 -18 55 q -18 -35 -36 -26 q 18 28 0 51 Z" fill="#0c424f" opacity="0.85" />

      {/* swaying seaweed */}
      {weeds.map((w, i) => (
        <motion.path
          key={i}
          d={`M${w.x} 260 q 28 -${Math.round(w.h * 0.4)} 0 -${Math.round(w.h * 0.7)} t 0 -${Math.round(w.h * 0.3)}`}
          stroke="url(#weed)"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
          style={{ transformOrigin: `${w.x}px 260px` }}
          animate={{ rotate: [-4, 4, -4] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}
