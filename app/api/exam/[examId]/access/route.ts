import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ hasAccess: false }, { status: 401 })
        }

        const { examId } = await params
        const userId = session.user.id

        // Check if user has valid purchase for this exam
        const purchase = await prisma.purchase.findFirst({
            where: {
                userId,
                examId,
                canceledAt: null,
                validUntil: {
                    gte: new Date() // Still valid
                }
            }
        })

        return NextResponse.json({
            hasAccess: !!purchase,
            validUntil: purchase?.validUntil || null
        })

    } catch (error) {
        console.error("Error checking exam access:", error)
        return NextResponse.json({ hasAccess: false }, { status: 500 })
    }
}
