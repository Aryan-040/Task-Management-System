"use client"

import { useState } from "react"
import { Moon, Sun, Download, FileJson, FileText, CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react"
import { useTheme } from "@/providers/ThemeProvider"
import { useTaskList } from "@/features/tasks/hooks/useTasks"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/api/tasks"

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------
function Section({ title, description, children }: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
        {children}
      </div>
    </section>
  )
}

// Row inside a section
function Row({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 bg-card">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Theme toggle — two-button segmented control
// ---------------------------------------------------------------------------
function ThemeToggleControl() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex rounded-lg border border-border overflow-hidden text-sm">
      <button
        onClick={() => theme === "dark" && toggleTheme()}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 transition-colors",
          theme === "light"
            ? "bg-primary text-primary-foreground"
            : "bg-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <Sun className="h-3.5 w-3.5" /> Light
      </button>
      <button
        onClick={() => theme === "light" && toggleTheme()}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 transition-colors",
          theme === "dark"
            ? "bg-primary text-primary-foreground"
            : "bg-transparent text-muted-foreground hover:text-foreground"
        )}
      >
        <Moon className="h-3.5 w-3.5" /> Dark
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function tasksToCSV(tasks: Task[]): string {
  const HEADERS = ["id", "title", "description", "status", "priority", "dueDate", "createdAt", "updatedAt"]
  const escape = (v: string | null) => {
    if (v === null) return ""
    const s = String(v)
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const rows = tasks.map(t =>
    HEADERS.map(h => escape((t as unknown as Record<string, string | null>)[h] ?? null)).join(",")
  )
  return [HEADERS.join(","), ...rows].join("\n")
}

// ---------------------------------------------------------------------------
// Data section
// ---------------------------------------------------------------------------
function DataSection({ tasks, total }: { tasks: Task[]; total: number }) {
  const [exportingJson, setExportingJson] = useState(false)
  const [exportingCsv, setExportingCsv] = useState(false)

  async function handleExportJSON() {
    setExportingJson(true)
    try {
      const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" })
      downloadBlob(blob, `tasks-${new Date().toISOString().slice(0, 10)}.json`)
    } finally {
      setExportingJson(false)
    }
  }

  async function handleExportCSV() {
    setExportingCsv(true)
    try {
      const blob = new Blob([tasksToCSV(tasks)], { type: "text/csv" })
      downloadBlob(blob, `tasks-${new Date().toISOString().slice(0, 10)}.csv`)
    } finally {
      setExportingCsv(false)
    }
  }

  return (
    <Section
      title="Data"
      description="Export your tasks for backup or external use."
    >
      <Row
        label="Total tasks"
        description="Tasks stored in the current server session"
      >
        <span className="text-2xl font-semibold tabular-nums text-primary">{total}</span>
      </Row>

      <Row
        label="Export as JSON"
        description="Full task data including all fields"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportJSON}
          disabled={exportingJson || total === 0}
          className="gap-2"
        >
          {exportingJson
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <FileJson className="h-3.5 w-3.5" />}
          Download JSON
        </Button>
      </Row>

      <Row
        label="Export as CSV"
        description="Comma-separated values, opens in Excel or Sheets"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          disabled={exportingCsv || total === 0}
          className="gap-2"
        >
          {exportingCsv
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <FileText className="h-3.5 w-3.5" />}
          Download CSV
        </Button>
      </Row>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Backend health indicator
// ---------------------------------------------------------------------------
function BackendStatusRow() {
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle")
  const [latency, setLatency] = useState<number | null>(null)

  async function check() {
    setStatus("checking")
    const t0 = performance.now()
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/health`
      )
      const ms = Math.round(performance.now() - t0)
      setLatency(ms)
      setStatus(res.ok ? "ok" : "error")
    } catch {
      setStatus("error")
      setLatency(null)
    }
  }

  return (
    <Row
      label="Backend API"
      description={
        status === "ok" ? `Responding (${latency} ms)` :
        status === "error" ? "Not reachable - check the backend server" :
        status === "checking" ? "Checking..." :
        "Click to test the connection"
      }
    >
      <div className="flex items-center gap-2">
        {status === "ok" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
        {status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
        <Button
          variant="outline"
          size="sm"
          onClick={check}
          disabled={status === "checking"}
          className="gap-2"
        >
          {status === "checking"
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <RefreshCw className="h-3.5 w-3.5" />}
          {status === "idle" ? "Check" : "Re-check"}
        </Button>
      </div>
    </Row>
  )
}

// ---------------------------------------------------------------------------
// About section
// ---------------------------------------------------------------------------
function AboutSection() {
  const stack = [
    { label: "Frontend", value: "Next.js 14 (App Router) + React 18" },
    { label: "Styling", value: "Tailwind CSS + shadcn/ui" },
    { label: "State", value: "TanStack Query v5" },
    { label: "Forms", value: "React Hook Form + Zod" },
    { label: "Backend", value: "Node.js + Express + TypeScript" },
    { label: "Storage", value: "In-memory (resets on restart)" },
  ]

  return (
    <Section title="About" description="TaskFlow v1.0.0">
      <BackendStatusRow />
      {stack.map(({ label, value }) => (
        <Row key={label} label={label}>
          <span className="text-sm text-muted-foreground">{value}</span>
        </Row>
      ))}
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function SettingsPage() {
  const { data, isLoading } = useTaskList({ pageSize: 10000 })
  const tasks = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <div className="p-6 md:p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage appearance, export your data, and check system status.
        </p>
      </div>

      <Separator />

      {/* Appearance */}
      <Section
        title="Appearance"
        description="Choose how TaskFlow looks on your device."
      >
        <Row label="Theme" description="Switch between light and dark mode">
          <ThemeToggleControl />
        </Row>
      </Section>

      {/* Data */}
      {isLoading ? (
        <Section title="Data">
          <Row label="Loading tasks...">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </Row>
        </Section>
      ) : (
        <DataSection tasks={tasks} total={total} />
      )}

      {/* About */}
      <AboutSection />
    </div>
  )
}
