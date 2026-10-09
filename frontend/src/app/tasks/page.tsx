"use client"

import { Suspense, useState } from "react"
import { ClipboardList, Plus, RefreshCw } from "lucide-react"
import { useTaskFilters } from "@/features/tasks/hooks/useTaskFilters"
import { useTaskList } from "@/features/tasks/hooks/useTasks"
import { TaskTable } from "@/features/tasks/components/TaskTable"
import { TaskFormDialog } from "@/features/tasks/components/TaskFormDialog"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, X, ArrowUp, ArrowDown } from "lucide-react"
import type { TaskStatus, TaskPriority } from "@/lib/api/tasks"

// ---------------------------------------------------------------------------
// Inline FilterBar, SortControls, Pagination, ActiveFilterBadge for simplicity
// ---------------------------------------------------------------------------

function FilterBar({ filters }: { filters: ReturnType<typeof useTaskFilters> }) {
  const status = filters.params.status ?? "all"
  const priority = filters.params.priority ?? "all"
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={status} onValueChange={(v) => filters.setStatus(v as TaskStatus | "all")}>
        <SelectTrigger className="h-8 w-[130px] text-sm">
          <SelectValue placeholder="All status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
      <Select value={priority} onValueChange={(v) => filters.setPriority(v as TaskPriority | "all")}>
        <SelectTrigger className="h-8 w-[130px] text-sm">
          <SelectValue placeholder="All priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All priority</SelectItem>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

type SortField = "createdAt" | "dueDate" | "priority" | "title"
const SORT_FIELDS: Array<{ field: SortField; label: string }> = [
  { field: "createdAt", label: "Created" },
  { field: "dueDate", label: "Due date" },
  { field: "priority", label: "Priority" },
  { field: "title", label: "Title" },
]

function SortControls({ filters }: { filters: ReturnType<typeof useTaskFilters> }) {
  const current = (filters.params.sortBy as SortField) ?? "createdAt"
  const order = filters.params.sortOrder ?? "desc"
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Sort tasks">
      {SORT_FIELDS.map(({ field, label }) => {
        const active = current === field
        return (
          <Button
            key={field}
            variant={active ? "secondary" : "outline"}
            size="sm"
            className="h-8 gap-1"
            onClick={() => filters.setSortBy(field)}
            aria-pressed={active}
          >
            {label}
            {active && (order === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
          </Button>
        )
      })}
    </div>
  )
}

function PaginationControls({ filters, total }: { filters: ReturnType<typeof useTaskFilters>; total: number }) {
  const page = filters.params.page ?? 1
  const pageSize = filters.params.pageSize ?? 25
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (total === 0) return null
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Page <span className="font-medium text-foreground">{page}</span> of{" "}
        <span className="font-medium text-foreground">{totalPages}</span> &middot;{" "}
        <span className="font-medium text-foreground">{total}</span> tasks
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => filters.setPage(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => filters.setPage(page + 1)} disabled={page >= totalPages} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Select value={String(pageSize)} onValueChange={(v) => filters.setPageSize(Number(v))}>
          <SelectTrigger className="h-8 w-[90px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 25, 50].map(s => <SelectItem key={s} value={String(s)}>{s} / page</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inner page
// ---------------------------------------------------------------------------
function TasksContent() {
  const filters = useTaskFilters()
  const { data, isLoading, isError, refetch } = useTaskList(filters.params)
  const [createOpen, setCreateOpen] = useState(false)
  const tasks = data?.data ?? []
  const total = data?.total ?? 0

  const toolbar = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <FilterBar filters={filters} />
      <SortControls filters={filters} />
    </div>
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {toolbar}
        <TaskTable tasks={[]} isLoading />
      </div>
    )
  }

  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
        <p className="font-medium text-destructive">Failed to load tasks</p>
        <Button variant="outline" onClick={() => void refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    )
  }

  if (total === 0 && !filters.isFiltered) {
    return (
      <>
        <div className="flex flex-col items-center gap-5 rounded-xl border border-dashed border-border p-16 text-center max-w-sm mx-auto">
          <ClipboardList className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <h2 className="font-semibold">No tasks yet</h2>
            <p className="text-sm text-muted-foreground mt-1">Create your first task to get started.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" /> New task</Button>
        </div>
        <TaskFormDialog isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      </>
    )
  }

  if (total === 0 && filters.isFiltered) {
    return (
      <div className="space-y-4">
        {toolbar}
        <Button variant="outline" size="sm" className="gap-1.5" onClick={filters.clearAll}>
          <X className="h-3.5 w-3.5" /> Clear filters
        </Button>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="font-medium">No tasks match these filters</p>
          <button className="text-sm text-primary hover:underline underline-offset-4" onClick={filters.clearAll}>Clear all filters</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {toolbar}
      {filters.isFiltered && (
        <Button variant="outline" size="sm" className="gap-1.5 h-7" onClick={filters.clearAll}>
          <X className="h-3 w-3" /> Clear filters
        </Button>
      )}
      <TaskTable tasks={tasks} />
      <PaginationControls filters={filters} total={total} />
    </div>
  )
}

export default function TasksPage() {
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">All Tasks</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Browse, filter, and manage your tasks.</p>
      </div>
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <TasksContent />
      </Suspense>
    </div>
  )
}
