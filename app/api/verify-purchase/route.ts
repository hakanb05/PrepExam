import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { sessionId } = await request.json()

        if (!sessionId) {
            return NextResponse.json({ error: 'Missing session ID' }, { status: 400 })
        }

        // Retrieve the checkout session from Stripe
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

        if (checkoutSession.payment_status !== 'paid') {
            return NextResponse.json({
                success: false,
                error: 'Payment not completed'
            })
        }

        // Extract metadata
        const examId = checkoutSession.metadata?.examId
        const examTitle = checkoutSession.metadata?.examTitle

        if (!examId) {
            return NextResponse.json({
                success: false,
                error: 'Missing exam ID in metadata'
            })
        }

        // Use the current user's ID
        const userId = session.user.id

        // Check if purchase already exists (including expired ones)
        const existingPurchase = await prisma.purchase.findFirst({
            where: {
                userId,
                examId,
                canceledAt: null, // Only consider non-canceled purchases
            },
        })

        const newPurchaseDate = new Date()
        const newExpiresAt = new Date()
        newExpiresAt.setFullYear(newExpiresAt.getFullYear() + 1) // 1 year from now

        if (!existingPurchase) {
            // Create new purchase record
            await prisma.purchase.create({
                data: {
                    userId,
                    examId,
                    purchasedAt: newPurchaseDate,
                    expiresAt: newExpiresAt,
                    amount: checkoutSession.amount_total || 2500,
                    currency: 'usd',
                    stripePaymentIntentId: checkoutSession.payment_intent as string,
                },
            })
        } else {
            // Update existing purchase (renew expired or extend valid)
            await prisma.purchase.update({
                where: {
                    id: existingPurchase.id,
                },
                data: {
                    purchasedAt: newPurchaseDate, // Update purchase date
                    expiresAt: newExpiresAt, // Extend expiry by 1 year
                    amount: checkoutSession.amount_total || 2500,
                    stripePaymentIntentId: checkoutSession.payment_intent as string,
                },
            })
        }

        return NextResponse.json({
            success: true,
            examTitle,
        })
    } catch (error) {
        console.error('Error verifying purchase:', error)
        return NextResponse.json(
            { success: false, error: 'Verification failed' },
            { status: 500 }
        )
    }
}
