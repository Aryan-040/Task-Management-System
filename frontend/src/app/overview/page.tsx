"use client"

import { useRef, useEffect, useState } from "react"
import { useTaskList } from "@/features/tasks/hooks/useTasks"
import { isOverdue } from "@/features/tasks/components/OverdueLabel"
import { TaskFormDialog } from "@/features/tasks/components/TaskFormDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList, Plus, AlertCircle, RefreshCw } from "lucide-react"
import type { Task } from "@/lib/api/tasks"

const PARAMS = { pageSize: 1000 }

function fmt(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso + "T00:00:00"))
}
function fmtTs(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(iso))
}
function trunc(s: string, n = 80) { return s.length > n ? s.slice(0, n) + "…" : s }

const S_LABELS: Record<Task["status"], string> = { pending: "Pending", in_progress: "In Progress", completed: "Completed" }
const P_LABELS: Record<Task["priority"], string> = { low: "Low", medium: "Medium", high: "High" }

function MetricCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-3xl font-semibold tabular-nums ${accent ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

function TaskRow({ task }: { task: Task }) {
  return (
    <div className="px-4 py-3.5 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors space-y-1.5">
      {/* Row 1: title + priority badge on the right */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <p className="text-sm font-semibold leading-snug text-foreground truncate flex-1 min-w-0">
          {task.title}
        </p>
        <Badge variant={task.priority} aria-label={`Priority: ${P_LABELS[task.priority]}`} className="shrink-0">
          {P_LABELS[task.priority]}
        </Badge>
      </div>
      {/* Row 2: description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">
        {task.description}
      </p>
      {/* Row 3: status + dates */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-0.5">
        <Badge variant={task.status} aria-label={`Status: ${S_LABELS[task.status]}`}>
          {S_LABELS[task.status]}
        </Badge>
        <span className="flex items-center gap-1">
          {task.dueDate ? <>Due {fmt(task.dueDate)}</> : "No due date"}
        </span>
        <span className="text-muted-foreground/50 hidden sm:inline">|</span>
        <span className="text-muted-foreground/60 hidden sm:inline">Created {fmtTs(task.createdAt)}</span>
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const { data, isLoading, isError, refetch } = useTaskList(PARAMS)
  const [createOpen, setCreateOpen] = useState(false)
  const retryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => { if (isError) retryRef.current?.focus() }, [isError])

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-8">
        <h1 className="text-xl font-semibold">Overview</h1>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-5 pb-4 space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-8 w-14" />
            </CardContent></Card>
          ))}
        </div>
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-semibold mb-6">Overview</h1>
        <div role="alert" className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center max-w-sm mx-auto">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium">Failed to load dashboard</p>
            <p className="text-sm text-muted-foreground mt-1">Check your connection and try again.</p>
          </div>
          <Button ref={retryRef} variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  const tasks = data?.data ?? []
  const total = data?.total ?? 0
  const completed = tasks.filter(t => t.status === "completed").length
  const inProgress = tasks.filter(t => t.status === "in_progress").length
  const overdue = tasks.filter(t => isOverdue(t.dueDate, t.status)).length
  const rate = total === 0 ? "0%" : `${((completed / total) * 100).toFixed(0)}%`

  if (total === 0) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-semibold mb-6">Overview</h1>
        <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-border p-16 text-center max-w-sm mx-auto">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h2 className="font-semibold">No tasks yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Create your first task to get started.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> New task
          </Button>
        </div>
        <TaskFormDialog isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <h1 className="text-xl font-semibold">Overview</h1>

      <section aria-label="Task metrics">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard label="Total" value={total} />
          <MetricCard label="Completed" value={completed} accent="text-emerald-600 dark:text-emerald-400" />
          <MetricCard label="In Progress" value={inProgress} accent="text-blue-600 dark:text-blue-400" />
          <MetricCard label="Overdue" value={overdue} accent={overdue > 0 ? "text-red-500 dark:text-red-400" : ""} />
          <MetricCard label="Done rate" value={rate} accent="text-primary" />
        </div>
      </section>

      <section aria-label="All tasks">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">All tasks ({total})</h2>
        <div className="space-y-1.5">
          {tasks.map(t => <TaskRow key={t.id} task={t} />)}
        </div>
      </section>
    </div>
  )
}
