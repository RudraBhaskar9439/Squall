import type { ReactNode } from "react";

export function DocTitle({ children }: { children: ReactNode }) {
  return <h1 className="text-gradient text-3xl font-semibold tracking-tight sm:text-4xl">{children}</h1>;
}

export function Lead({ children }: { children: ReactNode }) {
  return <p className="mt-4 text-lg leading-relaxed text-white/70">{children}</p>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-4 leading-relaxed text-white/65">{children}</p>;
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-12 text-xl font-semibold text-white">{children}</h2>;
}

export function Code({ children }: { children: string }) {
  return (
    <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-white/75">
      <code>{children}</code>
    </pre>
  );
}

export function Step({ n, t, children }: { n: string; t: string; children: ReactNode }) {
  return (
    <li className="flex gap-4 rounded-xl border border-white/10 bg-[#0b2a40]/30 p-4">
      <span className="font-mono text-sm text-sui">{n}</span>
      <span>
        <b className="text-white">{t}</b> — <span className="text-white/60">{children}</span>
      </span>
    </li>
  );
}

export function Concept({ t, children }: { t: string; children: ReactNode }) {
  return (
    <div className="mt-8 first:mt-6">
      <h3 className="text-lg font-semibold text-white">{t}</h3>
      <p className="mt-1.5 leading-relaxed text-white/65">{children}</p>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-xl border border-sui/25 bg-sui/5 p-4 text-sm leading-relaxed text-white/70">
      {children}
    </div>
  );
}
