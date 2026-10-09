"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { X, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = "success" | "error"

interface ToastEntry { id: string; message: string; type: ToastType; duration: number }
export interface ToastOptions { message: string; type: ToastType; duration?: number }
interface ToastContextValue { showToast: (opts: ToastOptions) => void }

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

function ToastItem({ entry, onDismiss }: { entry: ToastEntry; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(entry.id), entry.duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [entry.id, entry.duration, onDismiss])

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto",
        "min-w-[280px] max-w-sm text-sm font-medium border",
        entry.type === "success"
          ? "bg-card border-emerald-200 dark:border-emerald-800/50 text-foreground"
          : "bg-card border-red-200 dark:border-red-800/50 text-foreground"
      )}
    >
      {entry.type === "success"
        ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" aria-hidden="true" />
        : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" aria-hidden="true" />
      }
      <span className="flex-1">{entry.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(entry.id)}
        aria-label="Dismiss"
        className="shrink-0 text-muted-foreground/60 hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])

  const showToast = useCallback(({ message, type, duration = 3000 }: ToastOptions) => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev, { id, message, type, duration }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div role="region" aria-label="Notifications" className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(entry => <ToastItem key={entry.id} entry={entry} onDismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within a ToastProvider")
  return ctx
}
