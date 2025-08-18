"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Play, Lock, ShoppingCart } from "lucide-react"
import { useExamData } from "@/hooks/use-exam-data"
import { useAuth } from "@/lib/auth-context"
import { PurchaseDialog } from "@/components/purchase-dialog"

export default function ExamsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { examData, examAccess, loading: examLoading, error } = useExamData('nbme20a')
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)

  const handlePurchaseComplete = () => {
    window.location.reload() // Simple refresh for now
  }

  if (authLoading || examLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p>Please log in to view available exams.</p>
      </div>
    )
  }

  if (error || !examData) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-red-500">Error loading exam data: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exams</h1>
          <p className="text-muted-foreground">Available exams and practice tests</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search exams..." className="pl-10" />
              </div>
            </div>
            <Select defaultValue="recent">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently taken</SelectItem>
                <SelectItem value="score">Best score</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exam List */}
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {examData.title}
                    {!examAccess?.hasAccess && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </CardTitle>
                  <CardDescription>
                    {examData.sections.length} sections • {examData.totalQuestions} questions
                  </CardDescription>
                </div>
              </div>
              {examAccess?.hasAccess ? (
                <Button asChild>
                  <a href={`/exam/${examData.examId}/start`}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Exam
                  </a>
                </Button>
              ) : (
                <Button onClick={() => setShowPurchaseDialog(true)}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Purchase - $25
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2 flex-wrap gap-2">
              {examData.sections.map((section) => (
                <Badge key={section.sectionId} variant="outline">
                  {section.title}: {examAccess?.hasAccess ? "Ready" : "Locked"}
                </Badge>
              ))}
              {!examAccess?.hasAccess && (
                <Badge variant="destructive" className="text-xs">
                  Purchase Required
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
