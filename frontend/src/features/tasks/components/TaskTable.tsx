"use client"

import { useState } from "react"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Eye, Pencil, Trash2, AlertCircle, Clock, Loader2 } from "lucide-react"
import { TaskFormDialog } from "./TaskFormDialog"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"
import { TaskDetailView } from "./TaskDetailView"
import { isOverdue } from "./OverdueLabel"
import { isDueSoon } from "./DueSoonLabel"
import { useUpdateTask } from "../hooks/useTasks"
import { useToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/api/tasks"

// ---------------------------------------------------------------------------
// Color maps — pill-dropdown style, one set per variant
// ---------------------------------------------------------------------------
const STATUS_STYLES: Record<Task["status"], string> = {
  pending:     "bg-amber-100   text-amber-800   border-amber-200   dark:bg-amber-900/30  dark:text-amber-300  dark:border-amber-700",
  in_progress: "bg-blue-100    text-blue-800    border-blue-200    dark:bg-blue-900/30   dark:text-blue-300   dark:border-blue-700",
  completed:   "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
}
const PRIORITY_STYLES: Record<Task["priority"], string> = {
  low:    "bg-slate-100  text-slate-700  border-slate-200  dark:bg-slate-800      dark:text-slate-300  dark:border-slate-600",
  medium: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30  dark:text-orange-300 dark:border-orange-700",
  high:   "bg-red-100    text-red-800    border-red-200    dark:bg-red-900/30     dark:text-red-300    dark:border-red-700",
}

const STATUS_LABELS: Record<Task["status"], string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
}
const PRIORITY_LABELS: Record<Task["priority"], string> = {
  low: "Low", medium: "Medium", high: "High",
}

// ---------------------------------------------------------------------------
// Shared pill trigger class — looks like a compact colored select box
// ---------------------------------------------------------------------------
const PILL_TRIGGER =
  "h-7 rounded-md border px-2.5 pr-1.5 text-xs font-medium gap-1 " +
  "shadow-none focus:ring-1 focus:ring-offset-0 " +
  "transition-opacity disabled:opacity-60 w-auto"

// ---------------------------------------------------------------------------
// InlineStatusSelect
// ---------------------------------------------------------------------------
function InlineStatusSelect({ task }: { task: Task }) {
  const updateTask = useUpdateTask()
  const { showToast } = useToast()
  const [optimistic, setOptimistic] = useState<Task["status"]>(task.status)
  const [saving, setSaving] = useState(false)

  async function handleChange(value: string) {
    const next = value as Task["status"]
    if (next === optimistic) return
    const prev = optimistic
    setOptimistic(next)
    setSaving(true)
    try {
      await updateTask.mutateAsync({
        id: task.id,
        input: {
          title: task.title,
          description: task.description,
          status: next,
          priority: task.priority,
          dueDate: task.dueDate,
        },
      })
    } catch {
      setOptimistic(prev)
      showToast({ message: "Failed to update status", type: "error", duration: 3000 })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Select value={optimistic} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger
        className={cn(PILL_TRIGGER, STATUS_STYLES[optimistic])}
        aria-label={`Status: ${STATUS_LABELS[optimistic]}`}
      >
        {saving
          ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
          : <SelectValue>{STATUS_LABELS[optimistic]}</SelectValue>}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="in_progress">In Progress</SelectItem>
        <SelectItem value="completed">Completed</SelectItem>
      </SelectContent>
    </Select>
  )
}

// ---------------------------------------------------------------------------
// InlinePrioritySelect
// ---------------------------------------------------------------------------
function InlinePrioritySelect({ task }: { task: Task }) {
  const updateTask = useUpdateTask()
  const { showToast } = useToast()
  const [optimistic, setOptimistic] = useState<Task["priority"]>(task.priority)
  const [saving, setSaving] = useState(false)

  async function handleChange(value: string) {
    const next = value as Task["priority"]
    if (next === optimistic) return
    const prev = optimistic
    setOptimistic(next)
    setSaving(true)
    try {
      await updateTask.mutateAsync({
        id: task.id,
        input: {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: next,
          dueDate: task.dueDate,
        },
      })
    } catch {
      setOptimistic(prev)
      showToast({ message: "Failed to update priority", type: "error", duration: 3000 })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Select value={optimistic} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger
        className={cn(PILL_TRIGGER, PRIORITY_STYLES[optimistic])}
        aria-label={`Priority: ${PRIORITY_LABELS[optimistic]}`}
      >
        {saving
          ? <Loader2 className="h-3 w-3 animate-spin shrink-0" />
          : <SelectValue>{PRIORITY_LABELS[optimistic]}</SelectValue>}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="high">High</SelectItem>
      </SelectContent>
    </Select>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric",
  }).format(new Date(`${iso}T00:00:00`))
}

function truncate(s: string, n = 90) {
  return s.length > n ? `${s.slice(0, n)}...` : s
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------
function TaskTableRow({ task }: { task: Task }) {
  const [view, setView] = useState(false)
  const [edit, setEdit] = useState(false)
  const [del, setDel] = useState(false)
  const overdue = isOverdue(task.dueDate, task.status)
  const dueSoon = isDueSoon(task.dueDate, task.status)

  return (
    <>
      <TableRow>
        <TableCell className="font-medium max-w-[180px]">
          <span className="line-clamp-1">{task.title}</span>
        </TableCell>
        <TableCell className="text-muted-foreground max-w-[220px] hidden sm:table-cell">
          <span className="line-clamp-1 text-sm">{truncate(task.description)}</span>
        </TableCell>
        <TableCell>
          <InlineStatusSelect task={task} />
        </TableCell>
        <TableCell>
          <InlinePrioritySelect task={task} />
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="flex flex-col gap-0.5">
            {task.dueDate ? (
              <span className="text-sm">{formatDate(task.dueDate)}</span>
            ) : (
              <span className="text-sm text-muted-foreground/60 italic">No due date</span>
            )}
            {overdue && (
              <span className="inline-flex items-center gap-1 text-xs text-red-500 dark:text-red-400 font-medium">
                <AlertCircle className="h-3 w-3" /> Overdue
              </span>
            )}
            {dueSoon && !overdue && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400 font-medium">
                <Clock className="h-3 w-3" /> Due soon
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setView(true)} aria-label={`View ${task.title}`}>
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEdit(true)} aria-label={`Edit ${task.title}`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDel(true)} aria-label={`Delete ${task.title}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </div>
        </TableCell>
      </TableRow>

      <TaskDetailView isOpen={view} task={task} onClose={() => setView(false)} />
      <TaskFormDialog isOpen={edit} task={task} onClose={() => setEdit(false)} />
      <DeleteConfirmDialog isOpen={del} task={task} onClose={() => setDel(false)} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <TableRow aria-hidden="true" data-testid="skeleton-row">
      {[180, 220, 80, 70, 100, 70].map((w, i) => (
        <TableCell key={i}>
          <Skeleton className="h-4 rounded" style={{ width: `${w}px`, maxWidth: "100%" }} />
        </TableCell>
      ))}
    </TableRow>
  )
}

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------
export interface TaskTableProps {
  tasks: Task[]
  isLoading?: boolean
}

export function TaskTable({ tasks, isLoading = false }: TaskTableProps) {
  return (
    <TooltipProvider delayDuration={400}>
      <div className="-mx-0 overflow-x-auto rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="text-xs">Title</TableHead>
              <TableHead className="text-xs hidden sm:table-cell">Description</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Priority</TableHead>
              <TableHead className="text-xs hidden md:table-cell">Due date</TableHead>
              <TableHead className="text-xs w-28">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : tasks.map((t) => <TaskTableRow key={t.id} task={t} />)}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  )
}
