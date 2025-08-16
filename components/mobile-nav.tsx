"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Home, BookOpen, BarChart3, User, Settings, LogOut, Sun, Moon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"

const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Exams",
    url: "/exams",
    icon: BookOpen,
  },
  {
    title: "Results",
    url: "/results",
    icon: BarChart3,
  },
  {
    title: "My Profile",
    url: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const { logout, user } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
    router.push("/login")
    setOpen(false)
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="flex flex-col h-full">
          <div className="flex items-center space-x-2 px-2 py-4 border-b">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">U</span>
            </div>
            <span className="font-semibold">USMLE Practice</span>
          </div>

          <nav className="flex-1 py-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.title}
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </a>
              ))}
            </div>
          </nav>

          {user && (
            <div className="border-t pt-4 pb-4">
              <div className="px-3 py-2 mb-2">
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>

              <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start px-3 mb-2">
                {theme === "light" ? <Moon className="mr-3 h-4 w-4" /> : <Sun className="mr-3 h-4 w-4" />}
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </Button>

              <Button variant="ghost" onClick={handleLogout} className="w-full justify-start px-3">
                <LogOut className="mr-3 h-4 w-4" />
                Log Out
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
