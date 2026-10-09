"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TaskFormDialog } from "./TaskFormDialog"
import { DeleteConfirmDialog } from "./DeleteConfirmDialog"
import type { Task } from "@/lib/api/tasks"

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(new Date(iso))
}
export function formatDate(d: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric", month: "short", day: "numeric",
  }).format(new Date(d + "T00:00:00"))
}

const STATUS: Record<Task["status"], string> = {
  pending: "Pending", in_progress: "In Progress", completed: "Completed",
}
const PRIORITY: Record<Task["priority"], string> = {
  low: "Low", medium: "Medium", high: "High",
}

export interface TaskDetailViewProps { isOpen: boolean; task: Task; onClose: () => void }

export function TaskDetailView({ isOpen, task, onClose }: TaskDetailViewProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-8 leading-snug">{task.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{task.description}</p>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={task.status}>{STATUS[task.status]}</Badge>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Priority</p>
                <Badge variant={task.priority}>{PRIORITY[task.priority]}</Badge>
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Due date</p>
              <p className="text-sm">{task.dueDate ? formatDate(task.dueDate) : <em className="italic text-muted-foreground/60">No due date</em>}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div><p className="mb-0.5">Created</p><p>{formatDateTime(task.createdAt)}</p></div>
              <div><p className="mb-0.5">Updated</p><p>{formatDateTime(task.updatedAt)}</p></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDelete(true)}>Delete</Button>
            <Button size="sm" onClick={() => setShowEdit(true)}>Edit task</Button>
          </div>
        </DialogContent>
      </Dialog>
      <TaskFormDialog isOpen={showEdit} task={task} onClose={() => { setShowEdit(false); onClose() }} />
      <DeleteConfirmDialog isOpen={showDelete} task={task} onClose={() => setShowDelete(false)} onDeleted={() => { setShowDelete(false); onClose() }} />
    </>
  )
}

