"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Play, User, Lock, ShoppingCart } from "lucide-react"
import { getExamData } from "@/lib/exam-data"
import { getUserProfile } from "@/lib/user-storage"
import { hasExamAccess } from "@/lib/purchase-manager"
import { PurchaseDialog } from "@/components/purchase-dialog"
import { useAuth } from "@/lib/auth-context"
import type { User as UserType } from "@/lib/types"

function DashboardContent() {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const { isAuthenticated, isLoading, user: authUser } = useAuth()
  const router = useRouter()
  const examData = getExamData()
  const examAccess = hasExamAccess(examData.examId)

  // Check if user just registered
  const [isNewUser, setIsNewUser] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check localStorage for new registration (only client-side)
    const justRegistered = localStorage.getItem('justRegistered')
    if (justRegistered === 'true') {
      setIsNewUser(true)
      // Clean up the flag but DON'T change the message
      setTimeout(() => {
        localStorage.removeItem('justRegistered')
      }, 1000) // Just remove the flag after 1 second
    }
  }, [mounted])

  // Debug logging (only client-side)
  useEffect(() => {
    if (mounted) {
      console.log('Dashboard Debug:', { isNewUser, justRegistered: localStorage.getItem('justRegistered') })
    }
  }, [isNewUser, mounted])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login")
      router.push("/login")
      return
    }
  }, [isAuthenticated, isLoading, router])

  const handlePurchaseComplete = () => {
    // Refresh any necessary data after purchase
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }

  // Use NextAuth user instead of local storage
  if (!isAuthenticated || !authUser) {
    console.log("Not authenticated or no user:", { isAuthenticated, authUser })
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>
                {isNewUser ? `Welcome, ${authUser.name || 'User'}!` : `Welcome back, ${authUser.name || 'User'}!`}
              </CardTitle>
              <CardDescription>{authUser.email}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Mijn examens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <span>My Exams</span>
            </CardTitle>
            <CardDescription>Your available exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{examData.title}</h4>
                    {!examAccess && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">4 sections • 200 questions</p>

                  {!examAccess && (
                    <div className="flex flex-col gap-2">
                      <Badge variant="outline" className="w-fit text-xs">
                        Purchase Required - $25
                      </Badge>
                      <Button size="sm" onClick={() => setShowPurchaseDialog(true)} className="w-fit">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Purchase Access
                      </Button>
                    </div>
                  )}

                  {examAccess && (
                    <Badge variant="default" className="w-fit text-xs">
                      Access Granted
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col space-y-1 ml-4">
                  {examData.sections.map((section, index) => (
                    <Badge key={section.sectionId} variant="outline" className="text-xs">
                      S{index + 1}: {examAccess ? "Ready" : "Locked"}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Snelle acties */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              {examAccess ? "Continue where you left off" : "Purchase exam to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {examAccess ? (
                <Button className="w-full" size="lg" asChild>
                  <a href="/exam/nbme20a/start">
                    <Play className="mr-2 h-4 w-4" />
                    Start {examData.title}
                  </a>
                </Button>
              ) : (
                <Button className="w-full" size="lg" onClick={() => setShowPurchaseDialog(true)}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Purchase Exam Access - $25
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status per sectie */}
      <Card>
        <CardHeader>
          <CardTitle>Section Overview</CardTitle>
          <CardDescription>Status of all sections in {examData.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {examData.sections.map((section, index) => (
              <div key={section.sectionId} className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{section.title}</h4>
                  <Badge variant="outline">{examAccess ? "Ready" : "Locked"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{section.questions.length} questions</p>
                {!examAccess && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Purchase required
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        examId={examData.examId}
        examTitle={examData.title}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}