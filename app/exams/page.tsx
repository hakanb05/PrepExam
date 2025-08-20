"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Search, Play, Lock, ShoppingCart, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useExamData } from "@/hooks/use-exam-data"
import { useResumeStatus } from "@/hooks/use-resume-status"
import { usePreviousAttempts } from "@/hooks/use-previous-attempts"
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
  const { examData, examAccess, loading: examLoading, error } = useExamData('nbme20a')
  const { resumeStatus } = useResumeStatus('nbme20a')
  const { attempts: previousAttempts } = usePreviousAttempts('nbme20a')
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'old' | 'score-high' | 'score-low'>('recent')
  const [filterByExam, setFilterByExam] = useState<'all' | 'nbme20a'>('all')
  const [attemptsPage, setAttemptsPage] = useState(0)

  const handlePurchaseComplete = () => {
    window.location.reload() // Simple refresh for now
  }

  // Filter and sort previous attempts based on selected filters
  const filteredAndSortedAttempts = [...previousAttempts]
    .filter(attempt => {
      if (filterByExam === 'all') return true
      // For now we only have nbme20a, but this can be expanded for multiple exams
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        case 'old':
          return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        case 'score-high':
          return b.percentage - a.percentage
        case 'score-low':
          return a.percentage - b.percentage
        default:
          return 0
      }
    })

  const sortedAttempts = filteredAndSortedAttempts

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
                resumeStatus.canResume ? (
                  <Button onClick={() => setShowResumeDialog(true)}>
                    <Play className="mr-2 h-4 w-4" />
                    Resume Exam
                  </Button>
                ) : (
                  <Button asChild>
                    <a href={`/exam/${examData.examId}/start`}>
                      <Play className="mr-2 h-4 w-4" />
                      Start Exam
                    </a>
                  </Button>
                )
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

      {/* Previous Attempts */}
      {previousAttempts.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Previous Attempts</CardTitle>
                <CardDescription>Review your completed attempts</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="old">Oldest First</SelectItem>
                    <SelectItem value="score-high">Highest Score</SelectItem>
                    <SelectItem value="score-low">Lowest Score</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterByExam} onValueChange={(value: any) => setFilterByExam(value)}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Filter..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exams</SelectItem>
                    <SelectItem value="nbme20a">NBME 20A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedAttempts.slice(attemptsPage * 3, (attemptsPage + 1) * 3).map((attempt, index) => {
                const displayIndex = (attemptsPage * 3) + index + 1
                return (
                  <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                        <span className="text-sm font-medium">{displayIndex}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm">
                            Attempt {displayIndex} - {new Date(attempt.completedAt).toLocaleDateString()} at {attempt.completedTime}
                          </p>
                          <Badge className={`text-xs px-2 py-1 ${getPercentageColor(attempt.percentage)}`}>
                            {attempt.percentage}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Duration: {attempt.duration} • Score: {attempt.score}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/exam/${examData.examId}/review?attemptId=${attempt.id}`)}
                      >
                        <BookOpen className="mr-1 h-3 w-3" />
                        Review
                      </Button>
                    </div>
                  </div>
                )
              })}

              {/* Pagination Controls */}
              {sortedAttempts.length > 3 && (
                <div className="flex justify-center items-center space-x-2 pt-2">
                  <Button
                    variant="outline"
                    className="hover:cursor-pointer"
                    size="sm"
                    onClick={() => setAttemptsPage(Math.max(0, attemptsPage - 1))}
                    disabled={attemptsPage === 0}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {attemptsPage + 1} of {Math.ceil(sortedAttempts.length / 3)}
                  </span>
                  <Button
                    variant="outline"
                    className="hover:cursor-pointer"
                    size="sm"
                    onClick={() => setAttemptsPage(Math.min(Math.ceil(sortedAttempts.length / 3) - 1, attemptsPage + 1))}
                    disabled={attemptsPage >= Math.ceil(sortedAttempts.length / 3) - 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <PurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        examId={examData.examId}
        examTitle={examData.title}
        onPurchaseComplete={handlePurchaseComplete}
      />

      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resume Exam</DialogTitle>
            <DialogDescription>
              You have an unfinished exam. Would you like to continue where you left off?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="font-medium">{resumeStatus.sectionTitle}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Question {resumeStatus.questionNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Time elapsed: {resumeStatus.timeElapsed}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowResumeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowResumeDialog(false)
                  router.push(`/exam/${examData.examId}/section/${resumeStatus.sectionId}`)
                }}
              >
                Yes, Resume
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
