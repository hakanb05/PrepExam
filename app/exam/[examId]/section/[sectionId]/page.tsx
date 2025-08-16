"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Flag, StickyNote, Send, Clock, Play, Pause, Home } from "lucide-react"
import { getExamData } from "@/lib/exam-data"
import {
  getExamProgress,
  saveExamProgress,
  toggleStrikethrough,
  getTotalExamDuration,
  pauseExamTimer,
  resumeExamTimer,
} from "@/lib/storage"
import { QuestionDisplay } from "@/components/question-display"
import { QuestionNavigation } from "@/components/question-navigation"
import type { ExamProgress } from "@/lib/types"

interface ExamRunnerProps {
  params: { examId: string; sectionId: string }
}

export default function ExamRunner({ params }: ExamRunnerProps) {
  const router = useRouter()
  const examData = getExamData()
  const section = examData.sections.find((s) => s.sectionId === params.sectionId)
  const sectionIndex = examData.sections.findIndex((s) => s.sectionId === params.sectionId)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [progress, setProgress] = useState<ExamProgress | null>(null)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [currentNote, setCurrentNote] = useState("")
  const [totalTime, setTotalTime] = useState<string>("0:00")
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    const currentProgress = getExamProgress(params.examId)
    if (currentProgress) {
      const isCurrentlyPaused = !!currentProgress.pausedAt || isPaused
      setIsPaused(isCurrentlyPaused)

      // Only start timer if not paused
      if (!isCurrentlyPaused) {
        timer = setInterval(() => {
          const latestProgress = getExamProgress(params.examId)
          if (latestProgress && !latestProgress.pausedAt) {
            setTotalTime(getTotalExamDuration(latestProgress))
          }
        }, 1000)
      }

      // Set initial time display
      setTotalTime(getTotalExamDuration(currentProgress))
    }

    return () => {
      if (timer) {
        clearInterval(timer)
      }
    }
  }, [progress?.pausedAt, isPaused, params.examId])

  useEffect(() => {
    const savedProgress = getExamProgress(params.examId) || {
      examId: params.examId,
      answers: {},
      flags: {},
      notes: {},
      strikethrough: {},
      sectionStatus: {},
      currentSectionId: params.sectionId,
      currentQuestionIndex: 0,
      startedAt: new Date().toISOString(),
    }

    savedProgress.sectionStatus[params.sectionId] = "in-progress"
    savedProgress.currentSectionId = params.sectionId

    const isCurrentlyPaused = !!savedProgress.pausedAt
    setIsPaused(isCurrentlyPaused)
    setTotalTime(getTotalExamDuration(savedProgress))

    setProgress(savedProgress)
    setCurrentQuestionIndex(0)
    saveExamProgress(savedProgress)
  }, [params.examId, params.sectionId])

  const handleAnswerChange = (answerId: string) => {
    if (!progress) return

    const newProgress = {
      ...progress,
      answers: { ...progress.answers, [questionId]: answerId },
      currentQuestionIndex,
      currentSectionId: params.sectionId,
    }
    setProgress(newProgress)
    saveExamProgress(newProgress)
  }

  const handleFlagToggle = () => {
    if (!progress) return

    const newProgress = {
      ...progress,
      flags: { ...progress.flags, [questionId]: !progress.flags[questionId] },
    }
    setProgress(newProgress)
    saveExamProgress(newProgress)
  }

  const handleNoteChange = (note: string) => {
    if (!progress) return

    const newProgress = {
      ...progress,
      notes: { ...progress.notes, [questionId]: note },
    }
    setProgress(newProgress)
    saveExamProgress(newProgress)
  }

  const handleToggleStrikethrough = (optionId: string) => {
    if (!progress) return

    toggleStrikethrough(params.examId, questionId, optionId)
    const updatedProgress = getExamProgress(params.examId)
    if (updatedProgress) {
      setProgress(updatedProgress)
    }
  }

  const handleQuestionSelect = (questionNumber: number) => {
    setCurrentQuestionIndex(questionNumber - 1)
  }

  const handleNext = () => {
    if (currentQuestionIndex < section.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowSubmitDialog(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSubmitSection = () => {
    if (!progress) return

    const unanswered = getUnansweredQuestions()
    if (unanswered.length > 0) {
      alert(`You still need to answer ${unanswered.length} questions: ${unanswered.join(", ")}`)
      return
    }

    pauseExamTimer(params.examId)
    setIsPaused(true)

    const completedProgress = {
      ...progress,
      sectionStatus: { ...progress.sectionStatus, [params.sectionId]: "completed" as const },
    }

    const nextSection = examData.sections[sectionIndex + 1]
    if (nextSection) {
      saveExamProgress(completedProgress)
      router.push(`/exam/${params.examId}/section/${params.sectionId}/break`)
    } else {
      completedProgress.completedAt = new Date().toISOString()
      saveExamProgress(completedProgress)
      router.push(`/exam/${params.examId}/results`)
    }
  }

  const openNoteDialog = () => {
    if (!progress) return

    setCurrentNote(progress.notes[questionId] || "")
    setShowNoteDialog(true)
  }

  const saveNote = () => {
    handleNoteChange(currentNote)
    setShowNoteDialog(false)
  }

  const handlePauseResume = () => {
    if (!progress) return

    if (isPaused || progress.pausedAt) {
      resumeExamTimer(params.examId)
      setIsPaused(false)
      const updatedProgress = getExamProgress(params.examId)
      if (updatedProgress) {
        setProgress(updatedProgress)
      }
    } else {
      pauseExamTimer(params.examId)
      setIsPaused(true)
      const updatedProgress = getExamProgress(params.examId)
      if (updatedProgress) {
        setProgress(updatedProgress)
      }
    }
  }

  const getUnansweredQuestions = () => {
    if (!progress || !section) return []

    return section.questions
      .map((q, index) => ({ question: q, index }))
      .filter(({ question }) => !progress.answers[question.qid])
      .map(({ index }) => index + 1)
  }

  if (!section || !progress) {
    return <div>Loading...</div>
  }

  const currentQuestion = section.questions[currentQuestionIndex]
  const questionId = currentQuestion.qid

  const notesBoolean = Object.keys(progress.notes).reduce(
    (acc, key) => {
      acc[key] = !!progress.notes[key]
      return acc
    },
    {} as Record<string, boolean>,
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{examData.title}</h1>
          <p className="text-muted-foreground">{section.title}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
              isPaused ? "bg-orange-100 border-orange-300" : "bg-primary/10"
            }`}
          >
            <Clock className={`h-5 w-5 ${isPaused ? "text-orange-600" : "text-primary"}`} />
            <span className={`font-mono text-lg font-semibold ${isPaused ? "text-orange-600" : "text-primary"}`}>
              {totalTime} {isPaused && "(PAUSED)"}
            </span>
            <Button variant="ghost" size="sm" onClick={handlePauseResume} className="ml-2 p-1 h-8 w-8">
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          </div>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {section.questions.length}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuestionDisplay
            question={currentQuestion}
            selectedAnswer={progress.answers[questionId]}
            onAnswerChange={handleAnswerChange}
            struckThroughOptions={progress.strikethrough?.[questionId] || []}
            onToggleStrikethrough={handleToggleStrikethrough}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant={progress.flags[questionId] ? "destructive" : "outline"}
                className="w-full"
                onClick={handleFlagToggle}
              >
                <Flag className={`mr-2 h-4 w-4 ${progress.flags[questionId] ? "fill-current" : ""}`} />
                {progress.flags[questionId] ? "Unflag" : "Flag"}
              </Button>
              <Button
                variant={progress.notes[questionId] ? "secondary" : "outline"}
                className="w-full"
                onClick={openNoteDialog}
              >
                <StickyNote className={`mr-2 h-4 w-4 ${progress.notes[questionId] ? "fill-current" : ""}`} />
                {progress.notes[questionId] ? "Edit Note" : "Add Note"}
              </Button>
              <Button className="w-full" onClick={() => setShowSubmitDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                Submit Section
              </Button>
              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => router.push("/")}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Come back later
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">Your progress will be saved</p>
              </div>
            </CardContent>
          </Card>

          <QuestionNavigation
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={section.questions.length}
            questions={section.questions}
            answers={progress.answers}
            flags={progress.flags}
            notes={notesBoolean}
            onQuestionSelect={handleQuestionSelect}
            onPrevious={handlePrevious}
            onNext={handleNext}
            canGoNext={true}
            canGoPrevious={currentQuestionIndex > 0}
          />
        </div>
      </div>

      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Note for Question {currentQuestionIndex + 1}</DialogTitle>
            <DialogDescription>Add a personal note for this question.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={currentNote}
            onChange={(e) => setCurrentNote(e.target.value)}
            placeholder="Type your note here..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveNote}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Section</DialogTitle>
            <DialogDescription>
              {getUnansweredQuestions().length > 0 ? (
                <>
                  You still have {getUnansweredQuestions().length} unanswered questions:{" "}
                  {getUnansweredQuestions().join(", ")}.
                  <br />
                  Are you sure you want to proceed to the next section? You cannot return to this section.
                </>
              ) : (
                "Are you sure you want to proceed to the next section? You cannot return to this section."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Back
            </Button>
            <Button onClick={handleSubmitSection}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}