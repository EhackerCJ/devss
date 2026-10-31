"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "supreme";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback(
    ({ type, title, description }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 max-w-md w-full pointer-events-none p-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start space-x-3 rounded-lg border p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200",
              t.type === "success" && "border-emerald-500/30 bg-emerald-950/90 text-emerald-100",
              t.type === "error" && "border-red-500/30 bg-red-950/90 text-red-100",
              t.type === "info" && "border-blue-500/30 bg-blue-950/90 text-blue-100",
              t.type === "supreme" && "border-amber-500/40 bg-zinc-950/95 text-amber-200 shadow-supreme-glow"
            )}
          >
            <div className="flex-shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
              {t.type === "error" && <AlertCircle className="h-5 w-5 text-red-400" />}
              {t.type === "info" && <Info className="h-5 w-5 text-blue-400" />}
              {t.type === "supreme" && <ShieldAlert className="h-5 w-5 text-amber-400" />}
            </div>
            <div className="flex-1">
              <h5 className="text-sm font-semibold">{t.title}</h5>
              {t.description && (
                <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
