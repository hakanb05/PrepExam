"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Play, Lock, ShoppingCart } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAllExams } from "@/hooks/use-all-exams"
import { useAuth } from "@/lib/auth-context"
import { PurchaseDialog } from "@/components/purchase-dialog"

// Helper function to get color classes based on percentage
const getPercentageColor = (percentage: number) => {
  if (percentage >= 70) return 'text-green-600 bg-green-50 border-green-200'
  if (percentage >= 40) return 'text-orange-600 bg-orange-50 border-orange-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

export default function ExamsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { exams, loading: examLoading, error } = useAllExams()
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)

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

  if (error || !exams) {
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
        {exams.map((exam) => (
          <Card key={exam.examId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {exam.title}
                      {exam.isExpired && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </CardTitle>
                    <CardDescription>
                      {exam.sections.length} sections • {exam.totalQuestions} questions
                      {exam.isExpired && (
                        <span className="ml-2 text-red-600">
                          • Expired on {new Date(exam.expiresAt!).toLocaleDateString()}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                {exam.hasPurchase && !exam.isExpired ? (
                  <Button asChild>
                    <a href={`/exam/${exam.examId}/start`}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Exam
                    </a>
                  </Button>
                ) : (
                  <Button onClick={() => {
                    setSelectedExamId(exam.examId)
                    setShowPurchaseDialog(true)
                  }}>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {exam.isExpired ? 'Renew Access - $25' : 'Purchase Access - $25'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 flex-wrap gap-2">
                {exam.sections.map((section) => (
                  <Badge key={section.sectionId} variant="outline">
                    {section.title}: {!exam.hasPurchase ? "Locked" : exam.isExpired ? "Expired" : "Ready"}
                  </Badge>
                ))}
                {!exam.hasPurchase && (
                  <Badge variant="destructive" className="text-xs">
                    No Access
                  </Badge>
                )}
                {exam.hasPurchase && exam.isExpired && (
                  <Badge variant="destructive" className="text-xs">
                    Access Expired
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <PurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        examId={selectedExamId || ''}
        examTitle={exams.find(e => e.examId === selectedExamId)?.title || ''}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </div>
  )
}
