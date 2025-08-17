// lib/auth-logic.ts
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.password) return null
  const ok = await compare(password, user.password)
  return ok ? user : null
}
