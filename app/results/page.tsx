"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Calendar, TrendingUp, Users, BarChart3, ArrowRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface ExamData {
  id: string
  examId: string
  title: string
  description: string
  completedAttempts: number
  latestScore: number | null
  latestAttemptDate: string | null
}

export default function ResultsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [exams, setExams] = useState<ExamData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    const fetchExams = async () => {
      try {
        const response = await fetch('/api/exams', {
          credentials: 'include'
        })
        if (!response.ok) {
          throw new Error('Failed to fetch exams')
        }

        const data = await response.json()
        setExams(data.exams)
      } catch (err) {
        console.error('Error fetching exams:', err)
        setError('Failed to load exam data')
      } finally {
        setLoading(false)
      }
    }

    fetchExams()
  }, [isAuthenticated, authLoading, router])

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-500'
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number | null) => {
    if (score === null) return 'secondary'
    if (score >= 70) return 'default'
    if (score >= 40) return 'secondary'
    return 'destructive'
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your exam results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Exam Results</h1>
          <p className="text-red-600">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  const examsWithAttempts = exams.filter(exam => exam.completedAttempts > 0)

  if (examsWithAttempts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">My Exam Results</h1>
          <p className="text-muted-foreground">Here you can find all your completed exams and results</p>
        </div>
        <Card className="p-12">
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">No completed exams yet</h3>
              <p className="text-muted-foreground">
                You haven't completed any exams yet. Start your first exam to see your results here.
              </p>
            </div>
            <Button asChild>
              <a href="/exams">Go to Exams</a>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Exam Results</h1>
        <p className="text-muted-foreground">Overview of all your completed exams</p>
      </div>

      <div className="grid gap-6">
        {examsWithAttempts.map((exam) => (
          <Card key={exam.examId} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {exam.title}
                      {exam.isExpired && (
                        <Badge variant="destructive" className="text-xs">
                          Expired
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center space-x-4 mt-1">
                      <span key="attempts" className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{exam.completedAttempts} attempt{exam.completedAttempts !== 1 ? 's' : ''}</span>
                      </span>
                      {exam.latestAttemptDate && (
                        <span key="last-attempt" className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Last: {new Date(exam.latestAttemptDate).toLocaleDateString("en-US")}</span>
                        </span>
                      )}
                      {exam.latestScore !== null && (
                        <span key="latest-score" className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4" />
                          <span className={getScoreColor(exam.latestScore)}>
                            Latest: {exam.latestScore}%
                          </span>
                        </span>
                      )}
                      {exam.isExpired && exam.expiresAt && (
                        <span key="expired-date" className="flex items-center space-x-1 text-red-600">
                          <span>Expired: {new Date(exam.expiresAt).toLocaleDateString("en-US")}</span>
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {exam.latestScore !== null && (
                    <Badge variant={getScoreBadgeVariant(exam.latestScore)}>
                      {exam.latestScore}%
                    </Badge>
                  )}
                  <Button
                    onClick={() => router.push(`/results/${exam.examId}`)}
                    className="flex items-center space-x-2 hover:cursor-pointer"
                  >
                    <BarChart3 className="h-4 w-4" />
                    <span>View all results</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}