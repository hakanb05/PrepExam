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
        const { searchParams } = new URL(request.url)
        const attemptId = searchParams.get('attemptId')

        // Get specific attempt if provided, otherwise most recent completed attempt
        const whereCondition = attemptId
            ? { id: attemptId, userId, examId, finishedAt: { not: null } }
            : { userId, examId, finishedAt: { not: null } }

        const attempt = await prisma.attempt.findFirst({
            where: whereCondition,
            orderBy: attemptId ? undefined : {
                finishedAt: 'desc',
            },
            include: {
                exam: true,
                sections: {
                    include: {
                        section: {
                            include: {
                                questions: {
                                    include: {
                                        options: true,
                                    },
                                    orderBy: {
                                        number: 'asc',
                                    },
                                },
                            },
                        },
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
                    orderBy: {
                        section: {
                            index: 'asc',
                        },
                    },
                },
            },
        })

        if (!attempt) {
            return NextResponse.json({ error: "No completed attempts found" }, { status: 404 })
        }

        // Format the data for review
        const sections = attempt.sections.map((sectionAttempt) => {
            const section = sectionAttempt.section
            const responses = sectionAttempt.responses

            const questions = section.questions.map((question) => {
                const response = responses.find(r => r.questionId === question.id)

                return {
                    id: question.id,
                    qid: question.qid,
                    number: question.number,
                    stem: question.stem,
                    images: question.images,
                    matrix: question.matrix,
                    options: question.options.map(opt => ({
                        id: opt.letter,
                        letter: opt.letter,
                        text: opt.text,
                    })),
                    correctOptionId: question.correctOptionId,
                    explanation: question.explanation,
                    selectedAnswer: response?.answer ? (response.answer as any)?.optionId || response.answer : null,
                    flagged: response?.flagged || false,
                    note: response?.note || null,
                }
            })

            return {
                sectionId: section.sectionId,
                title: section.title,
                questions,
            }
        })

        const reviewData = {
            examId: attempt.examId,
            examTitle: attempt.exam.title,
            sections,
            completedAt: attempt.finishedAt,
            attemptId: attempt.id,
        }

        return NextResponse.json(reviewData)

    } catch (error) {
        console.error("Error getting exam review data:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
