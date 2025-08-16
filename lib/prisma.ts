import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"], // standaard logging
})

// Debug helper: voeg context toe aan queries
function logWithContext(action: string, query: string) {
  console.log(`🟢 [Prisma Action] ${action}`)
  console.log(`   SQL: ${query}\n`)
}

// Event listener voor alle queries
prisma.$on("query", (e) => {
  // Hier kun je heuristieken toevoegen
  if (e.query.includes(`FROM "public"."User"`)) {
    logWithContext("Fetching user (probably during login/session)", e.query)
  } else if (e.query.includes(`FROM "public"."Account"`)) {
    logWithContext("Checking OAuth account link", e.query)
  } else if (e.query.startsWith("INSERT INTO")) {
    logWithContext("Creating new record", e.query)
  } else if (e.query.startsWith("UPDATE")) {
    logWithContext("Updating record", e.query)
  } else if (e.query.startsWith("DELETE")) {
    logWithContext("Deleting record", e.query)
  } else {
    logWithContext("Other Prisma query", e.query)
  }
})

export { prisma }
