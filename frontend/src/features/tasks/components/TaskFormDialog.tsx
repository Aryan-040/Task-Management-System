"use client"

import * as React from "react"
import { useEffect, useRef, useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { taskKeys, useCreateTask, useUpdateTask } from "../hooks/useTasks"
import { useToast } from "@/components/ui/Toast"
import { ApiError, type Task } from "@/lib/api/tasks"
import { TaskForm } from "./TaskForm"
import type { TaskFormValues } from "@/lib/validation/taskSchema"

export interface TaskFormDialogProps {
  isOpen: boolean
  task?: Task
  onClose: () => void
}

export function TaskFormDialog({ isOpen, task, onClose }: TaskFormDialogProps) {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const [serverErrors, setServerErrors] = useState<Record<string, string> | undefined>()

  const isSubmitting = createTask.isPending || updateTask.isPending
  const isEditMode = !!task

  // Reset server errors when dialog opens/closes
  useEffect(() => {
    if (!isOpen) setServerErrors(undefined)
  }, [isOpen])

  const handleSubmit = useCallback(
    async (values: TaskFormValues) => {
      setServerErrors(undefined)
      try {
        if (isEditMode && task) {
          await updateTask.mutateAsync({
            id: task.id,
            input: {
              title: values.title,
              description: values.description,
              status: values.status,
              priority: values.priority,
              dueDate: values.dueDate ?? null,
            },
          })
          queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
          showToast({
            message: "Task updated successfully",
            type: "success",
            duration: 5000,
          })
        } else {
          await createTask.mutateAsync({
            title: values.title,
            description: values.description,
            status: values.status,
            priority: values.priority,
            dueDate: values.dueDate ?? null,
          })
          showToast({
            message: "Task created successfully",
            type: "success",
            duration: 5000,
          })
        }
        onClose()
      } catch (err) {
        if (err instanceof ApiError && err.status === 400 && err.errors) {
          setServerErrors(err.errors)
        } else {
          showToast({
            message:
              err instanceof ApiError
                ? err.message
                : "Something went wrong. Please try again.",
            type: "error",
            duration: 3000,
          })
        }
      }
    },
    [isEditMode, task, createTask, updateTask, queryClient, showToast, onClose]
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit task" : "New task"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the task details below."
              : "Fill in the details to create a new task."}
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          task={task}
          isSubmitting={isSubmitting}
          serverErrors={serverErrors}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}
