"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Home, Flag, FileText } from "lucide-react"
import { QuestionDisplay } from "@/components/question-display"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useQuestionStats } from "@/hooks/use-question-stats"

interface ExamReviewProps {
  params: Promise<{ examId: string }>
}

interface ReviewData {
  examId: string
  examTitle: string
  sections: {
    sectionId: string
    title: string
    questions: {
      id: string
      qid: string
      number: number
      stem: string
      images?: any
      matrix?: any
      options: { id: string; letter: string; text: string }[]
      correctOptionId: string
      explanation: string
      selectedAnswer: string | null
      flagged: boolean
      note: string | null
    }[]
  }[]
  completedAt: string
  attemptId: string
}

export default function ExamReview({ params }: ExamReviewProps) {
  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [examId, setExamId] = useState<string>('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const { isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const attemptId = searchParams.get('attemptId')

  // Get question statistics
  const { questionStats } = useQuestionStats(examId)

  // Helper function to get color classes based on success rate
  const getSuccessRateColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600 bg-green-50 border-green-200'
    if (percentage >= 40) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  // Get params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setExamId(resolvedParams.examId)
    }
    getParams()
  }, [params])

  // Fetch review data from database
  useEffect(() => {
    if (!examId || !isAuthenticated) return

    const fetchReviewData = async () => {
      try {
        setLoading(true)
        const url = attemptId
          ? `/api/exam/${examId}/review?attemptId=${attemptId}`
          : `/api/exam/${examId}/review`
        const response = await fetch(url)

        if (!response.ok) {
          throw new Error('Failed to fetch review data')
        }

        const data = await response.json()
        setReviewData(data)
      } catch (err) {
        console.error('Error fetching review data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchReviewData()
  }, [examId, isAuthenticated])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">Loading review data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-red-500">Error: {error}</p>
            <Button className="mt-4 hover:cursor-pointer" onClick={() => window.history.back()}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!reviewData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">This exam is not yet completed or cannot be reviewed.</p>
            <Button className="mt-4 hover:cursor-pointer" onClick={() => window.history.back()}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentSection = reviewData.sections[currentSectionIndex]
  const currentQuestion = currentSection.questions[currentQuestionIndex]
  const userAnswer = currentQuestion.selectedAnswer
  const isCorrect = userAnswer === currentQuestion.correctOptionId

  const jumpToQuestion = (sectionIdx: number, questionIdx: number) => {
    setCurrentSectionIndex(sectionIdx)
    setCurrentQuestionIndex(questionIdx)
  }

  const handleNext = () => {
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (currentSectionIndex < reviewData.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
      setCurrentQuestionIndex(0)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
      setCurrentQuestionIndex(reviewData.sections[currentSectionIndex - 1].questions.length - 1)
    }
  }

  const canGoNext =
    currentSectionIndex < reviewData.sections.length - 1 || currentQuestionIndex < currentSection.questions.length - 1
  const canGoPrevious = currentSectionIndex > 0 || currentQuestionIndex > 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{reviewData.examTitle} - Review</h1>
          <p className="text-muted-foreground">{currentSection.title}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Badge variant="outline">
            Section {currentSectionIndex + 1} of {reviewData.sections.length}
          </Badge>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {currentSection.questions.length}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Question Overview Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewData.sections.map((section, sectionIdx) => (
                <div key={section.sectionId}>
                  <h4 className="font-medium text-sm mb-2">{section.title}</h4>
                  <div className="grid grid-cols-5 gap-1">
                    {section.questions.map((question, questionIdx) => {
                      const userAnswer = question.selectedAnswer
                      const isCorrect = userAnswer === question.correctOptionId
                      const isCurrentQuestion =
                        sectionIdx === currentSectionIndex && questionIdx === currentQuestionIndex

                      return (
                        <div key={question.qid} className="relative mt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 text-xs",
                              isCurrentQuestion && "ring-2 ring-primary",
                              isCorrect &&
                              "bg-green-100 border-green-300 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:border-green-700 dark:text-green-100 dark:hover:bg-green-800",
                              !isCorrect &&
                              userAnswer &&
                              "bg-red-100 border-red-300 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:border-red-700 dark:text-red-100 dark:hover:bg-red-800",
                              !userAnswer &&
                              "bg-gray-100 border-gray-300 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300",
                            )}
                            onClick={() => jumpToQuestion(sectionIdx, questionIdx)}
                          >
                            {questionIdx + 1}
                          </Button>
                          <div className="absolute -top-1 flex flex-col space-y-0.5">
                            {question.flagged && (
                              <Flag className="h-3 w-3 text-orange-500 fill-orange-500" />
                            )}
                            {question.note && (
                              <FileText className="h-3 w-3 text-blue-500" />
                            )}
                          </div>
                          {/* Question Statistics */}
                          {questionStats[question.id] && (
                            <div className="absolute -bottom-1 -right-1 ">
                              {/* Success Rate */}
                              {/* <Badge className={`text-xs px-1 py-0 h-4 ${getSuccessRateColor(questionStats[question.id].percentage)}`}>
                                {questionStats[question.id].percentage}%
                              </Badge> */}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Question Display */}
        <div className="lg:col-span-2 space-y-4">
          <QuestionDisplay
            question={currentQuestion}
            selectedAnswer={userAnswer || undefined}
            onAnswerChange={() => { }} // Read-only in review mode
            isReviewMode={true}
            correctAnswer={currentQuestion.correctOptionId}
          />

          {/* Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>{isCorrect ? "Correct" : "Incorrect"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Explanation:</p>
              <p>{currentQuestion.explanation}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Answer Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className={`p-3 rounded-lg ${isCorrect
                  ? "bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-100"
                  }`}
              >
                <div className="flex items-center space-x-2">
                  {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <span className="font-medium">{isCorrect ? "Answered Correctly" : "Answered Incorrectly"}</span>
                </div>
              </div>

              {currentQuestion.note && (
                <div className="p-3 bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-lg">
                  <p className="font-medium mb-1">Your Note:</p>
                  <p className="text-sm">{currentQuestion.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Question Statistics */}
          {questionStats[currentQuestion.id] && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Question Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Success Rate:</span>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Percentage of users who answered this question correctly</p>
                    </div>
                    <Badge className={`px-2 py-1 ${getSuccessRateColor(questionStats[currentQuestion.id].percentage)}`}>
                      {questionStats[currentQuestion.id].percentage}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Attempts:</span>
                    <span className="text-sm font-medium">{questionStats[currentQuestion.id].total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Correct:</span>
                    <span className="text-sm font-medium text-green-600">{questionStats[currentQuestion.id].correct}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Incorrect:</span>
                    <span className="text-sm font-medium text-red-600">
                      {questionStats[currentQuestion.id].total - questionStats[currentQuestion.id].correct}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <Button variant="outline" className="hover:cursor-pointer" onClick={handlePrevious} disabled={!canGoPrevious}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button className="hover:cursor-pointer" onClick={handleNext} disabled={!canGoNext}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="pt-3 border-t">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Correct:</span>
                    <span className="text-green-600 font-medium">
                      {
                        reviewData ? reviewData.sections.flatMap(s => s.questions).filter(q =>
                          q.selectedAnswer === q.correctOptionId
                        ).length : 0
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incorrect:</span>
                    <span className="text-red-600 font-medium">
                      {
                        reviewData ? reviewData.sections.flatMap(s => s.questions).filter(q =>
                          q.selectedAnswer && q.selectedAnswer !== q.correctOptionId
                        ).length : 0
                      }
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
