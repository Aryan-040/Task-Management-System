"use client"

import { useCallback, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useDeleteTask, taskKeys } from "../hooks/useTasks"
import { useToast } from "@/components/ui/Toast"
import { ApiError, type Task } from "@/lib/api/tasks"

export interface DeleteConfirmDialogProps {
  isOpen: boolean
  task: Task
  onClose: () => void
  onDeleted?: () => void
}

export function DeleteConfirmDialog({
  isOpen,
  task,
  onClose,
  onDeleted,
}: DeleteConfirmDialogProps) {
  const { mutateAsync, isPending } = useDeleteTask()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const handleConfirm = useCallback(async () => {
    try {
      await mutateAsync(task.id)
      showToast({ message: "Task deleted successfully", type: "success", duration: 3000 })
      onClose()
      onDeleted?.()
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        showToast({ message: "Task not found", type: "error", duration: 3000 })
        queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
        onClose()
        onDeleted?.()
      } else {
        showToast({
          message: "Failed to delete task",
          type: "error",
          duration: 3000,
        })
      }
    }
  }, [mutateAsync, task.id, showToast, onClose, onDeleted, queryClient])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete task</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-medium text-foreground">
              &ldquo;{task.title}&rdquo;
            </span>
            ? This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Deleting…" : "Delete task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

