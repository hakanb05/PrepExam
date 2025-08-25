import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

interface ExamSection {
    sectionId: string
    title: string
    index: number
    questionCount: number
}

interface ExamData {
    id: string
    examId: string
    title: string
    description: string
    completedAttempts: number
    latestScore: number | null
    latestAttemptDate: string | null
    isExpired: boolean
    expiresAt: string | null
    hasPurchase: boolean
    sections: ExamSection[]
    totalQuestions: number
}

export function useAllExams() {
    const [exams, setExams] = useState<ExamData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { isAuthenticated, isLoading: authLoading } = useAuth()

    useEffect(() => {
        // Don't fetch if still loading auth or not authenticated
        if (authLoading || !isAuthenticated) {
            setLoading(false)
            setExams([])
            setError(null)
            return
        }

        async function fetchExams() {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch('/api/exams')

                if (!response.ok) {
                    if (response.status === 401) {
                        setError('Please log in to view exams')
                        return
                    }
                    throw new Error('Failed to fetch exams')
                }

                const data = await response.json()
                setExams(data.exams || [])

            } catch (err) {
                console.error('Error fetching exams:', err)
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        fetchExams()
    }, [isAuthenticated, authLoading])

    const refetch = async () => {
        if (!isAuthenticated) {
            setError('Please log in to view exams')
            return
        }

        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/exams')

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Please log in to view exams')
                    return
                }
                throw new Error('Failed to fetch exams')
            }

            const data = await response.json()
            setExams(data.exams || [])

        } catch (err) {
            console.error('Error fetching exams:', err)
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    return {
        exams,
        loading,
        error,
        refetch
    }
}
