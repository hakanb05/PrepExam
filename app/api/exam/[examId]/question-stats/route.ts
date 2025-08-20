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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { examId } = await params

        // Get all completed attempts with responses for this exam
        const responses = await prisma.response.findMany({
            where: {
                attemptSection: {
                    attempt: {
                        examId,
                        finishedAt: { not: null },
                    },
                },
            },
            include: {
                question: {
                    include: {
                        options: true,
                    },
                },
            },
        })

        // Calculate success rate for each question
        const questionStats: { [questionId: string]: { correct: number; total: number; percentage: number } } = {}

        responses.forEach((response) => {
            const questionId = response.questionId
            const question = response.question

            if (!questionStats[questionId]) {
                questionStats[questionId] = { correct: 0, total: 0, percentage: 0 }
            }

            questionStats[questionId].total++

            // Check if the answer was correct
            if (question.correctOptionId && response.answer) {
                const selectedOptionId = (response.answer as any)?.optionId || response.answer
                if (selectedOptionId === question.correctOptionId) {
                    questionStats[questionId].correct++
                }
            }
        })

        // Calculate percentages
        Object.keys(questionStats).forEach((questionId) => {
            const stats = questionStats[questionId]
            stats.percentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
        })

        return NextResponse.json(questionStats)

    } catch (error) {
        console.error("Error getting question statistics:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
