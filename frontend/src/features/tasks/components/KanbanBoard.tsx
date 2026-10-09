"use client"

import { useCallback, useEffect, useState } from "react"
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import type { Task, TaskStatus } from "@/lib/api/tasks"
import { useUpdateTask } from "../hooks/useTasks"
import { useToast } from "@/components/ui/Toast"
import { KanbanColumn } from "./KanbanColumn"
import { KanbanCardContent } from "./KanbanCard"
import { cn } from "@/lib/utils"

export interface KanbanBoardProps {
  tasks: Task[]
  isLoading?: boolean
}

const COLUMNS: TaskStatus[] = ["pending", "in_progress", "completed"]

export function KanbanBoard({ tasks, isLoading = false }: KanbanBoardProps) {
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>(tasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  useEffect(() => {
    setOptimisticTasks(tasks)
  }, [tasks])

  const updateTask = useUpdateTask()
  const { showToast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 4px movement before drag starts — prevents accidental drags on click
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor),
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = optimisticTasks.find((t) => t.id === event.active.id)
      setActiveTask(task ?? null)
    },
    [optimisticTasks],
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTask(null)

      const { active, over } = event
      if (!over || active.id === over.id) return

      const newStatus = over.id as TaskStatus
      const task = optimisticTasks.find((t) => t.id === active.id)
      if (!task || task.status === newStatus) return

      const previousTasks = optimisticTasks
      setOptimisticTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)),
      )

      try {
        await updateTask.mutateAsync({
          id: task.id,
          input: {
            title: task.title,
            description: task.description,
            status: newStatus,
            priority: task.priority,
            dueDate: task.dueDate,
          },
        })
      } catch {
        setOptimisticTasks(previousTasks)
        showToast({
          message: "Failed to update task status",
          type: "error",
          duration: 3000,
        })
      }
    },
    [optimisticTasks, updateTask, showToast],
  )

  const handleDragCancel = useCallback(() => {
    setActiveTask(null)
  }, [])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={optimisticTasks.filter((t) => t.status === status)}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/*
        DragOverlay portals the dragged card to document.body, completely
        outside the column stacking contexts, so it always paints on top.
        The original KanbanCard renders as a ghost (opacity-30) in-column.
      */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div
            className={cn(
              "rounded-lg border bg-card p-3 select-none",
              "shadow-xl ring-2 ring-primary/40",
              "cursor-grabbing rotate-1 scale-105",
            )}
          >
            <KanbanCardContent task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
