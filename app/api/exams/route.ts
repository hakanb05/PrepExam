import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const userId = session.user.id

        // Get all exams the user has purchased
        const purchases = await prisma.purchase.findMany({
            where: {
                userId,
                validUntil: { gte: new Date() },
                canceledAt: null,
            },
            include: {
                exam: true,
            },
        })

        // For each exam, get the number of completed attempts
        const examsWithStats = await Promise.all(
            purchases.map(async (purchase) => {
                const completedAttempts = await prisma.attempt.count({
                    where: {
                        userId,
                        examId: purchase.examId,
                        finishedAt: { not: null },
                    },
                })

                const latestAttempt = await prisma.attempt.findFirst({
                    where: {
                        userId,
                        examId: purchase.examId,
                        finishedAt: { not: null },
                    },
                    orderBy: { finishedAt: 'desc' },
                    include: {
                        sections: {
                            include: {
                                responses: {
                                    include: {
                                        question: true,
                                    },
                                },
                            },
                        },
                    },
                })

                let latestScore = null
                if (latestAttempt) {
                    let totalQuestions = 0
                    let correctAnswers = 0

                    for (const section of latestAttempt.sections) {
                        totalQuestions += section.responses.length
                        for (const response of section.responses) {
                            if (response.question.correctOptionId && response.answer) {
                                const selectedOptionId = typeof response.answer === 'string'
                                    ? response.answer
                                    : (response.answer as any)?.optionId || response.answer

                                if (selectedOptionId === response.question.correctOptionId) {
                                    correctAnswers++
                                }
                            }
                        }
                    }

                    latestScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
                }

                return {
                    id: purchase.exam.id,
                    examId: purchase.exam.id, // Use id as examId since they're the same
                    title: purchase.exam.title,
                    description: `Practice exam with ${completedAttempts} completed attempts`, // Generated description
                    completedAttempts,
                    latestScore,
                    latestAttemptDate: latestAttempt?.finishedAt,
                }
            })
        )

        return NextResponse.json({ exams: examsWithStats })

    } catch (error) {
        console.error("Error fetching exams:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
