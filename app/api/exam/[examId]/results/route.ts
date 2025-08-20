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
        const userId = session.user.id

        // First, check if there's an unfinished attempt that should be marked as completed
        const unfinishedAttempt = await prisma.attempt.findFirst({
            where: {
                userId,
                examId,
                finishedAt: null,
            },
            include: {
                sections: {
                    include: {
                        responses: true,
                    },
                },
            },
        })

        // If there's an unfinished attempt with responses, mark it as completed
        if (unfinishedAttempt && unfinishedAttempt.sections.some(section => section.responses.length > 0)) {
            await prisma.attempt.update({
                where: { id: unfinishedAttempt.id },
                data: { finishedAt: new Date() },
            })
        }

        // Get the most recent completed attempt
        const attempt = await prisma.attempt.findFirst({
            where: {
                userId,
                examId,
                finishedAt: { not: null },
            },
            orderBy: {
                finishedAt: 'desc',
            },
            include: {
                sections: {
                    include: {
                        responses: {
                            include: {
                                question: {
                                    include: {
                                        options: true,
                                    },
                                },
                            },
                        },
                        section: {
                            include: {
                                questions: {
                                    include: {
                                        options: true,
                                    },
                                },
                            },
                        },
                    },
                },
                exam: true,
            },
        })

        if (!attempt) {
            return NextResponse.json({ error: "No completed attempts found" }, { status: 404 })
        }

        // Calculate results
        let totalQuestions = 0
        let correctAnswers = 0
        const categoryStats: Record<string, { correct: number; total: number }> = {}

        for (const sectionAttempt of attempt.sections) {
            for (const response of sectionAttempt.responses) {
                totalQuestions++

                const question = response.question
                const selectedAnswer = response.answer
                const correctAnswer = question.correctOptionId

                const isCorrect = selectedAnswer === correctAnswer
                if (isCorrect) {
                    correctAnswers++
                }

                // Track by category (you can add category logic here)
                const category = "General" // Default category
                if (!categoryStats[category]) {
                    categoryStats[category] = { correct: 0, total: 0 }
                }
                categoryStats[category].total++
                if (isCorrect) {
                    categoryStats[category].correct++
                }
            }
        }

        const overallPercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

        // Calculate duration
        const startTime = new Date(attempt.startedAt).getTime()
        const endTime = new Date(attempt.finishedAt!).getTime()
        const totalPausedTime = attempt.totalPausedTime || 0
        const duration = endTime - startTime - totalPausedTime

        const hours = Math.floor(duration / 3600000)
        const minutes = Math.floor((duration % 3600000) / 60000)
        const durationDisplay = hours > 0
            ? `${hours}h ${minutes}m`
            : `${minutes} minutes`

        const categories = Object.entries(categoryStats).map(([name, stats]) => ({
            name,
            percent: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
            correct: stats.correct,
            total: stats.total,
        }))

        const results = {
            examId: attempt.examId,
            examTitle: attempt.exam.title,
            overallPercent,
            correctAnswers,
            totalQuestions,
            duration: durationDisplay,
            categories,
            completedAt: attempt.finishedAt,
            attemptId: attempt.id,
        }

        return NextResponse.json(results)

    } catch (error) {
        console.error("Error getting exam results:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
