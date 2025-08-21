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

        // Check if user has any purchase for this exam (valid or expired)
        const purchase = await prisma.purchase.findFirst({
            where: {
                userId,
                examId,
                canceledAt: null,
            }
        })

        // Determine if access is still valid
        const hasAccess = purchase && (
            !purchase.expiresAt || // Lifetime access
            purchase.expiresAt >= new Date() // Not yet expired
        )

        return NextResponse.json({
            hasAccess: !!hasAccess,
            expiresAt: purchase?.expiresAt || null
        })

    } catch (error) {
        console.error("Error checking exam access:", error)
        return NextResponse.json({ hasAccess: false }, { status: 500 })
    }
}
