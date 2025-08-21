"use client"

import { Button } from "@/components/ui/button"
import { Flag, ChevronLeft, ChevronRight, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExamQuestion } from "@/lib/types"

interface QuestionNavigationProps {
  currentQuestion: number
  totalQuestions: number
  questions: { id: string }[] // minimal shape
  answers: Record<string, string>
  flags: Record<string, boolean>
  notes: Record<string, boolean> // Added notes tracking
  onQuestionSelect: (questionNumber: number) => void
  onPrevious: () => void
  onNext: () => void
  canGoNext: boolean
  canGoPrevious: boolean
}

export function QuestionNavigation({
  currentQuestion,
  totalQuestions,
  questions, // Use actual questions data
  answers,
  flags,
  notes, // Added notes prop
  onQuestionSelect,
  onPrevious,
  onNext,
  canGoNext,
  canGoPrevious,
}: QuestionNavigationProps) {
  return (
    <div className="space-y-4">
      {/* Question Grid */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-10 gap-2 p-4 border rounded-lg bg-muted/50 min-w-max">
          {Array.from({ length: totalQuestions }, (_, i) => {
            const questionNum = i + 1
            const questionId = questions[i]?.id ?? String(i + 1)
            const isAnswered = !!answers[questionId]
            const isFlagged = !!flags[questionId]
            const hasNote = !!notes[questionId] // Check for notes
            const isCurrent = questionNum === currentQuestion

            return (
              <button
                key={questionNum}
                onClick={() => onQuestionSelect(questionNum)}
                className={cn(
                  "relative h-10 w-10 rounded text-sm font-medium transition-colors",
                  isCurrent && "ring-2 ring-primary",
                  isAnswered
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-background border hover:bg-muted",
                )}
              >
                {questionNum}
                {isFlagged && <Flag className="absolute -top-1 -right-1 h-3 w-3 text-red-500 fill-red-500" />}
                {hasNote && <StickyNote className="absolute -bottom-1 -left-1 h-3 w-3 text-blue-500 fill-blue-500" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" className="hover:cursor-pointer" onClick={onPrevious} disabled={!canGoPrevious}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={onNext} className="hover:cursor-pointer" disabled={!canGoNext}>
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}