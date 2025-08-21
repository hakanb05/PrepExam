import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import { prisma } from "@/lib/prisma"

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { examId } = await params
        const userId = session.user.id

        // Check if user has access to this exam
        const purchase = await prisma.purchase.findFirst({
            where: {
                userId,
                examId,
                canceledAt: null,
                OR: [
                    { expiresAt: null }, // Lifetime access
                    { expiresAt: { gte: new Date() } } // Valid until expiry
                ]
            },
        })

        if (!purchase) {
            return NextResponse.json({ error: "No valid access to this exam" }, { status: 403 })
        }

        // Check for existing attempt
        let attempt = await prisma.attempt.findFirst({
            where: {
                userId,
                examId,
                finishedAt: null, // Only unfinished attempts
            },
            include: {
                sections: {
                    include: {
                        responses: true,
                    },
                },
            },
        })

        // Create new attempt if none exists
        if (!attempt) {
            // Get exam to find the version
            const exam = await prisma.exam.findUnique({
                where: { id: examId },
                select: { version: true },
            })

            if (!exam) {
                return NextResponse.json({ error: "Exam not found" }, { status: 404 })
            }

            attempt = await prisma.attempt.create({
                data: {
                    userId,
                    examId,
                    version: exam.version,
                    startedAt: new Date(),
                },
                include: {
                    sections: {
                        include: {
                            responses: true,
                        },
                    },
                },
            })
        }

        return NextResponse.json({ attempt })

    } catch (error) {
        console.error("Error managing exam attempt:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { examId } = await params
        const userId = session.user.id
        const { action, data, pausedAt } = await request.json()

        // Find the current attempt
        const attempt = await prisma.attempt.findFirst({
            where: {
                userId,
                examId,
                finishedAt: null,
            },
        })

        if (!attempt) {
            return NextResponse.json({ error: "No active attempt found" }, { status: 404 })
        }

        switch (action) {
            case 'pause':
                // Use provided pausedAt timestamp or current time
                const pauseTime = pausedAt ? new Date(pausedAt) : new Date()
                await prisma.attempt.update({
                    where: { id: attempt.id },
                    data: { pausedAt: pauseTime },
                })
                break

            case 'resume':
                const pausedTime = attempt.pausedAt
                    ? new Date().getTime() - new Date(attempt.pausedAt).getTime()
                    : 0

                await prisma.attempt.update({
                    where: { id: attempt.id },
                    data: {
                        pausedAt: null,
                        totalPausedTime: attempt.totalPausedTime + pausedTime,
                    },
                })
                break

            case 'finish':
                await prisma.attempt.update({
                    where: { id: attempt.id },
                    data: { finishedAt: new Date() },
                })
                break

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Error updating attempt:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
