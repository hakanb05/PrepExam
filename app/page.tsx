"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Play, User, Lock, ShoppingCart, TrendingUp, Clock } from "lucide-react"
import { PurchaseDialog } from "@/components/purchase-dialog"
import { useAuth } from "@/lib/auth-context"
import { useAllExams } from "@/hooks/use-all-exams"
import { usePreviousAttempts } from "@/hooks/use-previous-attempts"

// Helper function to get color classes based on percentage
const getPercentageColor = (percentage: number) => {
  if (percentage >= 70) return 'text-green-600 bg-green-50 border-green-200'
  if (percentage >= 40) return 'text-orange-600 bg-orange-50 border-orange-200'
  return 'text-red-600 bg-red-50 border-red-200'
}

function DashboardContent() {
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)
  const [showResumeDialog, setShowResumeDialog] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [showAllAttempts, setShowAllAttempts] = useState(true)
  const [attemptsPage, setAttemptsPage] = useState(0)
  const [sortBy, setSortBy] = useState<'recent' | 'old' | 'score-high' | 'score-low'>('recent')
  const [filterByExam, setFilterByExam] = useState<'all' | string>('all')
  const [selectedExamForAnalytics, setSelectedExamForAnalytics] = useState<string | null>(null)
  const { isAuthenticated, isLoading, user: authUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Use all exams data from database
  const { exams, loading: examLoading, error: examError } = useAllExams()

  // Check for resume status across all exams - now supports multiple paused exams
  const [resumeStatuses, setResumeStatuses] = useState<Record<string, any>>({})
  const [resumeLoading, setResumeLoading] = useState(true)

  // Check resume status for all exams
  const checkAllExamsResume = async () => {
    if (!isAuthenticated || examLoading) return

    try {
      setResumeLoading(true)
      const newResumeStatuses: Record<string, any> = {}

      // Check each exam for resume status - don't break, check all exams
      for (const exam of exams) {
        try {
          const response = await fetch(`/api/exam/${exam.examId}/resume`)
          if (response.ok) {
            const data = await response.json()
            if (data.canResume) {
              newResumeStatuses[exam.examId] = { ...data, examId: exam.examId }
            } else {
              newResumeStatuses[exam.examId] = { canResume: false }
            }
          } else {
            newResumeStatuses[exam.examId] = { canResume: false }
          }
        } catch (examError) {
          console.error(`Failed to check resume status for ${exam.examId}:`, examError)
          newResumeStatuses[exam.examId] = { canResume: false }
        }
      }

      setResumeStatuses(newResumeStatuses)
    } catch (error) {
      console.error('Failed to check resume status:', error)
      setResumeStatuses({})
    } finally {
      setResumeLoading(false)
    }
  }

  useEffect(() => {
    checkAllExamsResume()
  }, [exams, examLoading, isAuthenticated])

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleDashboardRefresh = () => {
      console.log('Dashboard refresh triggered')
      checkAllExamsResume()
    }

    window.addEventListener('dashboardRefresh', handleDashboardRefresh)
    return () => window.removeEventListener('dashboardRefresh', handleDashboardRefresh)
  }, [exams, examLoading, isAuthenticated])

  // Check resume status when returning to dashboard
  useEffect(() => {
    if (pathname === '/' && isAuthenticated && !examLoading) {
      checkAllExamsResume()
    }
  }, [pathname, isAuthenticated, examLoading])

  // Get previous attempts for all exams
  const { attempts: allPreviousAttempts, loading: attemptsLoading } = usePreviousAttempts('all')

  // Filter and sort attempts based on current filters
  const filteredAndSortedAttempts = allPreviousAttempts
    .filter(attempt => {
      if (filterByExam === 'all') return true
      return attempt.examId === filterByExam
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

  const previousAttempts = filteredAndSortedAttempts

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

  // Fetch analytics data for selected exam
  useEffect(() => {
    if (isAuthenticated) {
      // Set default to 'all' if nothing is selected
      if (!selectedExamForAnalytics) {
        setSelectedExamForAnalytics('all')
      }

      const url = selectedExamForAnalytics === 'all'
        ? '/api/analytics'
        : `/api/exam/${selectedExamForAnalytics}/analytics`

      fetch(url)
        .then(res => res.json())
        .then(data => setAnalytics(data))
        .catch(err => console.error('Failed to fetch analytics:', err))
    }
  }, [selectedExamForAnalytics, isAuthenticated])

  // Load analytics immediately when authenticated
  useEffect(() => {
    if (isAuthenticated && !selectedExamForAnalytics) {
      setSelectedExamForAnalytics('all')
      fetch('/api/analytics')
        .then(res => res.json())
        .then(data => setAnalytics(data))
        .catch(err => console.error('Failed to fetch analytics:', err))
    }
  }, [isAuthenticated, selectedExamForAnalytics])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login")
      router.push("/login")
      return
    }
  }, [isAuthenticated, isLoading, router])

  const handlePurchaseComplete = () => {
    // Refresh exam data after purchase
    window.location.reload() // Simple refresh for now
  }

  if (isLoading || examLoading || resumeLoading) {
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

  if (examError || !exams || exams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-red-500">Error loading exam data: {examError}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Retry
          </Button>
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
        {/* My Exams */}
        <Card>
          <CardHeader>
            <CardTitle>My Exams</CardTitle>
            <CardDescription>Available exams and practice tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam.examId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{exam.title}</h4>
                      {exam.isExpired && <Lock className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {exam.sections.length} sections • {exam.totalQuestions} questions
                      {exam.hasPurchase && !exam.isExpired && exam.expiresAt && (
                        <span className="ml-2 text-green-600">
                          • Valid until {new Date(exam.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                      {exam.hasPurchase && exam.isExpired && exam.expiresAt && (
                        <span className="ml-2 text-red-600">
                          • Expired on {new Date(exam.expiresAt).toLocaleDateString()}
                        </span>
                      )}
                      {!exam.hasPurchase && (
                        <span className="ml-2 text-red-600">
                          • No access
                        </span>
                      )}
                    </p>

                    {!exam.hasPurchase && (
                      <div className="flex flex-col gap-2">
                        <Badge variant="outline" className="w-fit text-xs">
                          No Access
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedExamId(exam.examId)
                            setShowPurchaseDialog(true)
                          }}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Purchase Access - $25
                        </Button>
                      </div>
                    )}

                    {exam.hasPurchase && exam.isExpired && (
                      <div className="flex flex-col gap-2">
                        <Badge variant="outline" className="w-fit text-xs">
                          Access Expired
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedExamId(exam.examId)
                            setShowPurchaseDialog(true)
                          }}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Renew Access - $25
                        </Button>
                      </div>
                    )}

                    {exam.hasPurchase && !exam.isExpired && (
                      <div className="flex flex-col gap-2">
                        <Badge variant="default" className="w-fit text-xs">
                          Access Granted
                        </Badge>
                        {exam.expiresAt && (
                          <p className="text-xs text-muted-foreground">
                            Valid until: {new Date(exam.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1 ml-4">
                    {exam.sections.map((section) => (
                      <Badge key={section.sectionId} variant="outline" className="text-xs">
                        {section.title}: {!exam.hasPurchase ? "Locked" : exam.isExpired ? "Expired" : "Active"}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Actions for all available exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exams.map((exam) => (
                <div key={exam.examId} className="border rounded-lg p-3">
                  <h4 className="font-medium mb-2">{exam.title}</h4>
                  {!exam.hasPurchase || exam.isExpired ? (
                    <Button
                      className="w-full hover:cursor-pointer"
                      size="sm"
                      onClick={() => {
                        setSelectedExamId(exam.examId)
                        setShowPurchaseDialog(true)
                      }}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {exam.isExpired ? 'Renew Access - $25' : 'Purchase Access - $25'}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      {resumeStatuses[exam.examId]?.canResume ? (
                        <Button
                          className="w-full hover:cursor-pointer"
                          onClick={() => {
                            setSelectedExamId(exam.examId)
                            setShowResumeDialog(true)
                          }}
                        >
                          Resume
                        </Button>
                      ) : (
                        <Button
                          className="w-full hover:cursor-pointer"
                          onClick={() => router.push(`/exam/${exam.examId}/start`)}
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Section Overview</CardTitle>
          <CardDescription>Status of all sections across all exams</CardDescription>
        </CardHeader>
        <CardContent>
          {exams.map((exam) => (
            <div key={exam.examId} className="mb-8 last:mb-0">
              <h3 className="text-lg font-semibold mb-4 text-primary border-b pb-2">
                {exam.title}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {exam.sections.map(section => (
                  <div key={`${exam.examId}-${section.sectionId}`} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{section.title}</h4>
                      <Badge variant="outline">{exam.isExpired ? "Expired" : "Active"}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{section.questionCount} questions</p>
                    {exam.isExpired && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Access required
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Previous Attempts */}
      {previousAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Previous Attempts</CardTitle>
                <CardDescription>Your completed exam attempts</CardDescription>
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
              {previousAttempts.slice(attemptsPage * 3, (attemptsPage + 1) * 3).map((attempt, index) => {
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
                            {new Date(attempt.completedAt).toLocaleDateString()} at {attempt.completedTime}
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
                        className="hover:cursor-pointer"
                        onClick={() => router.push(`/exam/nbme20a/review?attemptId=${attempt.id}`)}
                      >
                        <BookOpen className="mr-1 h-3 w-3" />
                        Review
                      </Button>
                    </div>
                  </div>
                )
              })}

              {/* Pagination Controls */}
              {previousAttempts.length > 3 && (
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
                    Page {attemptsPage + 1} of {Math.ceil(previousAttempts.length / 3)}
                  </span>
                  <Button
                    variant="outline"
                    className="hover:cursor-pointer"
                    size="sm"
                    onClick={() => setAttemptsPage(Math.min(Math.ceil(previousAttempts.length / 3) - 1, attemptsPage + 1))}
                    disabled={attemptsPage >= Math.ceil(previousAttempts.length / 3) - 1}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exam Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>
                <TrendingUp className="mr-2 h-5 w-5 inline" />
                Exam Statistics
              </CardTitle>
              <CardDescription>Analytics for selected exam</CardDescription>
            </div>
            <Select value={selectedExamForAnalytics || 'all'} onValueChange={(value: string) => setSelectedExamForAnalytics(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select exam..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Exams</SelectItem>
                {exams.map(exam => (
                  <SelectItem key={exam.examId} value={exam.examId}>{exam.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {analytics ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm">Total Purchases</h4>
                <p className="text-2xl font-bold">{analytics.totalPurchases || 0}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm">Current Valid Access</h4>
                <p className="text-2xl font-bold">{analytics.currentValidAccess || 0}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm">Total Attempts</h4>
                <p className="text-2xl font-bold">{analytics.totalAttempts || 0}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm">Unique Users Attempted</h4>
                <p className="text-2xl font-bold">{analytics.uniqueUsersAttempted || 0}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Loading statistics...
            </div>
          )}
        </CardContent>
      </Card>

      <PurchaseDialog
        open={showPurchaseDialog}
        onOpenChange={setShowPurchaseDialog}
        examId={selectedExamId || ''}
        examTitle={exams.find(e => e.examId === selectedExamId)?.title || ''}
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
            {selectedExamId && resumeStatuses[selectedExamId]?.canResume && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">{resumeStatuses[selectedExamId].sectionTitle}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Question {resumeStatuses[selectedExamId].questionNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Time elapsed: {resumeStatuses[selectedExamId].timeElapsed}</span>
                </div>
              </div>
            )}
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
                  if (selectedExamId && resumeStatuses[selectedExamId]?.canResume) {
                    router.push(`/exam/${selectedExamId}/section/${resumeStatuses[selectedExamId].sectionId}`)
                  }
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