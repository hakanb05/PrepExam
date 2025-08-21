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

        // Check for unfinished attempts
        const attempt = await prisma.attempt.findFirst({
            where: {
                userId,
                examId,
                finishedAt: null,
            },
            include: {
                sections: {
                    where: {
                        finishedAt: null, // Section not completed
                    },
                    include: {
                        section: true,
                    },
                    orderBy: {
                        startedAt: 'asc',
                    },
                    take: 1, // Get the first unfinished section
                },
            },
        })

        if (!attempt || attempt.sections.length === 0) {
            return NextResponse.json({ canResume: false })
        }

        const currentSection = attempt.sections[0]
        const currentQuestionIndex = currentSection.currentQuestionIndex || 0

        // Format elapsed time from database
        const totalSeconds = attempt.elapsedSeconds || 0
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        const timeDisplay = hours > 0
            ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
            : `${minutes}:${String(seconds).padStart(2, "0")}`

        return NextResponse.json({
            canResume: true,
            sectionId: currentSection.section.sectionId,
            sectionTitle: currentSection.section.title,
            questionNumber: currentQuestionIndex + 1,
            timeElapsed: timeDisplay,
        })

    } catch (error) {
        console.error("Error checking resume status:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
