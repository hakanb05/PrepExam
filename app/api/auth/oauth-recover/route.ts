import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const { email, name, image } = await request.json()

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 })
        }

        // Find deleted user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                deletedAt: true
            }
        })

        if (!user || !user.deletedAt) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 })
        }

        // Restore account with OAuth data
        await prisma.user.update({
            where: { email },
            data: {
                name: name || user.name,
                image: image || null,
                verified: true, // OAuth accounts are verified
                deletedAt: null
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Error recovering OAuth account:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
