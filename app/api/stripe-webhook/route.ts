import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
    try {
        const body = await request.text()
        const headersList = await headers()
        const sig = headersList.get('stripe-signature')

        let event: Stripe.Event

        try {
            if (!endpointSecret) {
                // For development/testing without webhook endpoint secret
                event = JSON.parse(body)
            } else {
                event = stripe.webhooks.constructEvent(body, sig!, endpointSecret)
            }
        } catch (err) {
            console.error('Webhook signature verification failed:', err)
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const checkoutSession = event.data.object as Stripe.Checkout.Session

                if (checkoutSession.payment_status === 'paid') {
                    // Extract metadata
                    const userId = checkoutSession.metadata?.userId
                    const examId = checkoutSession.metadata?.examId
                    const examTitle = checkoutSession.metadata?.examTitle

                    if (!userId || !examId) {
                        console.error('Missing metadata in checkout session:', checkoutSession.metadata)
                        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
                    }

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

                        console.log(`New purchase created for user ${userId}, exam ${examId}`)
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

                        console.log(`Existing purchase renewed for user ${userId}, exam ${examId}`)
                    }
                }
                break

            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object as Stripe.PaymentIntent
                console.log('Payment failed:', failedPayment.id)
                break

            default:
                console.log(`Unhandled event type ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        )
    }
}
