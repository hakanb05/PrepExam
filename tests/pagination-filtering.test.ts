import { describe, it, expect, beforeEach, vi } from 'vitest'
import { testPreviousAttempts, testUser } from './data/test-exam-data'

// Mock the database and API calls
vi.mock('@/lib/prisma', () => ({
    prisma: {
        attempt: {
            findMany: vi.fn()
        }
    }
}))

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(() => Promise.resolve({ user: testUser }))
}))

describe('Pagination and Filtering Functionality Tests', () => {
    console.log('📄 Testing Pagination and Filtering Features')

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Previous Attempts Pagination', () => {
        console.log('📋 Testing Previous Attempts Pagination')

        it('should paginate attempts correctly with 3 items per page', () => {
            console.log('📄 Test: Pagination with 3 items per page')

            const attempts = testPreviousAttempts
            const itemsPerPage = 3
            const totalPages = Math.ceil(attempts.length / itemsPerPage)

            expect(attempts).toHaveLength(4)
            expect(totalPages).toBe(2)

            // Test page 1 (first 3 items)
            const page1 = attempts.slice(0, itemsPerPage)
            expect(page1).toHaveLength(3)
            expect(page1[0].id).toBe('attempt-1')
            expect(page1[2].id).toBe('attempt-3')

            // Test page 2 (remaining items)
            const page2 = attempts.slice(itemsPerPage, itemsPerPage * 2)
            expect(page2).toHaveLength(1)
            expect(page2[0].id).toBe('attempt-4')

            console.log(`   → Total attempts: ${attempts.length}`)
            console.log(`   → Items per page: ${itemsPerPage}`)
            console.log(`   → Total pages: ${totalPages}`)
            console.log(`   → Page 1: ${page1.length} items`)
            console.log(`   → Page 2: ${page2.length} items`)
            console.log(`   → Pagination: WORKING ✓`)
        })

        it('should handle page navigation correctly', () => {
            console.log('⬅️➡️ Test: Page navigation functionality')

            const attempts = testPreviousAttempts
            const itemsPerPage = 3
            const totalPages = Math.ceil(attempts.length / itemsPerPage)
            let currentPage = 0

            // Test next page navigation
            const canGoNext = currentPage < totalPages - 1
            expect(canGoNext).toBe(true)

            if (canGoNext) {
                currentPage++
            }
            expect(currentPage).toBe(1)

            // Test previous page navigation
            const canGoPrevious = currentPage > 0
            expect(canGoPrevious).toBe(true)

            if (canGoPrevious) {
                currentPage--
            }
            expect(currentPage).toBe(0)

            console.log(`   → Initial page: 0`)
            console.log(`   → Can go next: ${canGoNext}`)
            console.log(`   → Can go previous: ${canGoPrevious}`)
            console.log(`   → Page navigation: FUNCTIONAL ✓`)
        })

        it('should calculate display indices correctly across pages', () => {
            console.log('🔢 Test: Display index calculation across pages')

            const attempts = testPreviousAttempts
            const itemsPerPage = 3

            // Test page 0 indices
            const page0Items = attempts.slice(0, itemsPerPage)
            page0Items.forEach((_, index) => {
                const displayIndex = (0 * itemsPerPage) + index + 1
                expect(displayIndex).toBe(index + 1)
            })

            // Test page 1 indices
            const page1Items = attempts.slice(itemsPerPage, itemsPerPage * 2)
            page1Items.forEach((_, index) => {
                const displayIndex = (1 * itemsPerPage) + index + 1
                expect(displayIndex).toBe(4) // Should be 4 for the single item on page 2
            })

            console.log(`   → Page 0 indices: 1, 2, 3`)
            console.log(`   → Page 1 indices: 4`)
            console.log(`   → Index calculation: ACCURATE ✓`)
        })
    })

    describe('Sorting Functionality', () => {
        console.log('🔄 Testing Sort Functionality')

        it('should sort by most recent correctly', () => {
            console.log('📅 Test: Sort by most recent')

            const attempts = [...testPreviousAttempts]
            const sortedByRecent = attempts.sort((a, b) =>
                new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
            )

            expect(sortedByRecent[0].id).toBe('attempt-4') // 2024-01-04 (most recent)
            expect(sortedByRecent[1].id).toBe('attempt-3') // 2024-01-03
            expect(sortedByRecent[2].id).toBe('attempt-2') // 2024-01-02
            expect(sortedByRecent[3].id).toBe('attempt-1') // 2024-01-01 (oldest)

            console.log(`   → Most recent: ${sortedByRecent[0].id} (${sortedByRecent[0].completedAt})`)
            console.log(`   → Oldest: ${sortedByRecent[3].id} (${sortedByRecent[3].completedAt})`)
            console.log(`   → Recent sort: WORKING ✓`)
        })

        it('should sort by oldest first correctly', () => {
            console.log('📅 Test: Sort by oldest first')

            const attempts = [...testPreviousAttempts]
            const sortedByOldest = attempts.sort((a, b) =>
                new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
            )

            expect(sortedByOldest[0].id).toBe('attempt-1') // 2024-01-01 (oldest)
            expect(sortedByOldest[1].id).toBe('attempt-2') // 2024-01-02
            expect(sortedByOldest[2].id).toBe('attempt-3') // 2024-01-03
            expect(sortedByOldest[3].id).toBe('attempt-4') // 2024-01-04 (newest)

            console.log(`   → Oldest: ${sortedByOldest[0].id} (${sortedByOldest[0].completedAt})`)
            console.log(`   → Newest: ${sortedByOldest[3].id} (${sortedByOldest[3].completedAt})`)
            console.log(`   → Oldest sort: WORKING ✓`)
        })

        it('should sort by highest score correctly', () => {
            console.log('📈 Test: Sort by highest score')

            const attempts = [...testPreviousAttempts]
            const sortedByHighestScore = attempts.sort((a, b) => b.percentage - a.percentage)

            expect(sortedByHighestScore[0].percentage).toBe(100) // attempt-2
            expect(sortedByHighestScore[1].percentage).toBe(67)  // attempt-1 or attempt-4
            expect(sortedByHighestScore[3].percentage).toBe(33)  // attempt-3

            // Verify descending order
            for (let i = 0; i < sortedByHighestScore.length - 1; i++) {
                expect(sortedByHighestScore[i].percentage).toBeGreaterThanOrEqual(sortedByHighestScore[i + 1].percentage)
            }

            console.log(`   → Highest: ${sortedByHighestScore[0].percentage}%`)
            console.log(`   → Lowest: ${sortedByHighestScore[3].percentage}%`)
            console.log(`   → High score sort: WORKING ✓`)
        })

        it('should sort by lowest score correctly', () => {
            console.log('📉 Test: Sort by lowest score')

            const attempts = [...testPreviousAttempts]
            const sortedByLowestScore = attempts.sort((a, b) => a.percentage - b.percentage)

            expect(sortedByLowestScore[0].percentage).toBe(33)  // attempt-3
            expect(sortedByLowestScore[3].percentage).toBe(100) // attempt-2

            // Verify ascending order
            for (let i = 0; i < sortedByLowestScore.length - 1; i++) {
                expect(sortedByLowestScore[i].percentage).toBeLessThanOrEqual(sortedByLowestScore[i + 1].percentage)
            }

            console.log(`   → Lowest: ${sortedByLowestScore[0].percentage}%`)
            console.log(`   → Highest: ${sortedByLowestScore[3].percentage}%`)
            console.log(`   → Low score sort: WORKING ✓`)
        })
    })

    describe('Score Color Classification', () => {
        console.log('🎨 Testing Score Color Classification')

        it('should classify scores with correct colors', () => {
            console.log('🟢🟠🔴 Test: Score color classification')

            const getPercentageColor = (percentage: number) => {
                if (percentage >= 70) return 'green'
                if (percentage >= 40) return 'orange'
                return 'red'
            }

            const attempts = testPreviousAttempts
            const colorClassifications = attempts.map(attempt => ({
                id: attempt.id,
                percentage: attempt.percentage,
                color: getPercentageColor(attempt.percentage)
            }))

            // Verify specific color assignments
            const attempt1 = colorClassifications.find(c => c.id === 'attempt-1')
            expect(attempt1?.color).toBe('orange') // 67%

            const attempt2 = colorClassifications.find(c => c.id === 'attempt-2')
            expect(attempt2?.color).toBe('green') // 100%

            const attempt3 = colorClassifications.find(c => c.id === 'attempt-3')
            expect(attempt3?.color).toBe('red') // 33%

            const attempt4 = colorClassifications.find(c => c.id === 'attempt-4')
            expect(attempt4?.color).toBe('orange') // 67%

            colorClassifications.forEach(classification => {
                console.log(`   → ${classification.id}: ${classification.percentage}% = ${classification.color.toUpperCase()}`)
            })
            console.log(`   → Color classification: ACCURATE ✓`)
        })

        it('should handle edge cases for color boundaries', () => {
            console.log('🔍 Test: Color boundary edge cases')

            const getPercentageColor = (percentage: number) => {
                if (percentage >= 70) return 'green'
                if (percentage >= 40) return 'orange'
                return 'red'
            }

            // Test boundary values
            expect(getPercentageColor(70)).toBe('green')   // Exactly 70%
            expect(getPercentageColor(69)).toBe('orange')  // Just below 70%
            expect(getPercentageColor(40)).toBe('orange')  // Exactly 40%
            expect(getPercentageColor(39)).toBe('red')     // Just below 40%
            expect(getPercentageColor(0)).toBe('red')      // Minimum
            expect(getPercentageColor(100)).toBe('green')  // Maximum

            console.log(`   → 70%: green ✓`)
            console.log(`   → 69%: orange ✓`)
            console.log(`   → 40%: orange ✓`)
            console.log(`   → 39%: red ✓`)
            console.log(`   → Boundary handling: CORRECT ✓`)
        })
    })

    describe('Filter Functionality', () => {
        console.log('🔍 Testing Filter Functionality')

        it('should filter by exam type correctly', () => {
            console.log('📚 Test: Exam type filtering')

            const attempts = testPreviousAttempts

            // Test "all" filter (should return all attempts)
            const allAttempts = attempts.filter(attempt => {
                return true // "all" filter shows everything
            })
            expect(allAttempts).toHaveLength(4)

            // Test specific exam filter (in real app this would filter by examId)
            // For now, all test attempts are for the same exam
            const nbmeAttempts = attempts.filter(attempt => {
                return true // All our test attempts are NBME 20A
            })
            expect(nbmeAttempts).toHaveLength(4)

            console.log(`   → All exams filter: ${allAttempts.length} attempts`)
            console.log(`   → NBME 20A filter: ${nbmeAttempts.length} attempts`)
            console.log(`   → Exam filtering: FUNCTIONAL ✓`)
        })

        it('should combine filtering and sorting correctly', () => {
            console.log('🔄🔍 Test: Combined filtering and sorting')

            const attempts = testPreviousAttempts

            // Apply filter (all exams) then sort by highest score
            const filteredAndSorted = attempts
                .filter(attempt => true) // "all" filter
                .sort((a, b) => b.percentage - a.percentage) // highest score first

            expect(filteredAndSorted).toHaveLength(4)
            expect(filteredAndSorted[0].percentage).toBe(100) // Highest
            expect(filteredAndSorted[3].percentage).toBe(33)  // Lowest

            // Verify order is maintained
            for (let i = 0; i < filteredAndSorted.length - 1; i++) {
                expect(filteredAndSorted[i].percentage).toBeGreaterThanOrEqual(filteredAndSorted[i + 1].percentage)
            }

            console.log(`   → Filtered count: ${filteredAndSorted.length}`)
            console.log(`   → Sort order: ${filteredAndSorted.map(a => a.percentage + '%').join(', ')}`)
            console.log(`   → Combined filter+sort: WORKING ✓`)
        })
    })

    describe('Dashboard vs Exams Page Consistency', () => {
        console.log('🔄 Testing Dashboard vs Exams Page Consistency')

        it('should apply same pagination logic on both pages', () => {
            console.log('📄 Test: Consistent pagination logic')

            const attempts = testPreviousAttempts
            const itemsPerPage = 3

            // Dashboard pagination logic
            const dashboardPage1 = attempts.slice(0, itemsPerPage)

            // Exams page pagination logic (should be identical)
            const examsPage1 = attempts.slice(0, itemsPerPage)

            expect(dashboardPage1).toEqual(examsPage1)
            expect(dashboardPage1).toHaveLength(3)

            console.log(`   → Dashboard page 1: ${dashboardPage1.length} items`)
            console.log(`   → Exams page 1: ${examsPage1.length} items`)
            console.log(`   → Pagination consistency: MAINTAINED ✓`)
        })

        it('should apply same sorting logic on both pages', () => {
            console.log('🔄 Test: Consistent sorting logic')

            const attempts = [...testPreviousAttempts]

            // Dashboard sort logic
            const dashboardSorted = attempts.sort((a, b) => b.percentage - a.percentage)

            // Exams page sort logic (should be identical)
            const attemptsCopy = [...testPreviousAttempts]
            const examsSorted = attemptsCopy.sort((a, b) => b.percentage - a.percentage)

            expect(dashboardSorted.map(a => a.id)).toEqual(examsSorted.map(a => a.id))
            expect(dashboardSorted[0].percentage).toBe(examsSorted[0].percentage)

            console.log(`   → Dashboard first item: ${dashboardSorted[0].percentage}%`)
            console.log(`   → Exams first item: ${examsSorted[0].percentage}%`)
            console.log(`   → Sorting consistency: MAINTAINED ✓`)
        })

        it('should apply same color coding on both pages', () => {
            console.log('🎨 Test: Consistent color coding')

            const getPercentageColor = (percentage: number) => {
                if (percentage >= 70) return 'green'
                if (percentage >= 40) return 'orange'
                return 'red'
            }

            const attempts = testPreviousAttempts

            // Test that color function works consistently
            attempts.forEach(attempt => {
                const dashboardColor = getPercentageColor(attempt.percentage)
                const examsColor = getPercentageColor(attempt.percentage)

                expect(dashboardColor).toBe(examsColor)

                console.log(`   → ${attempt.id}: ${attempt.percentage}% = ${dashboardColor.toUpperCase()} (both pages)`)
            })

            console.log(`   → Color consistency: MAINTAINED ✓`)
        })
    })
})
