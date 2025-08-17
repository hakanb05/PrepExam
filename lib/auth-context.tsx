"use client"

import { createContext, useContext } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

interface AuthContextType {
  user: any
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  loginWithOAuth: (provider: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  forgotPassword: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,   // <<< belangrijk
      })
      // res kan { ok, status, error, url } bevatten
      if (res?.error) return false
      // geen redirect door NextAuth → jij beslist:
      return true
    } catch (e) {
      console.error("Login error:", e)
      return false
    }
  }

  const loginWithOAuth = async (provider: string): Promise<boolean> => {
    // Eenvoudigste: laat provider redirecten
    await signIn(provider, { callbackUrl: "/" }) // redirect = true (default)
    return true
    // Als je error‑handling wil zonder hard redirect:
    // const res = await signIn(provider, { redirect: false })
    // if (res?.error) return false
    // if (res?.url) router.push(res.url)
    // return true
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) return false

      // Mark this as a new registration
      localStorage.setItem('justRegistered', 'true')

      // direct inloggen na registratie, ook zonder auto-redirect
      const ok = await login(email, password)
      return ok
    } catch (e) {
      console.error("Registration error:", e)
      return false
    }
  }


  const logout = () => signOut({ redirect: true, callbackUrl: "/login" })
  const forgotPassword = async () => true

  // Debug logging
  console.log("Auth context:", {
    session: session?.user,
    isAuthenticated: !!session?.user,
    isLoading: status === "loading"
  })

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        isLoading: status === "loading",
        login,
        loginWithOAuth,
        register,
        logout,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}