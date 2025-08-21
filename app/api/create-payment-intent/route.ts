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

        // Create payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: 2500, // $25.00 in cents
            currency: 'usd',
            metadata: {
                userId: session.user.id,
                examId,
                examTitle,
            },
            description: `Exam access for ${examTitle}`,
        })

        return NextResponse.json({
            clientSecret: paymentIntent.client_secret,
        })
    } catch (error) {
        console.error('Error creating payment intent:', error)
        return NextResponse.json(
            { error: 'Failed to create payment intent' },
            { status: 500 }
        )
    }
}
