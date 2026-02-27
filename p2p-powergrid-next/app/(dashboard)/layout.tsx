"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LayoutDashboard, Wallet, Zap, LogOut, Grid, BarChart3 } from "lucide-react"
import { getToken, removeToken } from "@/lib/api"
import { NetworkStatus } from "@/components/layout/network-status"
import { ErrorBoundary } from "@/components/error-boundary"
import { PageTransition } from "@/components/page-transition"
import { cn } from "@/lib/utils"

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/market", icon: Grid, label: "Market" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/forecast", icon: BarChart3, label: "Forecast" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = getToken()
    if (!token || isTokenExpired(token)) {
      removeToken()
      router.replace("/login")
    }
  }, [router])

  function handleLogout() {
    removeToken()
    router.replace("/login")
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-100 flex-shrink-0 fixed h-full z-20 hidden md:flex flex-col justify-between transition-all duration-300">
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-50">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
              <Zap className="w-5 h-5" />
            </div>
            <span className="ml-3 font-semibold text-lg hidden lg:block">PowerGrid</span>
          </div>

          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full flex items-center justify-center lg:justify-start p-3 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                  <span className="ml-3 text-sm font-medium hidden lg:block">{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-50">
          <div className="hidden lg:block mb-6">
            <NetworkStatus />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center lg:justify-start w-full p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3 text-sm font-medium hidden lg:block">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-50 flex justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "p-2 rounded-xl transition-all",
                isActive ? "bg-slate-900 text-white" : "text-slate-400"
              )}
            >
              <item.icon className="w-6 h-6" />
            </button>
          )
        })}
        <button onClick={handleLogout} className="p-2 text-slate-400">
          <LogOut className="w-6 h-6" />
        </button>
      </div>

      <main className="flex-1 md:pl-20 lg:pl-64 p-6 lg:p-10 max-w-7xl mx-auto w-full pb-24 md:pb-10">
        <ErrorBoundary>
          <PageTransition>
            {children}
          </PageTransition>
        </ErrorBoundary>
      </main>
    </div>
  )
}
