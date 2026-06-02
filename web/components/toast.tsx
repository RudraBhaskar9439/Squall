"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";

type Variant = "success" | "error" | "info";
type Toast = { id: number; title: string; desc?: string; href?: string; variant: Variant };

const ToastCtx = createContext<{ push: (t: Omit<Toast, "id">) => void }>({ push: () => {} });
export const useToast = () => useContext(ToastCtx);

const accent: Record<Variant, string> = {
  success: "border-teal/40",
  error: "border-rose-500/40",
  info: "border-sui/40",
};
const dot: Record<Variant, string> = {
  success: "bg-teal",
  error: "bg-rose-500",
  info: "bg-sui",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { ...t, id }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 9000);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex w-[min(92vw,360px)] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className={`rounded-2xl border ${accent[t.variant]} bg-ink-2/90 p-4 shadow-xl backdrop-blur`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot[t.variant]}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">{t.title}</div>
                  {t.desc && <div className="mt-0.5 text-xs text-white/55">{t.desc}</div>}
                  {t.href && (
                    <a
                      href={t.href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-sui hover:text-aqua"
                    >
                      View on Suiscan ↗
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
