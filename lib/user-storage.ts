import type { User } from "./types"
import { mockUser } from "./exam-data"

const STORAGE_KEY = "usmle_user_profile"

export function getUserProfile(): User {
  if (typeof window === "undefined") return mockUser

  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : mockUser
}

export function saveUserProfile(user: User): void {
  if (typeof window === "undefined") return

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))

  window.dispatchEvent(new Event("profileUpdated"))
}

export function resetUserProfile(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(STORAGE_KEY)

  window.dispatchEvent(new Event("profileUpdated"))
}
