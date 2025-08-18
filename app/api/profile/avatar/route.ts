import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('avatar') as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: "File must be an image" }, { status: 400 })
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: "File size must be less than 2MB" }, { status: 400 })
        }

        // Get current user to remove old avatar file
        const userId = session.user.id
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { image: true }
        })

        // Create filename
        const fileExtension = file.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}.${fileExtension}`

        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
        await mkdir(uploadsDir, { recursive: true })

        // Save file
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const filePath = path.join(uploadsDir, fileName)
        await writeFile(filePath, buffer)

        // Remove old file if it exists and is not default
        if (currentUser?.image && currentUser.image.startsWith('/uploads/avatars/')) {
            const oldFilePath = path.join(process.cwd(), 'public', currentUser.image)
            try {
                await unlink(oldFilePath)
            } catch (err) {
                // File might not exist, continue anyway
                console.log("Could not delete old avatar file:", err)
            }
        }

        // Update user in database
        const imageUrl = `/uploads/avatars/${fileName}`
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { image: imageUrl },
            select: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        })

        return NextResponse.json({
            success: true,
            imageUrl,
            user: updatedUser
        })

    } catch (error) {
        console.error("Error uploading avatar:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get current user to find existing image
        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { image: true }
        })

        // Remove old file if it exists and is not default
        if (currentUser?.image && currentUser.image.startsWith('/uploads/avatars/')) {
            const oldFilePath = path.join(process.cwd(), 'public', currentUser.image)
            try {
                await unlink(oldFilePath)
            } catch (err) {
                // File might not exist, continue anyway
                console.log("Could not delete old avatar file:", err)
            }
        }

        // Remove avatar from database (set to null)
        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data: { image: null },
            select: {
                id: true,
                name: true,
                email: true,
                image: true
            }
        })

        return NextResponse.json({
            success: true,
            user: updatedUser
        })

    } catch (error) {
        console.error("Error removing avatar:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
