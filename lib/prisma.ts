import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

afterAll(async () => {
  await prisma.$disconnect()
})
