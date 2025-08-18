import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json()

        if (!email) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 })
        }

        // Check if user exists and is deleted
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                deletedAt: true
            }
        })

        if (!user) {
            return NextResponse.json({ userExists: false }, { status: 200 })
        }

        if (user.deletedAt) {
            return NextResponse.json({
                userExists: true,
                isDeleted: true,
                userName: user.name
            }, { status: 200 })
        }

        // User exists and is not deleted
        return NextResponse.json({
            userExists: true,
            isDeleted: false
        }, { status: 200 })

    } catch (error) {
        console.error("Error checking OAuth deleted user:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
