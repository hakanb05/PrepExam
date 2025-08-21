"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Lock, CheckCircle, Loader2 } from "lucide-react"
import { getStripe } from "@/lib/stripe"

interface PurchaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  examId: string
  examTitle: string
  onPurchaseComplete: () => void
}

export function PurchaseDialog({ open, onOpenChange, examId, examTitle, onPurchaseComplete }: PurchaseDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [purchaseComplete, setPurchaseComplete] = useState(false)
  const price = 25 // $25

  const handlePurchase = async () => {
    setIsProcessing(true)
    try {
      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examId,
          examTitle,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Stripe failed to load')
      }

      // Create checkout session instead of using payment intent directly
      const checkoutResponse = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examId,
          examTitle,
        }),
      })

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout session')
      }

      const { sessionId } = await checkoutResponse.json()

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId,
      })

      if (error) {
        console.error('Stripe checkout error:', error)
        throw error
      }
    } catch (error) {
      console.error("Purchase failed:", error)
      setIsProcessing(false)
    }
  }

  if (purchaseComplete) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <DialogTitle>Purchase Successful!</DialogTitle>
            <DialogDescription>
              You now have access to {examTitle}. You can start taking the exam immediately.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Unlock Exam Access
          </DialogTitle>
          <DialogDescription>Purchase access to take this exam and view detailed results.</DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{examTitle}</CardTitle>
            <CardDescription>Full access to all sections and questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Exam Access</span>
                <Badge variant="secondary">${price}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                • Complete all 4 sections • 200 practice questions • Detailed explanations • Performance analytics •
                Lifetime access
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="flex flex-col gap-2 mt-4">
          <Button onClick={handlePurchase} disabled={isProcessing} className="w-full" size="lg">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Purchase for ${price}
              </>
            )}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing} className="w-full">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
