"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, Sun, Moon, Plus, Menu, X, CheckSquare, LayoutDashboard, ListTodo, Kanban, Settings } from "lucide-react"
import { useTheme } from "@/providers/ThemeProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TaskFormDialog } from "@/features/tasks/components/TaskFormDialog"
import { cn } from "@/lib/utils"
import Link from "next/link"

const PAGE_TITLES: Record<string, string> = {
  "/overview": "Overview",
  "/tasks": "All Tasks",
  "/board": "Board",
  "/settings": "Settings",
}

const NAV_LINKS = [
  { href: "/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/tasks", label: "All Tasks", icon: ListTodo },
  { href: "/board", label: "Board", icon: Kanban },
  { href: "/settings", label: "Settings", icon: Settings },
] as const

// ---------------------------------------------------------------------------
// Global search
// ---------------------------------------------------------------------------
function GlobalSearch({ initialValue }: { initialValue: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setValue(searchParams.get("search") ?? "")
  }, [searchParams])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      setValue(next)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const sp = new URLSearchParams(searchParams.toString())
        if (next) { sp.set("search", next) } else { sp.delete("search") }
        sp.set("page", "1")
        const qs = sp.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname)
      }, 300)
    },
    [router, pathname, searchParams]
  )

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="relative w-full max-w-xs">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" aria-hidden="true" />
      <Input
        type="search"
        placeholder="Search tasks…"
        value={value}
        onChange={handleChange}
        aria-label="Search tasks"
        className="pl-8 h-8 text-sm"
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Mobile drawer
// ---------------------------------------------------------------------------
function MobileDrawer() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col animate-in slide-in-from-left-0 duration-200"
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <span className="font-semibold text-sm">TaskFlow</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5" aria-label="Mobile navigation">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
            </nav>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TopBar
// ---------------------------------------------------------------------------
export function TopBar() {
  const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3 h-14 px-4 border-b border-border bg-card">
        <MobileDrawer />

        <span className="font-semibold text-sm hidden sm:block text-foreground">
          {PAGE_TITLES[pathname] ?? "TaskFlow"}
        </span>

        <div className="flex-1" />

        <GlobalSearch initialValue={searchParams.get("search") ?? ""} />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>

        <Button size="sm" className="gap-1.5" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          New task
        </Button>
      </div>

      <TaskFormDialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  )
}
