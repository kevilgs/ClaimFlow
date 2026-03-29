import { useState, useEffect } from "react"
import { LogOut, Users, Settings, FolderKanban, PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { Outlet, useLocation, useNavigate, Link } from "react-router-dom"

import { Toaster } from "../ui/sonner"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

const navItems = [
  { label: "Team Directory", icon: Users, to: "/admin" },
  { label: "Approval Rules", icon: Settings, to: "/admin/rules" },
  { label: "All Expenses", icon: FolderKanban, to: "/admin/expenses" },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role !== "admin") {
          navigate("/employee");
        }
      } catch (e) {
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);
  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  const expanded = !sidebarCollapsed
  const sidebarWidth = expanded ? "w-64" : "w-20"

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${sidebarWidth} bg-white border-r border-slate-200 text-slate-700 flex flex-col transition-[width] duration-400 ease-in-out`}
      >
        <div className={`h-16 flex items-center ${expanded ? "px-4 gap-3" : "px-2 justify-center"}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white font-semibold">
            CF
          </div>
          {expanded && (
            <div className="overflow-hidden transition-opacity duration-300">
              <p className="text-base font-semibold text-slate-900">ClaimFlow</p>
              <p className="text-xs text-slate-500">Admin Workspace</p>
            </div>
          )}
        </div>
        <TooltipProvider delayDuration={150}>
          <nav className="flex-1 overflow-y-auto px-1 sm:px-2 py-4 space-y-1">
            {navItems.map((item) => {
              const isExact = location.pathname === item.to
              const isNested = item.to !== "/admin" && location.pathname.startsWith(item.to + "/")
              const active = isExact || isNested
              const Icon = item.icon
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.to}
                      aria-label={expanded ? undefined : item.label}
                      className={`flex items-center ${expanded ? "gap-3" : "justify-center"} rounded-md px-3 py-2 text-sm transition ${active
                          ? "bg-slate-900 text-white font-medium"
                          : "hover:bg-slate-100 text-slate-800"
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      {expanded && (
                        <span className="transition-opacity duration-300 opacity-100">{item.label}</span>
                      )}
                    </Link>
                  </TooltipTrigger>
                  {!expanded && (
                    <TooltipContent side="right" align="center">
                      {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </nav>
        </TooltipProvider>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed((s) => !s)}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-100"
            >
              {expanded ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <div className="text-lg font-semibold text-slate-900">Admin</div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
}
