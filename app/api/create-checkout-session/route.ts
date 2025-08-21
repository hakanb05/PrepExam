import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/auth-options'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { examId, examTitle } = await request.json()

        if (!examId || !examTitle) {
            return NextResponse.json({ error: 'Missing exam information' }, { status: 400 })
        }

        // Create checkout session
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `${examTitle} - 1 Year Access`,
                            description: '1 year access to all sections, questions, and detailed explanations',
                        },
                        unit_amount: 2500, // $25.00 in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            customer_email: session.user.email, // This will send receipt emails automatically
            metadata: {
                userId: session.user.id,
                examId,
                examTitle,
            },
            success_url: `${process.env.NEXTAUTH_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXTAUTH_URL}/exams`,
        })

        return NextResponse.json({
            sessionId: checkoutSession.id,
        })
    } catch (error) {
        console.error('Error creating checkout session:', error)
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
