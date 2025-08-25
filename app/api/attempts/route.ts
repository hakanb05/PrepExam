import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/auth-options"
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

        // Get all attempts for the user across all exams
        const attempts = await prisma.attempt.findMany({
            where: {
                userId: user.id,
                finishedAt: { not: null } // Only completed attempts
            },
            include: {
                exam: true,
                sections: {
                    include: {
                        responses: {
                            include: {
                                question: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                finishedAt: 'desc'
            }
        })

        // Format the attempts
        const formattedAttempts = attempts.map(attempt => {
            const completedAt = attempt.finishedAt!
            const startTime = attempt.startedAt
            const durationMs = completedAt.getTime() - startTime.getTime()

            // Calculate duration in hours and minutes
            const hours = Math.floor(durationMs / (1000 * 60 * 60))
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
            const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`

            // Calculate score and percentage from all sections
            const allResponses = attempt.sections.flatMap(section => section.responses)
            const totalQuestions = allResponses.length
            const correctAnswers = allResponses.filter(r => r.isCorrect).length
            const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0
            const score = `${correctAnswers}/${totalQuestions}`

            return {
                id: attempt.id,
                examId: attempt.examId,
                completedAt: completedAt.toISOString(),
                completedTime: completedAt.toLocaleTimeString(),
                duration,
                score,
                percentage
            }
        })

        return NextResponse.json({ attempts: formattedAttempts })
    } catch (error) {
        console.error('Error fetching attempts:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

