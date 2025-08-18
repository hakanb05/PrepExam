import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
        }

        // Find user including deleted ones
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                deletedAt: true
            }
        })

        if (!user || !user.password) {
            return NextResponse.json({ userExists: false }, { status: 200 })
        }

        // Check password
        const passwordValid = await compare(password, user.password)
        if (!passwordValid) {
            return NextResponse.json({ userExists: false }, { status: 200 })
        }

        // If user exists with valid password but is deleted
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
        console.error("Error checking deleted user:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
