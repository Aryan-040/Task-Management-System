"use client"

import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KanbanCard } from "./KanbanCard"
import { TaskFormDialog } from "./TaskFormDialog"
import type { Task, TaskStatus } from "@/lib/api/tasks"
import { cn } from "@/lib/utils"

export interface KanbanColumnProps {
  status: TaskStatus
  tasks: Task[]
  isLoading?: boolean
}

const LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
}
const DOTS: Record<TaskStatus, string> = {
  pending: "bg-amber-400",
  in_progress: "bg-blue-500",
  completed: "bg-emerald-500",
}

export function KanbanColumn({ status, tasks, isLoading = false }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <section
        aria-label={`${LABELS[status]} column`}
        className={cn(
          "flex flex-col rounded-xl border min-h-[400px] w-full transition-colors",
          isOver ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"
        )}
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className={cn("h-2 w-2 rounded-full shrink-0", DOTS[status])} aria-hidden="true" />
          <h2 className="text-sm font-medium">{LABELS[status]}</h2>
          <Badge variant="secondary" className="ml-auto text-xs">{tasks.length}</Badge>
        </div>

        <div
          ref={setNodeRef}
          className="flex flex-1 flex-col gap-2 p-3 overflow-y-auto"
          role="list"
          aria-label={`Tasks in ${LABELS[status]}`}
        >
          {isLoading ? (
            <div role="status" className="flex flex-1 items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">No tasks here</p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-dashed text-muted-foreground hover:text-foreground gap-1.5"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add task
              </Button>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} role="listitem">
                <KanbanCard task={task} />
              </div>
            ))
          )}
        </div>
      </section>

      <TaskFormDialog isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
