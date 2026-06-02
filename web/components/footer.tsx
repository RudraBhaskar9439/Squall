import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
        <div>
          <span className="text-aqua">◆</span> Strata · built for Sui Overflow 2026
        </div>
        <div className="flex gap-6">
          <Link href="/#how" className="transition hover:text-white">How it works</Link>
          <Link href="/#features" className="transition hover:text-white">Features</Link>
          <Link href="/vault" className="transition hover:text-white">Vault</Link>
          <Link href="/vault#proof" className="transition hover:text-white">Proof</Link>
        </div>
      </div>
    </footer>
  );
}
