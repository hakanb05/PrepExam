import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
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

        const userId = user.id

        // Get all available exams
        const allExams = await prisma.exam.findMany({
            orderBy: { id: 'asc' }
        })

        // Get user's purchases
        const purchases = await prisma.purchase.findMany({
            where: {
                userId,
                canceledAt: null,
            },
        })

        // Create a map of purchased exams
        const purchaseMap = new Map(purchases.map(p => [p.examId, p]))

        // For each exam, get stats and purchase info
        const examsWithStats = await Promise.all(
            allExams.map(async (exam) => {
                const purchase = purchaseMap.get(exam.id)
                const hasPurchase = !!purchase

                // Get exam sections and total questions
                const examSections = await prisma.section.findMany({
                    where: { examId: exam.id },
                    orderBy: { index: 'asc' },
                    select: {
                        sectionId: true,
                        title: true,
                        index: true,
                        _count: {
                            select: { questions: true }
                        }
                    }
                })

                const totalQuestions = examSections.reduce((total, section) => total + section._count.questions, 0)

                let completedAttempts = 0
                let latestScore = null
                let latestAttemptDate = null

                // Only get attempt data if user has purchased the exam
                if (hasPurchase) {
                    completedAttempts = await prisma.attempt.count({
                        where: {
                            userId,
                            examId: exam.id,
                            finishedAt: { not: null },
                        },
                    })

                    const latestAttempt = await prisma.attempt.findFirst({
                        where: {
                            userId,
                            examId: exam.id,
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

                    if (latestAttempt) {
                        latestAttemptDate = latestAttempt.finishedAt
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
                }

                // Check if access is expired (only relevant if purchased)
                const isExpired = hasPurchase && purchase.expiresAt && purchase.expiresAt < new Date()

                return {
                    id: exam.id,
                    examId: exam.id,
                    title: exam.title,
                    description: hasPurchase
                        ? `Practice exam with ${completedAttempts} completed attempts`
                        : `Practice exam with ${totalQuestions} questions`,
                    completedAttempts,
                    latestScore,
                    latestAttemptDate,
                    isExpired: isExpired || false,
                    expiresAt: purchase?.expiresAt || null,
                    hasPurchase, // New field to indicate if user has purchased
                    sections: examSections.map(section => ({
                        sectionId: section.sectionId,
                        title: section.title,
                        index: section.index,
                        questionCount: section._count.questions
                    })),
                    totalQuestions,
                }
            })
        )

        return NextResponse.json({ exams: examsWithStats })

    } catch (error) {
        console.error("Error fetching exams:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
