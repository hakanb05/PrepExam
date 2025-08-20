"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RotateCcw, Eye, Clock, Target, TrendingUp } from "lucide-react"
import { CircularProgress } from "@/components/circular-progress"
import { useAuth } from "@/lib/auth-context"

interface ResultsPageProps {
  params: Promise<{ examId: string }>
}

interface ResultsData {
  examId: string
  examTitle: string
  overallPercent: number
  correctAnswers: number
  totalQuestions: number
  duration: string
  categories: { name: string; percent: number; correct: number; total: number }[]
  completedAt: string
  attemptId: string
}

export default function ExamResultsPage({ params }: ResultsPageProps) {
  const [results, setResults] = useState<ResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [examId, setExamId] = useState<string>('')
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    const blockNavigation = () => {
      window.history.pushState(null, "", window.location.href)
    }

    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      window.history.pushState(null, "", window.location.href)
    }

    // Push current state to prevent back navigation
    window.history.pushState(null, "", window.location.href)
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  // Get params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setExamId(resolvedParams.examId)
    }
    getParams()
  }, [params])

  // Fetch results from database
  useEffect(() => {
    if (!examId || !isAuthenticated) return

    const fetchResults = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/exam/${examId}/results`)

        if (!response.ok) {
          throw new Error('Failed to fetch results')
        }

        const data = await response.json()
        setResults(data)
      } catch (err) {
        console.error('Error fetching results:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [examId, isAuthenticated])

  const handleRetakeExam = () => {
    window.location.href = `/exam/${examId}/start`
  }

  const handleReviewExam = () => {
    window.location.href = `/exam/${examId}/review`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">Loading results...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center">No results found</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Exam Results</h1>
        <p className="text-muted-foreground">{results.examTitle}</p>
      </div>

      {/* Top Results Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.image || "/placeholder.svg"} alt={user?.name || "User"} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{user?.name || "User"}</h2>
                <div className="flex items-center space-x-6 text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Score: {results.correctAnswers}/{results.totalQuestions}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Duration: {results.duration}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <CircularProgress percentage={results.overallPercent} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Placeholders */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">{results.overallPercent}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Correct Answers</p>
                <p className="text-2xl font-bold">{results.correctAnswers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <p className="text-2xl font-bold">{results.duration}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Category</CardTitle>
          <CardDescription>Your score per medical specialty</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.categories.map((category) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{category.name}</span>
                  <span className={`font-bold ${category.percent >= 70 ? 'text-green-600' : category.percent >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>{category.percent}%</span>
                </div>
                <div className="relative">
                  <Progress value={category.percent} className="h-2" />
                  <div
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${category.percent >= 70 ? 'bg-green-500' : category.percent >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${category.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Answer Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Answer Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Badge variant="default" className="px-4 py-2">
              Correct ({results.correctAnswers})
            </Badge>
            <Badge variant="destructive" className="px-4 py-2">
              Incorrect ({results.totalQuestions - results.correctAnswers})
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Call to Actions */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" size="lg" className="hover:cursor-pointer" onClick={handleReviewExam}>
          <Eye className="mr-2 h-4 w-4" />
          Review Exam
        </Button>
        <Button size="lg" className="hover:cursor-pointer" onClick={handleRetakeExam}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Retake Exam
        </Button>
      </div>
    </div>
  )
}
