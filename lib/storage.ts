import type { ExamProgress, ExamResult } from "./types"

const STORAGE_KEYS = {
  EXAM_PROGRESS: "usmle_exam_progress",
  EXAM_RESULTS: "usmle_exam_results",
}

export function getExamProgress(examId: string): ExamProgress | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem(`${STORAGE_KEYS.EXAM_PROGRESS}_${examId}`)
  return stored ? JSON.parse(stored) : null
}

export function saveExamProgress(progress: ExamProgress): void {
  if (typeof window === "undefined") return

  if (!progress.startedAt) {
    progress.startedAt = new Date().toISOString()
  }

  if (!progress.strikethrough) {
    progress.strikethrough = {}
  }

  if (!progress.totalPausedTime) {
    progress.totalPausedTime = 0
  }

  localStorage.setItem(`${STORAGE_KEYS.EXAM_PROGRESS}_${progress.examId}`, JSON.stringify(progress))
}

export function pauseExamTimer(examId: string): void {
  const progress = getExamProgress(examId)
  if (!progress || progress.pausedAt) return // Already paused

  progress.pausedAt = new Date().toISOString()
  saveExamProgress(progress)
}

export function resumeExamTimer(examId: string): void {
  const progress = getExamProgress(examId)
  if (!progress || !progress.pausedAt) return // Not paused

  const pausedTime = new Date().getTime() - new Date(progress.pausedAt).getTime()
  progress.totalPausedTime = (progress.totalPausedTime || 0) + pausedTime
  progress.pausedAt = undefined
  saveExamProgress(progress)
}

export function toggleStrikethrough(examId: string, questionId: string, optionId: string): void {
  const progress = getExamProgress(examId)
  if (!progress) return

  if (!progress.strikethrough) {
    progress.strikethrough = {}
  }

  if (!progress.strikethrough[questionId]) {
    progress.strikethrough[questionId] = []
  }

  const struckOptions = progress.strikethrough[questionId]
  const index = struckOptions.indexOf(optionId)

  if (index >= 0) {
    // Remove strikethrough
    struckOptions.splice(index, 1)
  } else {
    // Add strikethrough
    struckOptions.push(optionId)
  }

  saveExamProgress(progress)
}

export function getExamResults(): ExamResult[] {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(STORAGE_KEYS.EXAM_RESULTS)
  return stored ? JSON.parse(stored) : []
}

export function saveExamResult(result: ExamResult): void {
  if (typeof window === "undefined") return

  const results = getExamResults()
  const existingIndex = results.findIndex((r) => r.examId === result.examId)

  if (existingIndex >= 0) {
    results[existingIndex] = result
  } else {
    results.push(result)
  }

  localStorage.setItem(STORAGE_KEYS.EXAM_RESULTS, JSON.stringify(results))
}

export function clearExamProgress(examId: string): void {
  if (typeof window === "undefined") return

  localStorage.removeItem(`${STORAGE_KEYS.EXAM_PROGRESS}_${examId}`)
}

export function getTotalExamDuration(progress: ExamProgress): string {
  if (!progress.startedAt) return "0:00"

  const startTime = new Date(progress.startedAt)
  const endTime = progress.completedAt ? new Date(progress.completedAt) : new Date()
  let diffMs = endTime.getTime() - startTime.getTime()

  // Subtract total paused time
  if (progress.totalPausedTime) {
    diffMs -= progress.totalPausedTime
  }

  // If currently paused, subtract current pause duration
  if (progress.pausedAt) {
    const currentPauseTime = new Date().getTime() - new Date(progress.pausedAt).getTime()
    diffMs -= currentPauseTime
  }

  // Ensure we don't show negative time
  diffMs = Math.max(0, diffMs)

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
