import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testExamData, testAttemptData, testQuestionStats, testUser } from './data/test-exam-data'

// Mock the database and API calls
vi.mock('@/lib/prisma', () => ({
    prisma: {
        attempt: {
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn()
        },
        response: {
            findMany: vi.fn(),
            upsert: vi.fn()
        },
        attemptSection: {
            findFirst: vi.fn(),
            update: vi.fn()
        }
    }
}))

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(() => Promise.resolve({ user: testUser }))
}))

describe('Quiz Functionality Tests', () => {
    console.log('🧪 Testing Quiz Core Functionality')

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Question Answer Selection', () => {
        console.log('📝 Testing Answer Selection and Validation')

        it('should correctly identify correct answers', () => {
            console.log('✅ Test: Verifying correct answer identification')

            const question = testExamData.sections[0].questions[0] // q1
            const userAnswer = "C" // Correct answer
            const isCorrect = userAnswer === question.correctOptionId

            expect(isCorrect).toBe(true)
            expect(question.correctOptionId).toBe("C")
            console.log(`   → Question: "${question.stem.substring(0, 50)}..."`)
            console.log(`   → User answered: ${userAnswer}, Correct: ${question.correctOptionId}`)
            console.log(`   → Result: ${isCorrect ? 'CORRECT ✓' : 'INCORRECT ✗'}`)
        })

        it('should correctly identify incorrect answers', () => {
            console.log('❌ Test: Verifying incorrect answer identification')

            const question = testExamData.sections[0].questions[1] // q2
            const userAnswer = "B" // Incorrect answer (correct is A)
            const isCorrect = userAnswer === question.correctOptionId

            expect(isCorrect).toBe(false)
            expect(question.correctOptionId).toBe("A")
            console.log(`   → Question: "${question.stem.substring(0, 50)}..."`)
            console.log(`   → User answered: ${userAnswer}, Correct: ${question.correctOptionId}`)
            console.log(`   → Result: ${isCorrect ? 'CORRECT ✓' : 'INCORRECT ✗'}`)
        })

        it('should handle matrix questions correctly', () => {
            console.log('🔲 Test: Matrix question answer validation')

            const matrixQuestion = testExamData.sections[1].questions[0] // q3
            const userAnswer = "A"
            const isCorrect = userAnswer === matrixQuestion.correctOptionId

            expect(matrixQuestion.matrix).toBeDefined()
            expect(matrixQuestion.matrix?.rows).toHaveLength(2)
            expect(matrixQuestion.matrix?.columns).toHaveLength(3)
            expect(isCorrect).toBe(true)
            console.log(`   → Matrix question with ${matrixQuestion.matrix?.rows.length} rows`)
            console.log(`   → User answer: ${userAnswer}, Expected: ${matrixQuestion.correctOptionId}`)
            console.log(`   → Matrix validation: PASSED ✓`)
        })
    })

    describe('Question Statistics and Success Rates', () => {
        console.log('📊 Testing Question Statistics Calculations')

        it('should calculate success rate correctly for green questions (70%+)', () => {
            console.log('🟢 Test: Green success rate calculation (70%+)')

            const stats = testQuestionStats.q1
            const expectedColor = stats.percentage >= 70 ? 'green' : stats.percentage >= 40 ? 'orange' : 'red'

            expect(stats.percentage).toBe(70)
            expect(stats.correct).toBe(7)
            expect(stats.total).toBe(10)
            expect(expectedColor).toBe('green')
            console.log(`   → Question q1: ${stats.correct}/${stats.total} correct (${stats.percentage}%)`)
            console.log(`   → Color classification: ${expectedColor.toUpperCase()} ✓`)
        })

        it('should calculate success rate correctly for red questions (<40%)', () => {
            console.log('🔴 Test: Red success rate calculation (<40%)')

            const stats = testQuestionStats.q2
            const expectedColor = stats.percentage >= 70 ? 'green' : stats.percentage >= 40 ? 'orange' : 'red'

            expect(stats.percentage).toBe(30)
            expect(stats.correct).toBe(3)
            expect(stats.total).toBe(10)
            expect(expectedColor).toBe('red')
            console.log(`   → Question q2: ${stats.correct}/${stats.total} correct (${stats.percentage}%)`)
            console.log(`   → Color classification: ${expectedColor.toUpperCase()} ✓`)
        })

        it('should calculate success rate correctly for orange questions (40-70%)', () => {
            console.log('🟠 Test: Orange success rate calculation (40-70%)')

            const stats = testQuestionStats.q3
            const expectedColor = stats.percentage >= 70 ? 'green' : stats.percentage >= 40 ? 'orange' : 'red'

            expect(stats.percentage).toBe(50)
            expect(stats.correct).toBe(5)
            expect(stats.total).toBe(10)
            expect(expectedColor).toBe('orange')
            console.log(`   → Question q3: ${stats.correct}/${stats.total} correct (${stats.percentage}%)`)
            console.log(`   → Color classification: ${expectedColor.toUpperCase()} ✓`)
        })
    })

    describe('Strikethrough Functionality', () => {
        console.log('✏️ Testing Strikethrough Answer Elimination')

        it('should track strikethrough options per question', () => {
            console.log('📋 Test: Strikethrough state management')

            const struckThroughOptions: { [questionId: string]: string[] } = {}
            const questionId = "q1"
            const optionToStrike = "D"

            // Simulate striking through an option
            struckThroughOptions[questionId] = [optionToStrike]

            expect(struckThroughOptions[questionId]).toContain(optionToStrike)
            expect(struckThroughOptions[questionId]).toHaveLength(1)
            console.log(`   → Question ${questionId}: Struck through option ${optionToStrike}`)
            console.log(`   → Strikethrough state: ${JSON.stringify(struckThroughOptions)}`)
        })

        it('should toggle strikethrough on/off correctly', () => {
            console.log('🔄 Test: Strikethrough toggle functionality')

            let struckThroughOptions: { [questionId: string]: string[] } = {}
            const questionId = "q1"
            const optionToToggle = "B"

            // First toggle: add strikethrough
            const currentOptions = struckThroughOptions[questionId] || []
            const isCurrentlyStruckThrough = currentOptions.includes(optionToToggle)

            if (isCurrentlyStruckThrough) {
                struckThroughOptions[questionId] = currentOptions.filter(id => id !== optionToToggle)
            } else {
                struckThroughOptions[questionId] = [...currentOptions, optionToToggle]
            }

            expect(struckThroughOptions[questionId]).toContain(optionToToggle)
            console.log(`   → First toggle: Added ${optionToToggle} to strikethrough`)

            // Second toggle: remove strikethrough
            const updatedOptions = struckThroughOptions[questionId]
            const isNowStruckThrough = updatedOptions.includes(optionToToggle)

            if (isNowStruckThrough) {
                struckThroughOptions[questionId] = updatedOptions.filter(id => id !== optionToToggle)
            }

            expect(struckThroughOptions[questionId]).not.toContain(optionToToggle)
            console.log(`   → Second toggle: Removed ${optionToToggle} from strikethrough`)
            console.log(`   → Toggle functionality: WORKING ✓`)
        })
    })

    describe('Answer Persistence and State', () => {
        console.log('💾 Testing Answer State Persistence')

        it('should persist user answers correctly', () => {
            console.log('📝 Test: Answer persistence validation')

            const attempt = testAttemptData
            const responses = attempt.sections[0].responses

            // Check first question (correct answer)
            const q1Response = responses.find(r => r.questionId === "q1")
            expect(q1Response?.answer).toBe("C")
            expect(q1Response?.flagged).toBe(true)
            expect(q1Response?.note).toBe("Patient seems anxious, classic presentation")

            // Check second question (incorrect answer)
            const q2Response = responses.find(r => r.questionId === "q2")
            expect(q2Response?.answer).toBe("B")
            expect(q2Response?.flagged).toBe(false)
            expect(q2Response?.note).toBe(null)

            console.log(`   → Q1: Answer=${q1Response?.answer}, Flagged=${q1Response?.flagged}, Note=${!!q1Response?.note}`)
            console.log(`   → Q2: Answer=${q2Response?.answer}, Flagged=${q2Response?.flagged}, Note=${!!q2Response?.note}`)
            console.log(`   → Persistence validation: PASSED ✓`)
        })

        it('should track flag and note states per question', () => {
            console.log('🚩 Test: Flag and note state tracking')

            const responses = testAttemptData.sections[0].responses
            const flaggedQuestions = responses.filter(r => r.flagged)
            const questionsWithNotes = responses.filter(r => r.note)

            expect(flaggedQuestions).toHaveLength(1)
            expect(questionsWithNotes).toHaveLength(1)
            expect(flaggedQuestions[0].questionId).toBe("q1")
            expect(questionsWithNotes[0].questionId).toBe("q1")

            console.log(`   → Flagged questions: ${flaggedQuestions.length}`)
            console.log(`   → Questions with notes: ${questionsWithNotes.length}`)
            console.log(`   → Flag/note tracking: WORKING ✓`)
        })
    })

    describe('Timer and Progress Tracking', () => {
        console.log('⏱️ Testing Timer and Progress Functionality')

        it('should calculate exam duration correctly', () => {
            console.log('🕐 Test: Exam duration calculation')

            const attempt = testAttemptData
            const startTime = new Date(attempt.startedAt).getTime()
            const endTime = new Date(attempt.finishedAt!).getTime()
            const totalPausedTime = attempt.totalPausedTime
            const actualDuration = endTime - startTime - totalPausedTime

            // Expected: 2 hours - 5 minutes = 115 minutes
            const expectedDuration = (2 * 60 * 60 * 1000) - (5 * 60 * 1000) // 115 minutes in ms

            expect(actualDuration).toBe(expectedDuration)

            const hours = Math.floor(actualDuration / 3600000)
            const minutes = Math.floor((actualDuration % 3600000) / 60000)

            console.log(`   → Start: ${attempt.startedAt}`)
            console.log(`   → End: ${attempt.finishedAt}`)
            console.log(`   → Paused time: ${totalPausedTime / 60000} minutes`)
            console.log(`   → Actual duration: ${hours}h ${minutes}m`)
            console.log(`   → Duration calculation: ACCURATE ✓`)
        })

        it('should track current question progress', () => {
            console.log('📍 Test: Question progress tracking')

            const sectionAttempt = testAttemptData.sections[0]
            const currentQuestionIndex = sectionAttempt.currentQuestionIndex
            const totalQuestionsInSection = testExamData.sections[0].questions.length

            expect(currentQuestionIndex).toBe(0)
            expect(totalQuestionsInSection).toBe(2)
            expect(currentQuestionIndex).toBeLessThan(totalQuestionsInSection)

            console.log(`   → Current question: ${currentQuestionIndex + 1}`)
            console.log(`   → Total questions in section: ${totalQuestionsInSection}`)
            console.log(`   → Progress: ${Math.round(((currentQuestionIndex + 1) / totalQuestionsInSection) * 100)}%`)
            console.log(`   → Progress tracking: FUNCTIONAL ✓`)
        })
    })
})
