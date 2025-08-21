"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Suspense } from 'react'

function PurchaseSuccessContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isVerifying, setIsVerifying] = useState(true)
    const [verificationResult, setVerificationResult] = useState<{
        success: boolean
        examTitle?: string
        error?: string
    } | null>(null)

    useEffect(() => {
        const sessionId = searchParams.get('session_id')

        if (!sessionId) {
            setVerificationResult({ success: false, error: 'No session ID found' })
            setIsVerifying(false)
            return
        }

        // Verify the purchase
        const verifyPurchase = async () => {
            try {
                const response = await fetch('/api/verify-purchase', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ sessionId }),
                })

                const result = await response.json()
                setVerificationResult(result)
            } catch (error) {
                console.error('Error verifying purchase:', error)
                setVerificationResult({ success: false, error: 'Verification failed' })
            } finally {
                setIsVerifying(false)
            }
        }

        verifyPurchase()
    }, [searchParams])

    if (isVerifying) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                            <h2 className="text-lg font-semibold">Verifying your purchase...</h2>
                            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!verificationResult?.success) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="text-red-500 text-4xl">❌</div>
                            <h2 className="text-lg font-semibold">Purchase Verification Failed</h2>
                            <p className="text-muted-foreground">
                                {verificationResult?.error || 'Something went wrong'}
                            </p>
                            <Button onClick={() => router.push('/exams')} className="w-full">
                                Return to Exams
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>Purchase Successful!</CardTitle>
                    <CardDescription>
                        You now have access to {verificationResult.examTitle || 'the exam'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Your payment has been processed successfully. You can now:
                        </p>
                        <ul className="text-sm space-y-1">
                            <li>• Start taking the exam immediately</li>
                            <li>• View detailed explanations</li>
                            <li>• Access performance analytics</li>
                            <li>• Review all previous attempts</li>
                        </ul>
                    </div>
                    <div className="space-y-2">
                        <Button onClick={() => router.push('/exams')} className="w-full">
                            Start Exam
                        </Button>
                        <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                            Go to Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function PurchaseSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <PurchaseSuccessContent />
        </Suspense>
    )
}
