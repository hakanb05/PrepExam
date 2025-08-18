import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const { examId } = await params

        // Total users who ever purchased this exam
        const totalPurchases = await prisma.purchase.count({
            where: {
                examId,
                canceledAt: null
            }
        })

        // Users with current valid access
        const currentValidAccess = await prisma.purchase.count({
            where: {
                examId,
                canceledAt: null,
                validUntil: {
                    gte: new Date()
                }
            }
        })

        // Users who have attempted this exam
        const totalAttempts = await prisma.attempt.count({
            where: { examId }
        })

        // Unique users who attempted
        const uniqueAttemptUsers = await prisma.attempt.groupBy({
            by: ['userId'],
            where: { examId }
        })

        // Question statistics - correct/incorrect responses
        const questionStats = await prisma.response.groupBy({
            by: ['questionId', 'isCorrect'],
            where: {
                question: {
                    examId
                },
                isCorrect: {
                    not: null
                }
            },
            _count: true
        })

        // Transform question stats
        const questionStatsFormatted = questionStats.reduce((acc, stat) => {
            const questionId = stat.questionId
            if (!acc[questionId]) {
                acc[questionId] = { correct: 0, incorrect: 0 }
            }
            if (stat.isCorrect) {
                acc[questionId].correct = stat._count
            } else {
                acc[questionId].incorrect = stat._count
            }
            return acc
        }, {} as Record<string, { correct: number; incorrect: number }>)

        return NextResponse.json({
            examId,
            totalPurchases,
            currentValidAccess,
            totalAttempts,
            uniqueUsersAttempted: uniqueAttemptUsers.length,
            questionStats: questionStatsFormatted
        })

    } catch (error) {
        console.error("Error fetching exam analytics:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
