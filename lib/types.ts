export interface User {
  name: string
  email: string
  avatar?: string
  purchasedExams?: string[] // Array of examIds that user has purchased
  purchaseHistory?: PurchaseRecord[]
}

export interface PurchaseRecord {
  examId: string
  purchaseDate: string
  amount: number
  paymentMethod: string
  transactionId: string
}

export interface ExamQuestion {
  id: string
  qid: string
  number: number
  stem: string
  info?: string
  infoImages?: { path: string; alt: string } | { path: string; alt: string }[]
  images?: { path: string; alt: string } | { path: string; alt: string }[]
  explanationImage?: { path: string; alt: string } | { path: string; alt: string }[]
  options?: { id: string; letter: string; text: string }[]
  matrix?: {
    columns: string[]
    rows: { name: string; options: { id: string; text: string }[] }[]
  }
  correctOptionId?: string
  explanation?: string
  categories?: string[]
}

export interface ExamSection {
  sectionId: string
  title: string
  questions: ExamQuestion[]
}

export interface Exam {
  examId: string
  title: string
  version: number
  sections: ExamSection[]
}

export interface ExamProgress {
  examId: string
  currentSectionId?: string
  currentQuestionIndex?: number
  answers: Record<string, string>
  flags: Record<string, boolean>
  notes: Record<string, string>
  strikethrough: Record<string, string[]> // questionId -> array of optionIds that are struck through
  sectionStatus: Record<string, "not-started" | "in-progress" | "completed">
  startedAt?: string
  completedAt?: string
  pausedAt?: string // Added pausedAt field for timer pause functionality
  totalPausedTime?: number // Added totalPausedTime to track cumulative pause duration
}

export interface ExamResult {
  examId: string
  overallPercent: number
  points: string
  duration: string
  categories: { name: string; percent: number }[]
  answers: { correct: number; incorrect: number }
  completedAt: string
}
