import { useState, useEffect } from 'react'

interface ExamSection {
    sectionId: string
    title: string
    index: number
    questionCount: number
    questions: Array<{
        id: string
        qid: string
        number: number
    }>
}

interface ExamData {
    examId: string
    title: string
    version: number
    totalQuestions: number
    sections: ExamSection[]
}

interface ExamAccess {
    hasAccess: boolean
    validUntil: string | null
}

export function useExamData(examId: string) {
    const [examData, setExamData] = useState<ExamData | null>(null)
    const [examAccess, setExamAccess] = useState<ExamAccess | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)

                // Fetch exam data and access in parallel
                const [examResponse, accessResponse] = await Promise.all([
                    fetch(`/api/exam/${examId}`),
                    fetch(`/api/exam/${examId}/access`)
                ])

                if (!examResponse.ok) {
                    throw new Error('Failed to fetch exam data')
                }

                const examData = await examResponse.json()
                setExamData(examData)

                if (accessResponse.ok) {
                    const accessData = await accessResponse.json()
                    setExamAccess(accessData)
                } else {
                    // User not authenticated or other error
                    setExamAccess({ hasAccess: false, validUntil: null })
                }

            } catch (err) {
                console.error('Error fetching exam data:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        if (examId) {
            fetchData()
        }
    }, [examId])

    const refetch = async () => {
        if (examId) {
            try {
                setLoading(true)
                setError(null)

                // Fetch exam data and access in parallel
                const [examResponse, accessResponse] = await Promise.all([
                    fetch(`/api/exam/${examId}`),
                    fetch(`/api/exam/${examId}/access`)
                ])

                if (!examResponse.ok) {
                    throw new Error('Failed to fetch exam data')
                }

                const examData = await examResponse.json()
                setExamData(examData)

                if (accessResponse.ok) {
                    const accessData = await accessResponse.json()
                    setExamAccess(accessData)
                } else {
                    // User not authenticated or other error
                    setExamAccess({ hasAccess: false, validUntil: null })
                }

            } catch (err) {
                console.error('Error fetching exam data:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }
    }

    return {
        examData,
        examAccess,
        loading,
        error,
        refetch
    }
}
