"use client"

import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { KanbanBoard } from "@/features/tasks/components/KanbanBoard"
import { useTaskList } from "@/features/tasks/hooks/useTasks"
import { Button } from "@/components/ui/button"

const PARAMS = { pageSize: 1000 }

export default function BoardPage() {
  const { data, isLoading, isError, refetch } = useTaskList(PARAMS)

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-xl font-semibold mb-6">Board</h1>

      {isLoading && (
        <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span className="text-sm">Loading board…</span>
        </div>
      )}

      {isError && (
        <div role="alert" className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Failed to load tasks</p>
            <p className="text-sm text-muted-foreground mt-1">Something went wrong fetching board data.</p>
          </div>
          <Button variant="outline" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && (
        <KanbanBoard tasks={data?.data ?? []} isLoading={false} />
      )}
    </div>
  )
}
