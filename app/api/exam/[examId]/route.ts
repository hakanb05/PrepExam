import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ examId: string }> }
) {
    try {
        const { examId } = await params

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                sections: {
                    orderBy: { index: 'asc' },
                    include: {
                        questions: {
                            select: {
                                id: true,
                                qid: true,
                                number: true
                            }
                        }
                    }
                },
                questions: {
                    select: { id: true }
                }
            }
        })

        if (!exam) {
            return NextResponse.json({
                error: "Exam not found",
                examId
            }, { status: 404 })
        }

        return NextResponse.json({
            id: exam.id,
            examId: exam.id, // For backward compatibility
            title: exam.title,
            description: `Practice exam with ${exam.sections.length} sections and ${exam.questions.length} questions`,
            version: exam.version,
            totalQuestions: exam.questions.length,
            sections: exam.sections.map(section => ({
                sectionId: section.sectionId,
                title: section.title,
                index: section.index,
                questionCount: section.questions.length,
                questions: section.questions
            }))
        })

    } catch (error) {
        console.error("Error fetching exam data:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
