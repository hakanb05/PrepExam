import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                emailOptIn: true,
                verified: true,
                purchases: {
                    include: {
                        exam: true
                    }
                },
                attempts: {
                    include: {
                        exam: true
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Calculate stats
        const completedExams = user.attempts.filter(attempt => attempt.finishedAt).length
        const totalAttempts = user.attempts.length

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            emailOptIn: user.emailOptIn,
            verified: user.verified,
            stats: {
                completedExams,
                totalAttempts,
                purchasedExams: user.purchases.length
            }
        })

    } catch (error) {
        console.error("Error fetching profile:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { name, emailOptIn } = await request.json()

        // Validate input
        if (!name || name.trim().length < 2) {
            return NextResponse.json({ error: "Name must be at least 2 characters long" }, { status: 400 })
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: name.trim(),
                emailOptIn: emailOptIn ?? true
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                emailOptIn: true,
                verified: true
            }
        })

        return NextResponse.json({ success: true, user: updatedUser })

    } catch (error) {
        console.error("Error updating profile:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Soft delete by setting deletedAt timestamp
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                deletedAt: new Date()
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("Error deleting account:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
