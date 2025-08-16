import type { Exam, ExamProgress, ExamResult } from "./types"

export function calculateExamResults(exam: Exam, progress: ExamProgress): ExamResult {
  let correctAnswers = 0
  let totalAnswers = 0
  const categoryStats: Record<string, { correct: number; total: number }> = {}

  // Calculate scores for each section
  exam.sections.forEach((section) => {
    section.questions.forEach((question) => {
      const userAnswer = progress.answers[question.qid]
      if (userAnswer) {
        totalAnswers++
        if (userAnswer === question.correctOptionId) {
          correctAnswers++
        }

        // Track category performance (mock categories for now)
        const categories = question.categories || ["General Medicine"]
        categories.forEach((category) => {
          if (!categoryStats[category]) {
            categoryStats[category] = { correct: 0, total: 0 }
          }
          categoryStats[category].total++
          if (userAnswer === question.correctOptionId) {
            categoryStats[category].correct++
          }
        })
      }
    })
  })

  const overallPercent = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0

  // Convert category stats to the required format
  const categories = Object.entries(categoryStats).map(([name, stats]) => ({
    name,
    percent: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }))

  // Add some mock categories if none exist
  if (categories.length === 0) {
    categories.push(
      { name: "Neurology", percent: 72 },
      { name: "Pulmonology", percent: 93 },
      { name: "Cardiology", percent: 85 },
      { name: "Gastroenterology", percent: 67 },
    )
  }

  const duration = calculateActualDuration(progress)

  return {
    examId: exam.examId,
    overallPercent,
    points: `${correctAnswers} / ${totalAnswers}`,
    duration,
    categories,
    answers: {
      correct: correctAnswers,
      incorrect: totalAnswers - correctAnswers,
    },
    completedAt: new Date().toISOString(),
  }
}

function calculateActualDuration(progress: ExamProgress): string {
  if (!progress.startedAt) return "0 min 0s"

  const startTime = new Date(progress.startedAt).getTime()
  const endTime = progress.completedAt ? new Date(progress.completedAt).getTime() : Date.now()
  const durationMs = endTime - startTime

  const minutes = Math.floor(durationMs / (1000 * 60))
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000)

  return `${minutes} min ${seconds}s`
}

export function getCategoryColor(percent: number): string {
  if (percent >= 80) return "text-green-600"
  if (percent >= 50) return "text-orange-600"
  return "text-red-600"
}

export function getCategoryBgColor(percent: number): string {
  if (percent >= 80) return "bg-green-600"
  if (percent >= 50) return "bg-orange-600"
  return "bg-red-600"
}
