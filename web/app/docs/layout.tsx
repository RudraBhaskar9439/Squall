"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

const GROUPS: { group: string; items: [string, string][] }[] = [
  { group: "Overview", items: [["/docs", "Introduction"], ["/docs/how-it-works", "How it works"]] },
  { group: "Protocol", items: [["/docs/concepts", "Core concepts"], ["/docs/risk", "Risk & methodology"]] },
  { group: "Build", items: [["/docs/developers", "For developers"], ["/docs/glossary", "Glossary"]] },
];

const ORDER: [string, string][] = GROUPS.flatMap((g) => g.items);

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const idx = ORDER.findIndex(([href]) => href === path);
  const prev = idx > 0 ? ORDER[idx - 1] : null;
  const next = idx >= 0 && idx < ORDER.length - 1 ? ORDER[idx + 1] : null;

  return (
    <main className="relative">
      <Nav />
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 sm:px-8 lg:px-16">
        <div className="grid gap-12 lg:grid-cols-[230px_1fr]">
          {/* sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-6 text-sm">
              {GROUPS.map((g) => (
                <div key={g.group}>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wide text-white/35">{g.group}</div>
                  <div className="space-y-1">
                    {g.items.map(([href, label]) => (
                      <Link
                        key={href}
                        href={href}
                        className={`block rounded-lg px-3 py-1.5 transition ${
                          path === href ? "bg-sui/10 font-medium text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* content */}
          <div className="min-w-0 max-w-3xl">
            {/* mobile section picker */}
            <div className="mb-6 flex flex-wrap gap-2 lg:hidden">
              {ORDER.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    path === href ? "border-sui/40 bg-sui/10 text-white" : "border-white/10 text-white/55"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {children}

            <div className="mt-16 flex items-center justify-between border-t border-white/10 pt-6 text-sm">
              {prev ? (
                <Link href={prev[0]} className="text-white/60 transition hover:text-white">← {prev[1]}</Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={next[0]} className="text-sui transition hover:text-aqua">{next[1]} →</Link>
              ) : (
                <span />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
