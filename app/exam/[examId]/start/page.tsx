"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, AlertTriangle, Home, Lock, ShoppingCart } from "lucide-react"
import { useExamData } from "@/hooks/use-exam-data"
import { useAuth } from "@/lib/auth-context"
import { PurchaseDialog } from "@/components/purchase-dialog"

interface StartPageProps {
  params: Promise<{ examId: string }>
}

export default function ExamStartPage({ params }: StartPageProps) {
  const [examId, setExamId] = useState<string>("")
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { examData, examAccess, loading: examLoading, error, refetch } = useExamData(examId)

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setExamId(resolvedParams.examId)
    }
    getParams()
  }, [params])

  const handlePurchaseComplete = () => {
    refetch()
  }

  if (authLoading || examLoading || !examId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p>Please log in to access this exam.</p>
        <Button asChild className="mt-4">
          <a href="/login">Go to Login</a>
        </Button>
      </div>
    )
  }

  if (error || !examData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-red-600">Exam Not Found</h1>
        <p className="text-muted-foreground mt-2">The requested exam could not be found.</p>
        <Button asChild className="mt-4">
          <a href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </a>
        </Button>
      </div>
    )
  }

  if (!examAccess?.hasAccess) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">{examData.title}</h1>
          <p className="text-muted-foreground">Purchase required to access this exam</p>
        </div>

        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <strong>Access Required:</strong> You need to purchase this exam for $25 to access all sections and
            questions.
          </AlertDescription>
        </Alert>

        <Card className="border-2 border-dashed">
          <CardHeader className="text-center">
            <CardTitle>Unlock Full Access</CardTitle>
            <CardDescription>Get access to {examData.sections.length} sections with {examData.totalQuestions} practice questions</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {examData.sections.map((section) => (
                <div key={section.sectionId} className="p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{section.title}</h4>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{section.questionCount} questions</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button size="lg" onClick={() => setShowPurchaseDialog(true)} className="w-full">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchase Exam Access - $25
              </Button>

              <Button variant="outline" size="sm" asChild>
                <a href="/">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </a>
              </Button>
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{examData.title}</h1>
        <p className="text-muted-foreground">Prepare for your exam</p>
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Each section contains multiple questions. Once you proceed to the next section, you cannot go back.
        </AlertDescription>
      </Alert>

      {/* Section Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        {examData.sections.map((section, index) => (
          <Card key={section.sectionId}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />``
                <span>{section.title}</span>
              </CardTitle>
              <CardDescription>{section.questionCount} questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Section {index + 1} contains {section.questionCount} questions covering various medical topics.
                </p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Note:</strong> Focus on clinical presentation and differential diagnosis.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Start Button */}
      <div className="text-center">
        <Button size="lg" asChild>
          <a href={`/exam/${examData.examId}/section/${examData.sections[0].sectionId}`}>Start Section 1</a>
        </Button>
      </div>
    </div>
  )
}
