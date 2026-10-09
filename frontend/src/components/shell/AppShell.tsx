"use client"

import { Suspense } from "react"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"
import { Skeleton } from "@/components/ui/skeleton"
import { TooltipProvider } from "@/components/ui/tooltip"

interface AppShellProps {
  children: React.ReactNode
}

function TopBarFallback() {
  return (
    <div className="flex h-14 items-center gap-3 border-b border-border px-4" aria-hidden="true">
      <Skeleton className="h-5 w-24" />
      <div className="flex-1" />
      <Skeleton className="h-8 w-48 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-md" />
      <Skeleton className="h-8 w-28 rounded-md" />
    </div>
  )
}

export function AppShell({ children }: AppShellProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="shrink-0">
            <Suspense fallback={<TopBarFallback />}>
              <TopBar />
            </Suspense>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
