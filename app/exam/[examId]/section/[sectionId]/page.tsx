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
import { Flag, StickyNote, Send, Clock, Play, Pause, Home, Eye, EyeOff } from "lucide-react"
import { QuestionDisplay } from "@/components/question-display"
import { QuestionNavigation } from "@/components/question-navigation"
import { useAuth } from "@/lib/auth-context"
import { useQuestionStats } from "@/hooks/use-question-stats"

interface ExamRunnerProps {
  params: Promise<{ examId: string; sectionId: string }>
}

interface Question {
  id: string
  stem: string
  number: number
  options: Array<{
    id: string
    text: string
    letter: string
  }>
}

interface Section {
  id: string
  sectionId: string
  title: string
  questions: Question[]
}

interface Response {
  questionId: string
  optionId?: string
  answer?: any
  isFlagged?: boolean
  note?: string
}

interface SectionData {
  section: Section
  attempt: {
    id: string
    startedAt: string
    pausedAt?: string
    totalPausedTime?: number
  }
  sectionAttempt: {
    id: string
    responses: Response[]
  }
}

export default function ExamRunner({ params }: ExamRunnerProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [examId, setExamId] = useState<string>("")
  const [sectionId, setSectionId] = useState<string>("")
  const [sectionData, setSectionData] = useState<SectionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [currentNote, setCurrentNote] = useState("")
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [isPaused, setIsPaused] = useState(false)
  const [struckThroughOptions, setStruckThroughOptions] = useState<{ [questionId: string]: string[] }>({}) // Track strikethrough per question
  const [showStatistics, setShowStatistics] = useState(false) // Toggle for question statistics

  // Get question statistics
  const { questionStats } = useQuestionStats(examId)

  // Helper function to format seconds to time string
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
  }

  // Helper function to get color classes based on success rate
  const getSuccessRateColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600 bg-green-50 border-green-200'
    if (percentage >= 40) return 'text-orange-600 bg-orange-50 border-orange-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  // Extract params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setExamId(resolvedParams.examId)
      setSectionId(resolvedParams.sectionId)
    }
    getParams()
  }, [params])

  // Fetch section data
  useEffect(() => {
    if (!examId || !sectionId || !isAuthenticated) return

    const fetchSectionData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get section data (this will create attempt automatically if needed)
        const sectionResponse = await fetch(`/api/exam/${examId}/section/${sectionId}`)

        if (!sectionResponse.ok) {
          throw new Error('Failed to fetch section data')
        }

        const data = await sectionResponse.json()
        setSectionData(data)

        // Set initial timer state from database
        setElapsedSeconds(data.attempt.elapsedSeconds || 0)
        setIsPaused(data.attempt.isPaused || false)

        // If exam is paused, auto-resume when user returns
        if (data.attempt.isPaused) {
          const resumeResponse = await fetch(`/api/exam/${examId}/attempt`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resume' }),
          })

          if (resumeResponse.ok) {
            setIsPaused(false)
          }
        }

        // Resume at the saved question index
        setCurrentQuestionIndex(data.sectionAttempt.currentQuestionIndex || 0)

      } catch (err) {
        console.error('Error fetching section data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSectionData()
  }, [examId, sectionId, isAuthenticated])

  // Timer effect - only runs when NOT paused and attempt is NOT paused in database
  // Simple timer effect - just count seconds
  useEffect(() => {
    if (isPaused) return

    const timer = setInterval(() => {
      setElapsedSeconds(prev => {
        const newSeconds = prev + 1

        // Save to database every 10 seconds to reduce API calls
        if (newSeconds % 10 === 0) {
          fetch(`/api/exam/${examId}/attempt`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'updateTime',
              elapsedSeconds: newSeconds
            }),
          }).catch(console.error)
        }

        return newSeconds
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isPaused, examId])



  const updateSection = async (action: string, data: any) => {
    try {
      const response = await fetch(`/api/exam/${examId}/section/${sectionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      })

      if (!response.ok) {
        throw new Error('Failed to update section')
      }
    } catch (err) {
      console.error('Error updating section:', err)
    }
  }

  const handleAnswerChange = async (answerId: string) => {
    if (!sectionData?.section.questions[currentQuestionIndex]) return

    const questionId = sectionData.section.questions[currentQuestionIndex].id
    await updateSection('answer', { questionId, optionId: answerId })

    // Update local state optimistically
    setSectionData(prev => {
      if (!prev) return prev
      const newResponses = [...prev.sectionAttempt.responses]
      const existingIndex = newResponses.findIndex(r => r.questionId === questionId)

      if (existingIndex >= 0) {
        (newResponses[existingIndex] as any).optionId = answerId
          ; (newResponses[existingIndex] as any).answer = answerId
      } else {
        newResponses.push({ questionId, optionId: answerId } as any)
      }

      return {
        ...prev,
        sectionAttempt: {
          ...prev.sectionAttempt,
          responses: newResponses
        }
      }
    })
  }

  const handleFlagToggle = async () => {
    if (!sectionData?.section.questions[currentQuestionIndex]) return

    const questionId = sectionData.section.questions[currentQuestionIndex].id
    const currentResponse = sectionData.sectionAttempt.responses.find(r => r.questionId === questionId)
    const newFlag = !currentResponse?.isFlagged

    await updateSection('flag', { questionId, flag: newFlag })

    // Update local state optimistically
    setSectionData(prev => {
      if (!prev) return prev
      const newResponses = [...prev.sectionAttempt.responses]
      const existingIndex = newResponses.findIndex(r => r.questionId === questionId)

      if (existingIndex >= 0) {
        newResponses[existingIndex] = { ...newResponses[existingIndex], isFlagged: newFlag, flagged: newFlag } as any
      } else {
        newResponses.push({ questionId, isFlagged: newFlag, flagged: newFlag } as any)
      }

      return {
        ...prev,
        sectionAttempt: {
          ...prev.sectionAttempt,
          responses: newResponses
        }
      }
    })
  }

  const handleNoteChange = async (note: string) => {
    if (!sectionData?.section.questions[currentQuestionIndex]) return

    const questionId = sectionData.section.questions[currentQuestionIndex].id
    await updateSection('note', { questionId, note })

    // Update local state optimistically
    setSectionData(prev => {
      if (!prev) return prev
      const newResponses = [...prev.sectionAttempt.responses]
      const existingIndex = newResponses.findIndex(r => r.questionId === questionId)

      if (existingIndex >= 0) {
        newResponses[existingIndex] = { ...newResponses[existingIndex], note }
      } else {
        newResponses.push({ questionId, note })
      }

      return {
        ...prev,
        sectionAttempt: {
          ...prev.sectionAttempt,
          responses: newResponses
        }
      }
    })
  }

  const handleToggleStrikethrough = (optionId: string) => {
    if (!sectionData?.section.questions[currentQuestionIndex]) return

    const questionId = sectionData.section.questions[currentQuestionIndex].id

    setStruckThroughOptions(prev => {
      const currentStruckThrough = prev[questionId] || []
      const isStruckThrough = currentStruckThrough.includes(optionId)

      if (isStruckThrough) {
        // Remove from struck through
        return {
          ...prev,
          [questionId]: currentStruckThrough.filter(id => id !== optionId)
        }
      } else {
        // Add to struck through
        return {
          ...prev,
          [questionId]: [...currentStruckThrough, optionId]
        }
      }
    })
  }

  const handleQuestionSelect = (questionNumber: number) => {
    setCurrentQuestionIndex(questionNumber - 1)
    // Persist progress
    updateSection('progress', { currentQuestionIndex: questionNumber - 1 })
  }

  const handleNext = () => {
    if (!sectionData) return

    if (currentQuestionIndex < sectionData.section.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      updateSection('progress', { currentQuestionIndex: nextIndex })
    } else {
      setShowSubmitDialog(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(prevIndex)
      updateSection('progress', { currentQuestionIndex: prevIndex })
    }
  }

  const handleSubmitSection = async () => {
    if (!sectionData) return

    const unanswered = getUnansweredQuestions()
    if (unanswered.length > 0) {
      alert(`You still need to answer ${unanswered.length} questions: ${unanswered.join(", ")}`)
      return
    }

    // Complete this section
    await updateSection('complete', {})

    // Pause the exam timer and save elapsed time
    await fetch(`/api/exam/${examId}/attempt`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'pause',
        elapsedSeconds
      }),
    })

    // For now, let's assume there are more sections and go to break
    // In a real implementation, you'd check if there are more sections
    router.push(`/exam/${examId}/section/${sectionId}/break`)
  }

  const openNoteDialog = () => {
    if (!sectionData?.section.questions[currentQuestionIndex]) return

    const questionId = sectionData.section.questions[currentQuestionIndex].id
    const response = sectionData.sectionAttempt.responses.find(r => r.questionId === questionId)
    setCurrentNote(response?.note || "")
    setShowNoteDialog(true)
  }

  const saveNote = () => {
    handleNoteChange(currentNote)
    setShowNoteDialog(false)
  }

  const handleLeaveForNow = async () => {
    try {
      // Stop timer immediately
      setIsPaused(true)

      // Save current progress
      await updateSection('progress', { currentQuestionIndex })

      // Pause in database with current elapsed time
      await fetch(`/api/exam/${examId}/attempt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pause',
          elapsedSeconds
        }),
      })

      router.push("/")
    } catch (error) {
      console.error('Error pausing exam:', error)
      router.push("/") // Still navigate away even if pause fails
    }
  }

  const handlePauseResume = async () => {
    try {
      const newPausedState = !isPaused

      // Update UI immediately
      setIsPaused(newPausedState)

      // Save to database
      const response = await fetch(`/api/exam/${examId}/attempt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newPausedState ? 'pause' : 'resume',
          elapsedSeconds
        }),
      })

      if (!response.ok) {
        // Revert UI if database save failed
        setIsPaused(!newPausedState)
      }
    } catch (err) {
      console.error('Error toggling pause:', err)
      // Revert UI state on error
      setIsPaused(!isPaused)
    }
  }

  const getUnansweredQuestions = () => {
    if (!sectionData) return []

    return sectionData.section.questions
      .map((q, index) => ({ question: q, index }))
      .filter(({ question }) => {
        return !sectionData.sectionAttempt.responses.find(r => r.questionId === question.id && r.answer)
      })
      .map(({ index }) => index + 1)
  }

  // Loading states
  if (authLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="h-16 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 bg-muted animate-pulse rounded-lg" />
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <p>Please log in to access this exam.</p>
        <Button asChild className="mt-4">
          <a href="/login">Go to Login</a>
        </Button>
      </div>
    )
  }

  if (error || !sectionData) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <h1 className="text-2xl font-bold text-red-600">Section Not Found</h1>
        <p className="text-muted-foreground mt-2">{error || "The requested section could not be found."}</p>
        <Button asChild className="mt-4">
          <a href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </a>
        </Button>
      </div>
    )
  }

  const currentQuestion = sectionData.section.questions[currentQuestionIndex]
  const currentResponse = sectionData.sectionAttempt.responses.find(r => r.questionId === currentQuestion.id)

  // Create compatibility objects for existing components
  const questionForDisplay = {
    number: currentQuestion.number,
    stem: currentQuestion.stem,
    options: currentQuestion.options.map(opt => ({ id: opt.letter, text: opt.text })),
    matrix: (currentQuestion as any).matrix || undefined,
    image: (currentQuestion as any).images || undefined,
  } as any

  const answersForNav = sectionData.section.questions.reduce((acc, q) => {
    const response = sectionData.sectionAttempt.responses.find(r => r.questionId === q.id)
    const val = (response as any)?.answer
    if (val) acc[q.id] = val as string
    return acc
  }, {} as Record<string, string>)

  const flagsForNav = sectionData.section.questions.reduce((acc, q) => {
    const response = sectionData.sectionAttempt.responses.find(r => r.questionId === q.id)
    if ((response as any)?.flagged) {
      acc[q.id] = true
    }
    return acc
  }, {} as Record<string, boolean>)

  const notesForNav = sectionData.section.questions.reduce((acc, q) => {
    const response = sectionData.sectionAttempt.responses.find(r => r.questionId === q.id)
    if (response?.note) {
      acc[q.id] = true
    }
    return acc
  }, {} as Record<string, boolean>)

  const questionsForNav = sectionData.section.questions.map(q => ({ id: q.id }))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Medical Exam</h1>
          <p className="text-muted-foreground">{sectionData.section.title}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${isPaused ? "bg-orange-100 border-orange-300" : "bg-primary/10"
              }`}
          >
            <Clock className={`h-5 w-5 ${isPaused ? "text-orange-600" : "text-primary"}`} />
            <span className={`font-mono text-lg font-semibold ${isPaused ? "text-orange-600" : "text-primary"}`}>
              {formatTime(elapsedSeconds)} {isPaused && "(PAUSED)"}
            </span>
            <Button variant="ghost" size="sm" onClick={handlePauseResume} className="ml-2 p-1 h-8 w-8">
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
          </div>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {sectionData.section.questions.length}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuestionDisplay
            question={questionForDisplay}
            selectedAnswer={(currentResponse as any)?.answer}
            onAnswerChange={handleAnswerChange}
            struckThroughOptions={struckThroughOptions[currentQuestion.id] || []}
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
                variant={(currentResponse as any)?.flagged ? "destructive" : "outline"}
                className="w-full hover:cursor-pointer"
                onClick={handleFlagToggle}
              >
                <Flag className={`mr-2 h-4 w-4 ${(currentResponse as any)?.flagged ? "fill-current" : ""}`} />
                {(currentResponse as any)?.flagged ? "Unflag" : "Flag"}
              </Button>
              <Button
                variant={(currentResponse as any)?.note ? "secondary" : "outline"}
                className="w-full hover:cursor-pointer"
                onClick={openNoteDialog}
              >
                <StickyNote className={`mr-2 h-4 w-4 ${(currentResponse as any)?.note ? "fill-current" : ""}`} />
                {(currentResponse as any)?.note ? "Edit Note" : "Add Note"}
              </Button>
              <Button className="w-full hover:cursor-pointer" onClick={() => setShowSubmitDialog(true)}>
                <Send className="mr-2 h-4 w-4" />
                Submit Section
              </Button>
              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground hover:cursor-pointer border dark:text-white dark:border-white text-black"
                  onClick={handleLeaveForNow}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Come back later
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">Your progress will be saved</p>
              </div>
            </CardContent>
          </Card>

          {/* Question Statistics Toggle */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Question Statistics</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStatistics(!showStatistics)}
                  className="ml-2"
                >
                  {showStatistics ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showStatistics && currentQuestion && questionStats[currentQuestion.id] && (
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate:</span>
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
            )}
          </Card>

          <QuestionNavigation
            currentQuestion={currentQuestionIndex + 1}
            totalQuestions={sectionData.section.questions.length}
            questions={questionsForNav}
            answers={answersForNav}
            flags={flagsForNav}
            notes={notesForNav}
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
            <Button variant="outline" className="hover:cursor-pointer" onClick={() => setShowSubmitDialog(false)}>
              Back
            </Button>
            <Button className="hover:cursor-pointer" onClick={handleSubmitSection}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}