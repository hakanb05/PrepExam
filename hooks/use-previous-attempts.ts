"use client"

import { useState, useEffect } from "react"

export interface PreviousAttempt {
    id: string
    examId: string
    completedAt: string
    completedTime: string
    duration: string
    score: number
    percentage: number
}

export function usePreviousAttempts(examId: string) {
    const [attempts, setAttempts] = useState<PreviousAttempt[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchAttempts = async () => {
            try {
                setLoading(true)
                setError(null)

                const url = examId === 'all' ? '/api/attempts' : `/api/exam/${examId}/attempts`
                const response = await fetch(url)

                if (!response.ok) {
                    throw new Error('Failed to fetch attempts')
                }

                const data = await response.json()
                setAttempts(data.attempts || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch attempts')
                setAttempts([])
            } finally {
                setLoading(false)
            }
        }

        fetchAttempts()
    }, [examId])

    return { attempts, loading, error }
}
