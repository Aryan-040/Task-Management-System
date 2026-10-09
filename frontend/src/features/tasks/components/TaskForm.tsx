"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { taskFormSchema, type TaskFormValues } from "@/lib/validation/taskSchema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Task } from "@/lib/api/tasks"

export interface TaskFormProps {
  task?: Task
  isSubmitting: boolean
  serverErrors?: Record<string, string>
  onSubmit: (values: TaskFormValues) => void
  onCancel: () => void
}

export function TaskForm({
  task,
  isSubmitting,
  serverErrors,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ?? undefined,
        }
      : {
          title: "",
          description: "",
          status: "pending",
          priority: "medium",
          dueDate: undefined,
        },
  })

  useEffect(() => {
    if (!serverErrors) return
    if (serverErrors.title)
      setError("title", { type: "server", message: serverErrors.title })
    if (serverErrors.description)
      setError("description", { type: "server", message: serverErrors.description })
    if (serverErrors.status)
      setError("status", { type: "server", message: serverErrors.status })
    if (serverErrors.priority)
      setError("priority", { type: "server", message: serverErrors.priority })
    if (serverErrors.dueDate)
      setError("dueDate", { type: "server", message: serverErrors.dueDate })
  }, [serverErrors, setError])

  return (
    <form
      id="task-form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-4"
    >
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="task-title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="task-title"
          placeholder="What needs to be done?"
          aria-describedby={errors.title ? "task-title-error" : undefined}
          aria-invalid={!!errors.title}
          {...register("title")}
        />
        {errors.title && (
          <p id="task-title-error" role="alert" className="text-xs text-destructive">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="task-description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="task-description"
          placeholder="Add more context or details…"
          rows={6}
          aria-describedby={errors.description ? "task-desc-error" : undefined}
          aria-invalid={!!errors.description}
          className="resize-none"
          {...register("description")}
        />
        {errors.description && (
          <p id="task-desc-error" role="alert" className="text-xs text-destructive">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="task-status">Status</Label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-status">
                  <SelectValue placeholder="Pick status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.status && (
            <p role="alert" className="text-xs text-destructive">{errors.status.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-priority">Priority</Label>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="task-priority">
                  <SelectValue placeholder="Pick priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.priority && (
            <p role="alert" className="text-xs text-destructive">{errors.priority.message}</p>
          )}
        </div>
      </div>

      {/* Due Date */}
      <div className="space-y-1.5">
        <Label htmlFor="task-due-date">
          Due date <span className="text-muted-foreground text-xs font-normal">(optional)</span>
        </Label>
        <Controller
          name="dueDate"
          control={control}
          render={({ field: { onChange, value, onBlur, ref } }) => (
            <Input
              id="task-due-date"
              ref={ref}
              type="date"
              value={value ?? ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value === "" ? undefined : e.target.value)}
              onBlur={onBlur}
              aria-describedby={errors.dueDate ? "task-due-error" : undefined}
              aria-invalid={!!errors.dueDate}
            />
          )}
        />
        {errors.dueDate && (
          <p id="task-due-error" role="alert" className="text-xs text-destructive">
            {errors.dueDate.message}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : task ? "Save changes" : "Create task"}
        </Button>
      </div>
    </form>
  )
}

