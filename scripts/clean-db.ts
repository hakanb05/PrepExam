// scripts/clean-db.ts
import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🧹 Cleaning database...")

    // Delete in order (due to foreign key constraints)
    await prisma.response.deleteMany()
    await prisma.attemptSection.deleteMany()
    await prisma.attempt.deleteMany()
    await prisma.purchase.deleteMany()
    await prisma.account.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    console.log("✅ Deleted all user data")

    // Create test user Hakan
    const hashedPassword = await hash("Kaas38!", 12)

    const testUser = await prisma.user.create({
        data: {
            id: "hakan-test-id",
            email: "hakanbektas934@gmail.com",
            name: "Hakan",
            password: hashedPassword,
            verified: true,
        },
    })

    console.log("👤 Created test user:", testUser.email)

    // Give Hakan access to NBME 20A exam
    const purchase = await prisma.purchase.create({
        data: {
            userId: testUser.id,
            examId: "nbme20a",
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        },
    })

    console.log("💳 Created purchase for exam:", purchase.examId)
    console.log("🎉 Database reset complete!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
