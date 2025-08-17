import { PrismaClient } from "@prisma/client"
const g = globalThis as any
export const prisma: PrismaClient = g.__prisma__ ?? new PrismaClient({ log: ["error"] })
if (!g.__prisma__) g.__prisma__ = prisma
