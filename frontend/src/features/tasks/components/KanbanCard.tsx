"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Task } from "@/lib/api/tasks"

export interface KanbanCardProps { task: Task }

function formatDue(d: string | null) {
  if (!d) return null
  const [y, m, day] = d.split("-").map(Number)
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, day)))
}

const P_LABELS: Record<Task["priority"], string> = {
  low: "Low", medium: "Medium", high: "High",
}

// ---------------------------------------------------------------------------
// CardContent — pure visual, used by both KanbanCard and the DragOverlay
// ---------------------------------------------------------------------------
export function KanbanCardContent({ task }: KanbanCardProps) {
  return (
    <>
      <p className="text-sm font-medium leading-snug break-words">{task.title}</p>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <Badge variant={task.priority} aria-label={`Priority: ${P_LABELS[task.priority]}`}>
          {P_LABELS[task.priority]}
        </Badge>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
          {formatDue(task.dueDate) ?? "No due date"}
        </span>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// KanbanCard — attaches drag handle; fades out while being dragged so the
// DragOverlay (which portals to document root) is the only visible copy
// ---------------------------------------------------------------------------
export function KanbanCard({ task }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      aria-roledescription="Draggable task"
      aria-label={`Task: ${task.title}`}
      className={cn(
        "rounded-lg border bg-card p-3 cursor-grab active:cursor-grabbing select-none",
        "hover:shadow-sm transition-shadow",
        // While dragging: make the original a transparent ghost placeholder;
        // the DragOverlay renders the actual floating card above everything.
        isDragging && "opacity-30 pointer-events-none"
      )}
    >
      <KanbanCardContent task={task} />
    </div>
  )
}
