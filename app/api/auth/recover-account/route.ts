import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
        }

        // Find deleted user
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                password: true,
                deletedAt: true
            }
        })

        if (!user || !user.password || !user.deletedAt) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 })
        }

        // Verify password
        const passwordValid = await compare(password, user.password)
        if (!passwordValid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
        }

        // Restore account
        await prisma.user.update({
            where: { email },
            data: {
                deletedAt: null
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Error recovering account:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
