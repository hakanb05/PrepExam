"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, ChevronLeft, ChevronRight, Home } from "lucide-react"
import { getExamData } from "@/lib/exam-data"
import { getExamProgress } from "@/lib/storage"
import { QuestionDisplay } from "@/components/question-display"
import { cn } from "@/lib/utils"
import type { ExamProgress } from "@/lib/types"

interface ExamReviewProps {
  params: { examId: string }
}

export default function ExamReview({ params }: ExamReviewProps) {
  const examData = getExamData()
  const [progress, setProgress] = useState<ExamProgress | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)

  useEffect(() => {
    const savedProgress = getExamProgress(params.examId)
    if (savedProgress && savedProgress.completedAt) {
      setProgress(savedProgress)
    }
  }, [params.examId])

  if (!progress) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">This exam is not yet completed or cannot be reviewed.</p>
            <Button className="mt-4" onClick={() => window.history.back()}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentSection = examData.sections[currentSectionIndex]
  const currentQuestion = currentSection.questions[currentQuestionIndex]
  const userAnswer = progress.answers[currentQuestion.qid]
  const isCorrect = userAnswer === currentQuestion.correctOptionId

  const jumpToQuestion = (sectionIdx: number, questionIdx: number) => {
    setCurrentSectionIndex(sectionIdx)
    setCurrentQuestionIndex(questionIdx)
  }

  const handleNext = () => {
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (currentSectionIndex < examData.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
      setCurrentQuestionIndex(0)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1)
      setCurrentQuestionIndex(examData.sections[currentSectionIndex - 1].questions.length - 1)
    }
  }

  const canGoNext =
    currentSectionIndex < examData.sections.length - 1 || currentQuestionIndex < currentSection.questions.length - 1
  const canGoPrevious = currentSectionIndex > 0 || currentQuestionIndex > 0

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{examData.title} - Review</h1>
          <p className="text-muted-foreground">{currentSection.title}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Your progress will be stored for when you come back</p>
            <Button variant="outline" size="sm" asChild>
              <a href="/">
                <Home className="mr-2 h-4 w-4" />
                Come back later
              </a>
            </Button>
          </div>
          <Badge variant="outline">
            Section {currentSectionIndex + 1} of {examData.sections.length}
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
              {examData.sections.map((section, sectionIdx) => (
                <div key={section.sectionId}>
                  <h4 className="font-medium text-sm mb-2">{section.title}</h4>
                  <div className="grid grid-cols-5 gap-1">
                    {section.questions.map((question, questionIdx) => {
                      const userAnswer = progress.answers[question.qid]
                      const isCorrect = userAnswer === question.correctOptionId
                      const isCurrentQuestion =
                        sectionIdx === currentSectionIndex && questionIdx === currentQuestionIndex

                      return (
                        <Button
                          key={question.qid}
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
            selectedAnswer={userAnswer}
            onAnswerChange={() => {}} // Read-only in review mode
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
                className={`p-3 rounded-lg ${
                  isCorrect
                    ? "bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100"
                    : "bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-100"
                }`}
              >
                <div className="flex items-center space-x-2">
                  {isCorrect ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  <span className="font-medium">{isCorrect ? "Answered Correctly" : "Answered Incorrectly"}</span>
                </div>
              </div>

              {progress.notes[currentQuestion.qid] && (
                <div className="p-3 bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100 rounded-lg">
                  <p className="font-medium mb-1">Your Note:</p>
                  <p className="text-sm">{progress.notes[currentQuestion.qid]}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious} disabled={!canGoPrevious}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button onClick={handleNext} disabled={!canGoNext}>
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
                        Object.keys(progress.answers).filter((qid) => {
                          const question = examData.sections.flatMap((s) => s.questions).find((q) => q.qid === qid)
                          return question && progress.answers[qid] === question.correctOptionId
                        }).length
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incorrect:</span>
                    <span className="text-red-600 font-medium">
                      {
                        Object.keys(progress.answers).filter((qid) => {
                          const question = examData.sections.flatMap((s) => s.questions).find((q) => q.qid === qid)
                          return question && progress.answers[qid] !== question.correctOptionId
                        }).length
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
