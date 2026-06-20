"use client";

import { motion, useScroll, useTransform } from "motion/react";

// `phase` (0..1) = how far along its rise the bubble already is at load, applied
// as a negative delay so the scene is full of life the instant the page opens.
const BUBBLES = [
  { l: "8%", s: 5, phase: 0.1, dur: 17 },
  { l: "19%", s: 7, phase: 0.55, dur: 21 },
  { l: "31%", s: 4, phase: 0.3, dur: 15 },
  { l: "46%", s: 6, phase: 0.8, dur: 19 },
  { l: "58%", s: 8, phase: 0.2, dur: 22 },
  { l: "71%", s: 4, phase: 0.65, dur: 16 },
  { l: "83%", s: 6, phase: 0.45, dur: 20 },
  { l: "92%", s: 5, phase: 0.9, dur: 18 },
];

type Lane = {
  y: string;
  dir: 1 | -1;
  dur: number;
  phase: number; // 0..1 — how far across its lane the swimmer is at load
  scale: number;
  op: number;
  kind: "fish" | "school" | "shark";
  color?: string;
};

// Swimmers live only in the hero (faded out on scroll), so they never cross data.
// phases between ~0.15 and ~0.85 keep each one on-screen at load.
const SWIMMERS: Lane[] = [
  { y: "12%", dir: 1, dur: 30, phase: 0.55, scale: 0.55, op: 0.5, kind: "fish", color: "#6fbcf0" },
  { y: "20%", dir: -1, dur: 40, phase: 0.25, scale: 0.8, op: 0.65, kind: "fish", color: "#a78bfa" },
  { y: "30%", dir: -1, dur: 44, phase: 0.7, scale: 0.6, op: 0.5, kind: "school", color: "#2dd4bf" },
  { y: "40%", dir: 1, dur: 56, phase: 0.4, scale: 1, op: 0.38, kind: "shark" },
  { y: "50%", dir: 1, dur: 34, phase: 0.82, scale: 0.7, op: 0.55, kind: "fish", color: "#6fbcf0" },
  { y: "58%", dir: -1, dur: 38, phase: 0.15, scale: 0.6, op: 0.5, kind: "fish", color: "#2dd4bf" },
  { y: "66%", dir: 1, dur: 42, phase: 0.6, scale: 0.85, op: 0.45, kind: "school", color: "#6fbcf0" },
  { y: "74%", dir: -1, dur: 30, phase: 0.35, scale: 0.5, op: 0.55, kind: "fish", color: "#a78bfa" },
  { y: "82%", dir: 1, dur: 36, phase: 0.85, scale: 0.65, op: 0.4, kind: "fish", color: "#6fbcf0" },
];

export function SeaBackground() {
  const { scrollYProgress } = useScroll();
  const rays = useTransform(scrollYProgress, [0, 0.25], [0.55, 0]);
  // fish only in the hero
  const swimmers = useTransform(scrollYProgress, [0, 0.1, 0.16], [1, 1, 0]);
  // coral only at the true seabed (very bottom)
  const coralO = useTransform(scrollYProgress, [0.82, 0.97], [0, 1]);
  const coralY = useTransform(scrollYProgress, [0.82, 1], [120, 0]);

  // depth gradient lives on <body> (full document); this layer is just the
  // ambient life (rays, fish, bubbles, coral) over it, so it stays transparent.
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* god rays (hero only) */}
      <motion.div style={{ opacity: rays }} className="absolute inset-0">
        <div className="absolute -top-[10%] left-[20%] h-[95vh] w-40 rotate-[14deg] bg-gradient-to-b from-white/[0.06] to-transparent blur-2xl" />
        <div className="absolute -top-[10%] left-[44%] h-[95vh] w-28 rotate-[8deg] bg-gradient-to-b from-white/[0.045] to-transparent blur-2xl" />
        <div className="absolute -top-[10%] left-[68%] h-[95vh] w-36 rotate-[18deg] bg-gradient-to-b from-white/[0.05] to-transparent blur-2xl" />
      </motion.div>

      {/* calm caustic light */}
      <div className="glow left-[8%] top-[14%] h-[420px] w-[420px] bg-teal/12" />
      <div className="glow right-[10%] top-[40%] h-[460px] w-[460px] bg-sui/8" />

      {/* swimming life: hero only */}
      <motion.div style={{ opacity: swimmers }} className="absolute inset-0">
        {SWIMMERS.map((l, i) => (
          <Swimmer key={i} {...l} />
        ))}
      </motion.div>

      {/* gentle bubbles everywhere (subtle, calm) */}
      {BUBBLES.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white/[0.08]"
          style={{ left: b.l, bottom: -20, width: b.s, height: b.s }}
          animate={{ y: ["0vh", "-115vh"], opacity: [0, 0.4, 0] }}
          transition={{ duration: b.dur, delay: -b.phase * b.dur, repeat: Infinity, ease: "easeIn" }}
        />
      ))}

      {/* coral reef: true footer only */}
      <motion.div style={{ opacity: coralO, y: coralY }} className="absolute inset-x-0 bottom-0">
        <div className="absolute inset-x-0 bottom-0 h-[36vh] bg-gradient-to-t from-[#0a3a48]/35 to-transparent" />
        <Coral />
      </motion.div>
    </div>
  );
}

function Swimmer({ y, dir, dur, phase, scale, op, kind, color }: Lane) {
  const from = dir === 1 ? "-18vw" : "118vw";
  const to = dir === 1 ? "118vw" : "-18vw";
  return (
    <motion.div
      className="absolute left-0"
      style={{ top: y, opacity: op }}
      initial={{ x: from }}
      animate={{ x: [from, to] }}
      transition={{ duration: dur, delay: -phase * dur, repeat: Infinity, ease: "linear" }}
    >
      <div style={{ transform: `scaleX(${dir === 1 ? 1 : -1}) scale(${scale})` }}>
        <motion.div animate={{ y: [0, -12, 0, 10, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}>
          {kind === "shark" ? <Shark /> : kind === "school" ? <School color={color!} /> : <Fish color={color!} />}
        </motion.div>
      </div>
    </motion.div>
  );
}

function Fish({ color }: { color: string }) {
  return (
    <svg width="50" height="26" viewBox="0 0 64 32" fill={color}>
      <ellipse cx="28" cy="16" rx="20" ry="9" />
      <path d="M12 16 L-4 6 L-4 26 Z" />
      <path d="M30 8 Q40 -2 50 9 Z" />
      <circle cx="42" cy="14" r="1.8" fill="#04111f" />
    </svg>
  );
}

function School({ color }: { color: string }) {
  return (
    <div className="relative h-16 w-24">
      <div className="absolute left-0 top-2"><Fish color={color} /></div>
      <div className="absolute left-7 top-7"><Fish color={color} /></div>
      <div className="absolute left-12 top-0"><Fish color={color} /></div>
    </div>
  );
}

function Shark() {
  return (
    <svg width="200" height="74" viewBox="0 0 200 74" fill="#0b2733">
      <path d="M22 40 Q84 22 146 36 Q182 40 194 44 Q180 50 146 47 Q84 60 22 40 Z" />
      <path d="M80 28 L96 6 L110 32 Z" />
      <path d="M86 48 L98 66 L116 48 Z" />
      <path d="M22 40 L2 22 L11 40 L2 58 Z" />
      <circle cx="168" cy="42" r="2.2" fill="#04111f" />
    </svg>
  );
}

function Coral() {
  const weeds = [
    { x: 120, h: 150 },
    { x: 250, h: 110 },
    { x: 1180, h: 140 },
    { x: 1330, h: 105 },
  ];
  return (
    <svg viewBox="0 0 1440 320" preserveAspectRatio="xMidYMax slice" className="block h-[32vh] min-h-[210px] w-full">
      <defs>
        <linearGradient id="reefFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d3e4c" />
          <stop offset="100%" stopColor="#03141c" />
        </linearGradient>
        <linearGradient id="reefBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a2c3a" />
          <stop offset="100%" stopColor="#02101a" />
        </linearGradient>
        <linearGradient id="weed" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#14788e" />
          <stop offset="100%" stopColor="#14788e" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* back mound */}
      <path d="M0 320 L0 215 Q 360 165 720 200 T 1440 195 L1440 320 Z" fill="url(#reefBack)" />

      {/* clean branching coral (teal) */}
      <g transform="translate(420,320)" stroke="#1c8c9c" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.8">
        <path d="M0 0 C 0 -34 0 -54 0 -82" />
        <path d="M0 -38 C -12 -52 -28 -58 -38 -80" />
        <path d="M0 -50 C 14 -64 30 -68 40 -88" />
      </g>

      {/* clean branching coral (purple) */}
      <g transform="translate(1000,320)" stroke="#9b7ae0" strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7">
        <path d="M0 0 C 0 -30 0 -48 0 -70" />
        <path d="M0 -34 C 12 -48 26 -52 34 -72" />
        <path d="M0 -44 C -12 -56 -26 -60 -34 -78" />
      </g>

      {/* sea fan */}
      <g transform="translate(640,320)" opacity="0.55">
        <path d="M0 0 C -58 -44 -52 -114 0 -130 C 52 -114 58 -44 0 0 Z" fill="#e07a9c" fillOpacity="0.1" />
        <g stroke="#e07a9c" strokeWidth="3" fill="none">
          <path d="M0 0 C 0 -50 0 -90 0 -124" />
          <path d="M0 -28 C -18 -56 -30 -78 -38 -96" />
          <path d="M0 -28 C 18 -56 30 -78 38 -96" />
        </g>
      </g>

      {/* front mound */}
      <path d="M0 320 L0 250 Q 300 215 600 245 T 1200 242 T 1440 252 L1440 320 Z" fill="url(#reefFront)" />

      {/* smooth swaying seaweed */}
      {weeds.map((w, i) => (
        <motion.path
          key={i}
          d={`M${w.x} 320 C ${w.x + 20} ${320 - w.h * 0.35}, ${w.x - 20} ${320 - w.h * 0.7}, ${w.x} ${320 - w.h}`}
          stroke="url(#weed)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          style={{ transformOrigin: `${w.x}px 320px` }}
          animate={{ rotate: [-4, 4, -4] }}
          transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}
