import examData from "../data/nbme20a.json"
import type { Exam } from "./types"

export const getExamData = (): Exam => {
  return examData as Exam
}

export const mockUser = {
  name: "Oguzhan Bektas",
  email: "oguzhan@example.com",
  avatar: "/diverse-user-avatars.png",
}

export const mockResults = {
  overallPercent: 80,
  points: "8 / 10",
  duration: "7 min 39s",
  categories: [
    { name: "Neurology", percent: 72 },
    { name: "Pulmonology", percent: 93 },
  ],
  answers: { correct: 8, incorrect: 2 },
}
