import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth-options"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user ID from email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Get analytics across all exams (global statistics, not user-specific)
        const totalPurchases = await prisma.purchase.count({
            where: {
                canceledAt: null
            }
        })

        const currentValidAccess = await prisma.purchase.count({
            where: {
                canceledAt: null,
                expiresAt: {
                    gt: new Date()
                }
            }
        })

        const totalAttempts = await prisma.attempt.count({
            where: {
                finishedAt: { not: null }
            }
        })

        const uniqueUsersAttempted = await prisma.attempt.groupBy({
            by: ['userId'],
            where: {
                finishedAt: { not: null }
            },
            _count: {
                userId: true
            }
        })

        return NextResponse.json({
            totalPurchases,
            currentValidAccess,
            totalAttempts,
            uniqueUsersAttempted: uniqueUsersAttempted.length
        })
    } catch (error) {
        console.error('Error fetching analytics:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

