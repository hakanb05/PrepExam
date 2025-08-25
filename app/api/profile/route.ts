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

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                purchases: {
                    include: {
                        exam: true
                    }
                },
                attempts: {
                    where: {
                        finishedAt: { not: null }
                    }
                }
            }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Calculate stats
        const completedExams = user.attempts.length
        const totalAttempts = user.attempts.length
        const purchasedExams = user.purchases.length

        const profileData = {
            id: user.id,
            name: user.name || '',
            email: user.email,
            image: user.image,
            emailOptIn: user.emailOptIn || false,
            verified: user.verified || false,
            stats: {
                completedExams,
                totalAttempts,
                purchasedExams
            }
        }

        return NextResponse.json(profileData)
    } catch (error) {
        console.error('Error fetching profile:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name, emailOptIn } = body

        // Validate input
        if (name && name.trim().length < 2) {
            return NextResponse.json({ error: "Name must be at least 2 characters long" }, { status: 400 })
        }

        // Update user in database
        const updatedUser = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                ...(name && { name: name.trim() }),
                ...(emailOptIn !== undefined && { emailOptIn })
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                emailOptIn: true,
                emailVerified: true
            }
        })

        return NextResponse.json({
            success: true,
            user: updatedUser
        })
    } catch (error) {
        console.error('Error updating profile:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Soft delete by setting deletedAt timestamp
        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                deletedAt: new Date()
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting account:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
