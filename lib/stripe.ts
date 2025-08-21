import { loadStripe } from '@stripe/stripe-js'

export const getStripe = () => {
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined')
    }

    return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
}
