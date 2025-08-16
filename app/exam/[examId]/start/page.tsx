"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, AlertTriangle, Home, Lock, ShoppingCart } from "lucide-react"
import { getExamData } from "@/lib/exam-data"
import { hasExamAccess } from "@/lib/purchase-manager"
import { PurchaseDialog } from "@/components/purchase-dialog"

interface StartPageProps {
  params: { examId: string }
}

export default function ExamStartPage({ params }: StartPageProps) {
  const [examAccess, setExamAccess] = useState(false)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const examData = getExamData()

  useEffect(() => {
    setExamAccess(hasExamAccess(params.examId))

    const handleProfileUpdate = () => {
      setExamAccess(hasExamAccess(params.examId))
    }

    window.addEventListener("profileUpdated", handleProfileUpdate)
    return () => window.removeEventListener("profileUpdated", handleProfileUpdate)
  }, [params.examId])

  const handlePurchaseComplete = () => {
    setExamAccess(hasExamAccess(params.examId))
  }

  if (examData.examId !== params.examId) {
    return <div>Examen niet gevonden</div>
  }

  if (!examAccess) {
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
            <CardDescription>Get access to all 4 sections with 200 practice questions</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {examData.sections.map((section, index) => (
                <div key={section.sectionId} className="p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{section.title}</h4>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{section.questions.length} questions</p>
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
        <p className="text-muted-foreground">Bereid je voor op het examen</p>
      </div>

      {/* Important Notice */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Belangrijk:</strong> 50 vragen per sectie. Na doorgaan naar de volgende sectie kun je niet terug.
        </AlertDescription>
      </Alert>

      {/* Section Notes */}
      <div className="grid gap-4 md:grid-cols-2">
        {examData.sections.map((section, index) => (
          <Card key={section.sectionId}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>{section.title}</span>
              </CardTitle>
              <CardDescription>{section.questions.length} vragen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Sectie {index + 1} bevat {section.questions.length} vragen over verschillende medische onderwerpen.
                </p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Notitie:</strong> Focus op de klinische presentatie en differentiaaldiagnose.
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
          <a href={`/exam/${examData.examId}/section/${examData.sections[0].sectionId}`}>Start Sectie 1</a>
        </Button>

        <div className="mt-4 space-y-2">
          <p className="text-xs text-gray-500">Your progress will be stored for when you come back</p>
          <Button variant="outline" size="sm" asChild>
            <a href="/">
              <Home className="mr-2 h-4 w-4" />
              Come back later
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
