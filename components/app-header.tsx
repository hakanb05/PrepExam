"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { MobileNav } from "./mobile-nav"
import { ThemeToggle } from "./theme-toggle"

interface AppHeaderProps {
  breadcrumbs?: string[]
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  // Listen for profile refresh events
  useEffect(() => {
    const handleProfileRefresh = () => {
      setRefreshKey(prev => prev + 1)
    }

    window.addEventListener('profileRefresh', handleProfileRefresh)
    return () => window.removeEventListener('profileRefresh', handleProfileRefresh)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <header className="flex h-16 items-center justify-between border-b bg-background px-6">
        <div className="flex items-center space-x-4">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
      </header>
    )
  }

  if (!user) {
    return null
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div className="flex items-center space-x-4">
        <MobileNav />
        <div className="flex items-center space-x-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center space-x-2">
              {index > 0 && <span className="text-muted-foreground">/</span>}
              <span className={index === breadcrumbs.length - 1 ? "font-medium" : "text-muted-foreground"}>
                {crumb}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <ThemeToggle />

        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:cursor-pointer">
              <Avatar>
                <AvatarImage src={user.image || "/default-user-avatar.png"} alt={user.name} />
                <AvatarFallback>
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="hover:cursor-pointer" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
