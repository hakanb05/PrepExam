"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, Coffee, ArrowRight, Home, BookOpen, Play } from "lucide-react"

// Break page now uses server state via API rather than local storage

export default function SectionBreakPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string
  const currentSectionId = params.sectionId as string

  const [attempt, setAttempt] = useState<any>(null)
  const [nextSection, setNextSection] = useState<any>(null)
  const [totalTime, setTotalTime] = useState<string>("0:00")
  const [showResumeDialog, setShowResumeDialog] = useState(false)

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

  useEffect(() => {
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
    const load = async () => {
      // fetch current attempt and section info
      const sectionRes = await fetch(`/api/exam/${examId}/section/${currentSectionId}`)
      if (sectionRes.ok) {
        const data = await sectionRes.json()
        setAttempt(data.attempt)
        // compute next section based on returned section list from exam endpoint
        const examRes = await fetch(`/api/exam/${examId}`)
        if (examRes.ok) {
          const exam = await examRes.json()
          const idx = exam.sections.findIndex((s: any) => s.sectionId === currentSectionId)
          if (idx >= 0 && idx < exam.sections.length - 1) setNextSection(exam.sections[idx + 1])
        }

        // Set time display from database
        setTotalTime(formatTime(data.attempt.elapsedSeconds || 0))

        // Ensure the exam attempt is paused when on break page
        if (!data.attempt.isPaused) {
          await fetch(`/api/exam/${examId}/attempt`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'pause',
              elapsedSeconds: data.attempt.elapsedSeconds || 0
            }),
          })
        }
      }
    }
    load()
  }, [examId, currentSectionId])

  const handleContinue = async () => {
    // resume attempt timer
    await fetch(`/api/exam/${examId}/attempt`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resume' }),
    })

    if (nextSection) router.push(`/exam/${examId}/section/${nextSection.sectionId}`)
    else router.push(`/exam/${examId}/results`)
  }

  const handleLeaveForNow = async () => {
    // Ensure exam is paused when leaving from break page
    if (attempt) {
      await fetch(`/api/exam/${examId}/attempt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pause',
          elapsedSeconds: attempt.elapsedSeconds || 0
        }),
      })
    }

    router.push("/")
  }

  const completedSections = 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <Coffee className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Section Complete!</CardTitle>
          <p className="text-gray-600 dark:text-gray-400">Take a moment to rest before continuing</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-700">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">Timer Paused: {totalTime}</span>
            </div>
            {/* We can enrich this later with real completed count */}
            <p className="text-sm text-gray-600 dark:text-gray-400">Take a short break</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
              {nextSection ? `Ready to continue with ${nextSection.title}?` : "Ready to see your results?"}
            </p>

            <Button onClick={handleContinue} className="w-full hover:cursor-pointer" size="lg">
              {nextSection ? (
                <>
                  Continue to next section
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                "View Results"
              )}
            </Button>

            <div className="space-y-2 pt-2 border-t">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                Your progress will be stored for when you come back
              </p>
              <Button variant="outline" onClick={handleLeaveForNow} className="w-full bg-transparent hover:cursor-pointer" size="sm">
                <Home className="mr-2 h-4 w-4" />
                Come back later
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume Dialog - exact same as dashboard */}
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
                <span className="font-medium">{nextSection?.title || "Next Section"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Question 1</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Time elapsed: {totalTime}</span>
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
                  // Go to next section, question 1
                  if (nextSection) {
                    router.push(`/exam/${examId}/section/${nextSection.sectionId}`)
                  } else {
                    router.push(`/exam/${examId}/results`)
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
