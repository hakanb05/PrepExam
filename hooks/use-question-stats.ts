import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

interface QuestionStats {
    correct: number
    total: number
    percentage: number
}

export function useQuestionStats(examId: string) {
    const [questionStats, setQuestionStats] = useState<{ [questionId: string]: QuestionStats }>({})
    const [loading, setLoading] = useState(true)
    const { isAuthenticated } = useAuth()

    useEffect(() => {
        if (!isAuthenticated || !examId) {
            setLoading(false)
            return
        }

        const fetchQuestionStats = async () => {
            try {
                const response = await fetch(`/api/exam/${examId}/question-stats`)
                if (response.ok) {
                    const data = await response.json()
                    setQuestionStats(data)
                }
            } catch (error) {
                console.error('Failed to fetch question statistics:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchQuestionStats()
    }, [examId, isAuthenticated])

    return { questionStats, loading }
}
