"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckSquare, LayoutDashboard, ListTodo, Kanban, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/tasks", label: "All Tasks", icon: ListTodo },
  { href: "/board", label: "Board", icon: Kanban },
  { href: "/settings", label: "Settings", icon: Settings },
] as const

export function Sidebar() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Main navigation"
      className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-card h-full"
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CheckSquare className="h-4 w-4" />
        </div>
        <span className="font-semibold text-sm tracking-tight">TaskFlow</span>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
