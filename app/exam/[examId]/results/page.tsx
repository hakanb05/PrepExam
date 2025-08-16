"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RotateCcw, Eye, Clock, Target, TrendingUp } from "lucide-react"
import { getExamData, mockUser } from "@/lib/exam-data"
import { getExamProgress, clearExamProgress, saveExamResult } from "@/lib/storage"
import { calculateExamResults, getCategoryColor, getCategoryBgColor } from "@/lib/results-calculator"
import { CircularProgress } from "@/components/circular-progress"
import type { ExamResult } from "@/lib/types"

interface ResultsPageProps {
  params: { examId: string }
}

export default function ExamResultsPage({ params }: ResultsPageProps) {
  const [results, setResults] = useState<ExamResult | null>(null)
  const examData = getExamData()

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

  useEffect(() => {
    const progress = getExamProgress(params.examId)
    if (progress) {
      const calculatedResults = calculateExamResults(examData, progress)
      setResults(calculatedResults)
      saveExamResult(calculatedResults)
    }
  }, [params.examId, examData])

  const handleRetakeExam = () => {
    clearExamProgress(params.examId)
    window.location.href = `/exam/${params.examId}/start`
  }

  const handleReviewExam = () => {
    window.location.href = `/exam/${params.examId}/review`
  }

  if (!results) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Exam Results</h1>
        <p className="text-muted-foreground">{examData.title}</p>
      </div>

      {/* Top Results Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={mockUser.avatar || "/placeholder.svg"} alt={mockUser.name} />
                <AvatarFallback>OB</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{mockUser.name}</h2>
                <div className="flex items-center space-x-6 text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4" />
                    <span className="font-medium">Points: {results.points}</span>
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
                <p className="text-2xl font-bold">{results.answers.correct}</p>
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
                  <span className={`font-bold ${getCategoryColor(category.percent)}`}>{category.percent}%</span>
                </div>
                <div className="relative">
                  <Progress value={category.percent} className="h-2" />
                  <div
                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getCategoryBgColor(category.percent)}`}
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
              Correct ({results.answers.correct})
            </Badge>
            <Badge variant="destructive" className="px-4 py-2">
              Incorrect ({results.answers.incorrect})
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Call to Actions */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" size="lg" onClick={handleReviewExam}>
          <Eye className="mr-2 h-4 w-4" />
          Review Exam
        </Button>
        <Button size="lg" onClick={handleRetakeExam}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Retake Exam
        </Button>
      </div>
    </div>
  )
}
