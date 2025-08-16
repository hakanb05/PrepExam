"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Coffee, ArrowRight, Home } from "lucide-react"
import { getExamProgress, getTotalExamDuration, resumeExamTimer } from "@/lib/storage" // Import resumeExamTimer
import { getExamData } from "@/lib/exam-data"

export default function SectionBreakPage() {
  const params = useParams()
  const router = useRouter()
  const examId = params.examId as string
  const currentSectionId = params.sectionId as string

  const [progress, setProgress] = useState<any>(null)
  const [exam, setExam] = useState<any>(null)
  const [nextSection, setNextSection] = useState<any>(null)

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
    const examData = getExamData(examId)
    const progressData = getExamProgress(examId)

    if (examData && progressData) {
      setExam(examData)
      setProgress(progressData)

      // Find next section
      const currentIndex = examData.sections.findIndex((s: any) => s.sectionId === currentSectionId)
      if (currentIndex >= 0 && currentIndex < examData.sections.length - 1) {
        setNextSection(examData.sections[currentIndex + 1])
      }
    }
  }, [examId, currentSectionId])

  const handleContinue = () => {
    resumeExamTimer(examId)

    if (nextSection) {
      router.push(`/exam/${examId}/section/${nextSection.sectionId}`)
    } else {
      // Last section completed, go to results
      router.push(`/exam/${examId}/results`)
    }
  }

  const handleLeaveForNow = () => {
    router.push("/")
  }

  if (!progress || !exam) {
    return <div>Loading...</div>
  }

  const totalTime = getTotalExamDuration(progress)
  const completedSections = Object.values(progress.sectionStatus).filter((status) => status === "completed").length

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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {completedSections} of {exam.sections.length} sections completed
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
              {nextSection ? `Ready to continue with ${nextSection.title}?` : "Ready to see your results?"}
            </p>

            <Button onClick={handleContinue} className="w-full" size="lg">
              {nextSection ? (
                <>
                  Continue to Next Section
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
              <Button variant="outline" onClick={handleLeaveForNow} className="w-full bg-transparent" size="sm">
                <Home className="mr-2 h-4 w-4" />
                Come back later
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
