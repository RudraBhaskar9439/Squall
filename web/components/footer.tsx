export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/40 sm:flex-row">
        <div>
          <span className="text-aqua">◆</span> Strata · built for Sui Overflow 2026
        </div>
        <div className="flex gap-6">
          <a href="#how" className="transition hover:text-white">How it works</a>
          <a href="#features" className="transition hover:text-white">Features</a>
          <a href="#vault" className="transition hover:text-white">Vault</a>
        </div>
      </div>
    </footer>
  );
}
