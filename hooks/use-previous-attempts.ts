import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

interface PreviousAttempt {
    id: string
    completedAt: string
    completedTime: string
    duration: string
    totalQuestions: number
    correctAnswers: number
    percentage: number
    score: string
}

export function usePreviousAttempts(examId: string) {
    const [attempts, setAttempts] = useState<PreviousAttempt[]>([])
    const [loading, setLoading] = useState(true)
    const { isAuthenticated, isLoading: authLoading } = useAuth()

    useEffect(() => {
        if (!examId) {
            setLoading(false)
            return
        }

        // Wait for auth to finish loading
        if (authLoading) {
            return
        }

        if (!isAuthenticated) {
            setLoading(false)
            return
        }

        const fetchAttempts = async () => {
            try {
                const response = await fetch(`/api/exam/${examId}/attempts`)

                if (response.ok) {
                    const data = await response.json()
                    setAttempts(data.attempts || [])
                }
            } catch (error) {
                console.error('Failed to fetch previous attempts:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchAttempts()
    }, [examId, isAuthenticated, authLoading])

    return { attempts, loading }
}
