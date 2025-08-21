import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string; sectionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { examId, sectionId } = await params
        const userId = session.user.id

        // Get section data with questions
        const section = await prisma.section.findFirst({
            where: {
                examId,
                sectionId,
            },
            include: {
                questions: {
                    include: {
                        options: {
                            orderBy: { letter: 'asc' },
                        },
                    },
                    orderBy: { number: 'asc' },
                },
            },
        })

        if (!section) {
            return NextResponse.json({ error: "Section not found" }, { status: 404 })
        }

        // Get or create current attempt
        let attempt = await prisma.attempt.findFirst({
            where: {
                userId,
                examId,
                finishedAt: null,
            },
        })

        // Create attempt if it doesn't exist
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
            })
        }

        // Get or create section attempt
        let sectionAttempt = await prisma.attemptSection.findFirst({
            where: {
                attemptId: attempt.id,
                sectionId: section.id,
            },
            include: {
                responses: true,
            },
        })

        if (!sectionAttempt) {
            sectionAttempt = await prisma.attemptSection.create({
                data: {
                    attemptId: attempt.id,
                    sectionId: section.id,
                    startedAt: new Date(),
                    currentQuestionIndex: 0,
                },
                include: {
                    responses: true,
                },
            })
        }

        const wireSection = {
            id: section.id,
            sectionId: section.sectionId,
            title: section.title,
            questions: section.questions.map((q) => ({
                id: q.id,
                number: q.number,
                stem: q.stem,
                info: (q as any).info || undefined,
                infoImages: (q as any).infoImages || undefined,
                images: (q as any).images || undefined,
                matrix: (q as any).matrix || undefined,
                categories: undefined,
                options: q.options.map((o) => ({ id: o.id, letter: o.letter, text: o.text })),
            })),
        }
        return NextResponse.json({
            section: wireSection,
            attempt,
            sectionAttempt,
        })

    } catch (error) {
        console.error("Error fetching section:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string; sectionId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { examId, sectionId } = await params
        const userId = session.user.id
        const body = await request.json()
        const { action, questionId, optionId, note, flag } = body

        // Get current attempt (should exist by now from GET request)
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

        // Get section
        const section = await prisma.section.findFirst({
            where: { examId, sectionId },
        })

        if (!section) {
            return NextResponse.json({ error: "Section not found" }, { status: 404 })
        }

        // Get section attempt
        const sectionAttempt = await prisma.attemptSection.findFirst({
            where: {
                attemptId: attempt.id,
                sectionId: section.id,
            },
        })

        if (!sectionAttempt) {
            return NextResponse.json({ error: "Section attempt not found" }, { status: 404 })
        }

        switch (action) {
            case 'answer':
                // Store selected option id in `answer` JSON field
                await prisma.response.upsert({
                    where: {
                        attemptSectionId_questionId: {
                            attemptSectionId: sectionAttempt.id,
                            questionId,
                        },
                    },
                    update: {
                        answer: optionId ?? null,
                    },
                    create: {
                        attemptSectionId: sectionAttempt.id,
                        questionId,
                        answer: optionId ?? null,
                    },
                })
                break

            case 'flag':
                await prisma.response.upsert({
                    where: {
                        attemptSectionId_questionId: {
                            attemptSectionId: sectionAttempt.id,
                            questionId,
                        },
                    },
                    update: { flagged: !!flag },
                    create: {
                        attemptSectionId: sectionAttempt.id,
                        questionId,
                        flagged: !!flag,
                    },
                })
                break

            case 'note':
                await prisma.response.upsert({
                    where: {
                        attemptSectionId_questionId: {
                            attemptSectionId: sectionAttempt.id,
                            questionId,
                        },
                    },
                    update: { note },
                    create: {
                        attemptSectionId: sectionAttempt.id,
                        questionId,
                        note,
                    },
                })
                break

            case 'progress':
                // Update current question index (0-based)
                await prisma.attemptSection.update({
                    where: { id: sectionAttempt.id },
                    data: { currentQuestionIndex: (body?.currentQuestionIndex ?? 0) },
                })
                break

            case 'complete':
                await prisma.attemptSection.update({
                    where: { id: sectionAttempt.id },
                    data: { finishedAt: new Date() },
                })
                break

            default:
                return NextResponse.json({ error: "Invalid action" }, { status: 400 })
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Error updating section:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
