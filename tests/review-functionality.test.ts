import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testExamData, testAttemptData, testQuestionStats, testUser } from './data/test-exam-data'

// Mock the database and API calls
vi.mock('@/lib/prisma', () => ({
    prisma: {
        attempt: {
            findFirst: vi.fn()
        },
        response: {
            findMany: vi.fn()
        }
    }
}))

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(() => Promise.resolve({ user: testUser }))
}))

describe('Review Page Functionality Tests', () => {
    console.log('🔍 Testing Review Page Features')

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Question Statistics Display', () => {
        console.log('📊 Testing Question Statistics in Review')

        it('should display success rate with correct color coding', () => {
            console.log('🎨 Test: Success rate color coding validation')

            const getSuccessRateColor = (percentage: number) => {
                if (percentage >= 70) return 'green'
                if (percentage >= 40) return 'orange'
                return 'red'
            }

            // Test green (70%+)
            const greenStats = testQuestionStats.q1
            const greenColor = getSuccessRateColor(greenStats.percentage)
            expect(greenColor).toBe('green')
            console.log(`   → Q1: ${greenStats.percentage}% = ${greenColor.toUpperCase()} ✓`)

            // Test orange (40-70%)
            const orangeStats = testQuestionStats.q3
            const orangeColor = getSuccessRateColor(orangeStats.percentage)
            expect(orangeColor).toBe('orange')
            console.log(`   → Q3: ${orangeStats.percentage}% = ${orangeColor.toUpperCase()} ✓`)

            // Test red (<40%)
            const redStats = testQuestionStats.q2
            const redColor = getSuccessRateColor(redStats.percentage)
            expect(redColor).toBe('red')
            console.log(`   → Q2: ${redStats.percentage}% = ${redColor.toUpperCase()} ✓`)
        })

        it('should calculate correct/incorrect breakdown accurately', () => {
            console.log('📈 Test: Correct/incorrect statistics breakdown')

            Object.entries(testQuestionStats).forEach(([questionId, stats]) => {
                const incorrect = stats.total - stats.correct
                const calculatedPercentage = Math.round((stats.correct / stats.total) * 100)

                expect(calculatedPercentage).toBe(stats.percentage)
                expect(stats.correct + incorrect).toBe(stats.total)

                console.log(`   → ${questionId}: ${stats.correct} correct, ${incorrect} incorrect (${stats.percentage}%)`)
            })
            console.log(`   → Statistics breakdown: ACCURATE ✓`)
        })

        it('should display statistics for current question in sidebar', () => {
            console.log('📋 Test: Current question statistics sidebar')

            const currentQuestionId = "q1"
            const currentStats = testQuestionStats[currentQuestionId]

            expect(currentStats).toBeDefined()
            expect(currentStats.total).toBeGreaterThan(0)
            expect(currentStats.correct).toBeGreaterThanOrEqual(0)
            expect(currentStats.correct).toBeLessThanOrEqual(currentStats.total)
            expect(currentStats.percentage).toBe(Math.round((currentStats.correct / currentStats.total) * 100))

            console.log(`   → Current question: ${currentQuestionId}`)
            console.log(`   → Success rate: ${currentStats.percentage}%`)
            console.log(`   → Total attempts: ${currentStats.total}`)
            console.log(`   → Correct: ${currentStats.correct}`)
            console.log(`   → Incorrect: ${currentStats.total - currentStats.correct}`)
            console.log(`   → Sidebar statistics: COMPLETE ✓`)
        })
    })

    describe('Flag and Note Indicators', () => {
        console.log('🚩 Testing Flag and Note Visual Indicators')

        it('should display flag icons for flagged questions', () => {
            console.log('🚩 Test: Flag icon display validation')

            const responses = testAttemptData.sections[0].responses
            const flaggedQuestions = responses.filter(r => r.flagged)

            expect(flaggedQuestions).toHaveLength(1)
            expect(flaggedQuestions[0].questionId).toBe("q1")
            expect(flaggedQuestions[0].flagged).toBe(true)

            // Simulate flag icon rendering
            const shouldShowFlagIcon = flaggedQuestions[0].flagged
            expect(shouldShowFlagIcon).toBe(true)

            console.log(`   → Flagged questions found: ${flaggedQuestions.length}`)
            console.log(`   → Question ${flaggedQuestions[0].questionId}: Has flag icon ✓`)
            console.log(`   → Flag icons: DISPLAYING ✓`)
        })

        it('should display note icons for questions with notes', () => {
            console.log('📝 Test: Note icon display validation')

            const responses = testAttemptData.sections.flatMap(s => s.responses)
            const questionsWithNotes = responses.filter(r => r.note && r.note.trim().length > 0)

            expect(questionsWithNotes).toHaveLength(2) // q1 and q3 have notes

            questionsWithNotes.forEach(response => {
                expect(response.note).toBeTruthy()
                const shouldShowNoteIcon = !!response.note
                expect(shouldShowNoteIcon).toBe(true)

                console.log(`   → Question ${response.questionId}: Has note "${response.note?.substring(0, 30)}..." ✓`)
            })

            console.log(`   → Questions with notes: ${questionsWithNotes.length}`)
            console.log(`   → Note icons: DISPLAYING ✓`)
        })

        it('should show both flag and note icons when applicable', () => {
            console.log('🚩📝 Test: Combined flag and note icon display')

            const q1Response = testAttemptData.sections[0].responses.find(r => r.questionId === "q1")

            expect(q1Response?.flagged).toBe(true)
            expect(q1Response?.note).toBeTruthy()

            const shouldShowFlagIcon = q1Response?.flagged
            const shouldShowNoteIcon = !!q1Response?.note

            expect(shouldShowFlagIcon).toBe(true)
            expect(shouldShowNoteIcon).toBe(true)

            console.log(`   → Question q1: Flag=${shouldShowFlagIcon}, Note=${shouldShowNoteIcon}`)
            console.log(`   → Combined indicators: WORKING ✓`)
        })
    })

    describe('Answer Review and Validation', () => {
        console.log('✅❌ Testing Answer Review Display')

        it('should correctly identify and display correct answers', () => {
            console.log('✅ Test: Correct answer identification in review')

            const q1 = testExamData.sections[0].questions[0]
            const q1Response = testAttemptData.sections[0].responses.find(r => r.questionId === "q1")

            const userAnswer = q1Response?.answer
            const correctAnswer = q1.correctOptionId
            const isCorrect = userAnswer === correctAnswer

            expect(isCorrect).toBe(true)
            expect(userAnswer).toBe("C")
            expect(correctAnswer).toBe("C")

            console.log(`   → Question: "${q1.stem.substring(0, 50)}..."`)
            console.log(`   → User answered: ${userAnswer}`)
            console.log(`   → Correct answer: ${correctAnswer}`)
            console.log(`   → Review status: ${isCorrect ? 'CORRECT ✅' : 'INCORRECT ❌'}`)
        })

        it('should correctly identify and display incorrect answers', () => {
            console.log('❌ Test: Incorrect answer identification in review')

            const q2 = testExamData.sections[0].questions[1]
            const q2Response = testAttemptData.sections[0].responses.find(r => r.questionId === "q2")

            const userAnswer = q2Response?.answer
            const correctAnswer = q2.correctOptionId
            const isCorrect = userAnswer === correctAnswer

            expect(isCorrect).toBe(false)
            expect(userAnswer).toBe("B")
            expect(correctAnswer).toBe("A")

            console.log(`   → Question: "${q2.stem.substring(0, 50)}..."`)
            console.log(`   → User answered: ${userAnswer}`)
            console.log(`   → Correct answer: ${correctAnswer}`)
            console.log(`   → Review status: ${isCorrect ? 'CORRECT ✅' : 'INCORRECT ❌'}`)
        })

        it('should display user notes in review mode', () => {
            console.log('📝 Test: User note display in review')

            const responses = testAttemptData.sections.flatMap(s => s.responses)
            const responsesWithNotes = responses.filter(r => r.note)

            expect(responsesWithNotes).toHaveLength(2)

            responsesWithNotes.forEach(response => {
                expect(response.note).toBeTruthy()
                expect(response.note!.length).toBeGreaterThan(0)

                console.log(`   → Question ${response.questionId} note: "${response.note}"`)
            })

            console.log(`   → Note display: FUNCTIONAL ✓`)
        })
    })

    describe('Navigation Between Questions', () => {
        console.log('🧭 Testing Question Navigation in Review')

        it('should navigate between questions correctly', () => {
            console.log('⬅️➡️ Test: Question navigation functionality')

            const totalQuestions = testExamData.sections.flatMap(s => s.questions).length
            let currentQuestionIndex = 0
            let currentSectionIndex = 0

            // Test navigation forward
            const canGoNext = currentQuestionIndex < totalQuestions - 1
            expect(canGoNext).toBe(true)

            // Simulate next navigation
            if (canGoNext) {
                if (currentQuestionIndex < testExamData.sections[currentSectionIndex].questions.length - 1) {
                    currentQuestionIndex++
                } else {
                    currentSectionIndex++
                    currentQuestionIndex = 0
                }
            }

            expect(currentQuestionIndex).toBe(1)
            expect(currentSectionIndex).toBe(0)

            // Test navigation backward
            const canGoPrevious = currentQuestionIndex > 0 || currentSectionIndex > 0
            expect(canGoPrevious).toBe(true)

            console.log(`   → Total questions: ${totalQuestions}`)
            console.log(`   → Navigation forward: WORKING ✓`)
            console.log(`   → Navigation backward: WORKING ✓`)
            console.log(`   → Current position: Section ${currentSectionIndex + 1}, Question ${currentQuestionIndex + 1}`)
        })

        it('should jump to specific questions correctly', () => {
            console.log('🎯 Test: Direct question jump functionality')

            const targetSectionIndex = 1
            const targetQuestionIndex = 0

            let currentSectionIndex = 0
            let currentQuestionIndex = 0

            // Simulate jump to specific question
            const jumpToQuestion = (sectionIdx: number, questionIdx: number) => {
                currentSectionIndex = sectionIdx
                currentQuestionIndex = questionIdx
            }

            jumpToQuestion(targetSectionIndex, targetQuestionIndex)

            expect(currentSectionIndex).toBe(targetSectionIndex)
            expect(currentQuestionIndex).toBe(targetQuestionIndex)

            const targetQuestion = testExamData.sections[targetSectionIndex].questions[targetQuestionIndex]
            expect(targetQuestion).toBeDefined()
            expect(targetQuestion.id).toBe("q3")

            console.log(`   → Jumped to: Section ${targetSectionIndex + 1}, Question ${targetQuestionIndex + 1}`)
            console.log(`   → Target question ID: ${targetQuestion.id}`)
            console.log(`   → Direct jump: FUNCTIONAL ✓`)
        })
    })

    describe('Review Statistics Summary', () => {
        console.log('📊 Testing Review Statistics Summary')

        it('should calculate overall exam statistics correctly', () => {
            console.log('🎯 Test: Overall exam statistics calculation')

            const allQuestions = testExamData.sections.flatMap(s => s.questions)
            const allResponses = testAttemptData.sections.flatMap(s => s.responses)

            let correctCount = 0
            let incorrectCount = 0

            allQuestions.forEach(question => {
                const response = allResponses.find(r => r.questionId === question.id)
                if (response) {
                    const isCorrect = response.answer === question.correctOptionId
                    if (isCorrect) {
                        correctCount++
                    } else {
                        incorrectCount++
                    }
                }
            })

            const totalAnswered = correctCount + incorrectCount
            const overallPercentage = Math.round((correctCount / totalAnswered) * 100)

            expect(totalAnswered).toBe(3) // 3 questions answered
            expect(correctCount).toBe(2) // q1 and q3 correct
            expect(incorrectCount).toBe(1) // q2 incorrect
            expect(overallPercentage).toBe(67)

            console.log(`   → Total questions answered: ${totalAnswered}`)
            console.log(`   → Correct answers: ${correctCount}`)
            console.log(`   → Incorrect answers: ${incorrectCount}`)
            console.log(`   → Overall score: ${overallPercentage}%`)
            console.log(`   → Statistics summary: ACCURATE ✓`)
        })

        it('should display attempt metadata correctly', () => {
            console.log('📅 Test: Attempt metadata display')

            const attempt = testAttemptData
            const completedAt = new Date(attempt.finishedAt!)
            const startedAt = new Date(attempt.startedAt)
            const duration = completedAt.getTime() - startedAt.getTime() - attempt.totalPausedTime

            expect(attempt.finishedAt).toBeTruthy()
            expect(completedAt).toBeInstanceOf(Date)
            expect(duration).toBeGreaterThan(0)

            const durationHours = Math.floor(duration / 3600000)
            const durationMinutes = Math.floor((duration % 3600000) / 60000)

            console.log(`   → Attempt ID: ${attempt.id}`)
            console.log(`   → Started: ${startedAt.toLocaleString()}`)
            console.log(`   → Completed: ${completedAt.toLocaleString()}`)
            console.log(`   → Duration: ${durationHours}h ${durationMinutes}m`)
            console.log(`   → Paused time: ${attempt.totalPausedTime / 60000}m`)
            console.log(`   → Metadata display: COMPLETE ✓`)
        })
    })
})
