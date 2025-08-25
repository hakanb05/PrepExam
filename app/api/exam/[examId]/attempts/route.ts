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

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { examId } = await params

        // Get user ID from email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const userId = user.id

        // Get all completed attempts for this exam
        const attempts = await prisma.attempt.findMany({
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
                    },
                },
            },
        })

        // Calculate results for each attempt
        const attemptsWithResults = attempts.map((attempt) => {
            let totalQuestions = 0
            let correctAnswers = 0

            for (const section of attempt.sections) {
                totalQuestions += section.responses.length
                for (const response of section.responses) {
                    const question = response.question

                    if (question.correctOptionId && response.answer) {
                        const selectedOptionId = (response.answer as any)?.optionId || response.answer
                        if (selectedOptionId === question.correctOptionId) {
                            correctAnswers++
                        }
                    }
                }
            }

            // Calculate duration using elapsedSeconds instead of totalPausedTime
            const startTime = new Date(attempt.startedAt).getTime()
            const endTime = new Date(attempt.finishedAt!).getTime()
            const actualDuration = attempt.elapsedSeconds * 1000 // Convert seconds to milliseconds

            const hours = Math.floor(actualDuration / 3600000)
            const minutes = Math.floor((actualDuration % 3600000) / 60000)
            const durationDisplay = hours > 0
                ? `${hours}h ${minutes}m`
                : `${minutes}m`

            const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

            return {
                id: attempt.id,
                examId: attempt.examId, // Add examId to identify which exam this attempt belongs to
                completedAt: attempt.finishedAt,
                completedTime: new Date(attempt.finishedAt!).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                duration: durationDisplay,
                totalQuestions,
                correctAnswers,
                percentage,
                score: `${correctAnswers}/${totalQuestions}`,
            }
        })

        return NextResponse.json({ attempts: attemptsWithResults })

    } catch (error) {
        console.error("Error getting previous attempts:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
