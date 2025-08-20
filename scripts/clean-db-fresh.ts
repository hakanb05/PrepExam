// scripts/clean-db-fresh.ts
import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    console.log("🧹 Completely cleaning database...")

    // Delete EVERYTHING in correct order (due to foreign key constraints)
    await prisma.response.deleteMany()
    await prisma.attemptSection.deleteMany()
    await prisma.attempt.deleteMany()
    await prisma.purchase.deleteMany()
    await prisma.account.deleteMany()
    await prisma.session.deleteMany()
    await prisma.user.deleteMany()

    // Delete exam data too
    await prisma.option.deleteMany()
    await prisma.questionCategory.deleteMany()
    await prisma.question.deleteMany()
    await prisma.section.deleteMany()
    await prisma.exam.deleteMany()

    console.log("✅ Database completely cleared")

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

    console.log("🎉 Fresh database setup complete!")
    console.log("📝 Next steps:")
    console.log("   1. Run: npx prisma db seed")
    console.log("   2. User can login and purchase exam")
    console.log("   3. User has NO previous attempts or purchases yet")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
