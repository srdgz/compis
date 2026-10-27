import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { cx } from "@/shared/lib/format";

type Kind = "success" | "error";

interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const SUCCESS_TIMEOUT_MS = 8000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const push = useCallback(
    (kind: Kind, message: string) => {
      const id = Date.now() + Math.random();
      setItems((current) => [...current, { id, kind, message }]);
      if (kind === "success") window.setTimeout(() => dismiss(id), SUCCESS_TIMEOUT_MS);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:items-end">
        {items.map((item) => (
          <div
            key={item.id}
            role={item.kind === "error" ? "alert" : "status"}
            className={cx(
              "flex w-full max-w-md items-start gap-3 rounded-xl border-2 bg-surface px-4 py-3 shadow-lg",
              item.kind === "error" ? "border-danger" : "border-brand",
            )}
          >
            <p className="flex-1">{item.message}</p>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="min-h-6 min-w-6 font-semibold underline"
            >
              Cerrar
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
