import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'

interface ResumeStatus {
    canResume: boolean
    sectionId?: string
    sectionTitle?: string
    questionNumber?: number
    timeElapsed?: string
}

export function useResumeStatus(examId: string) {
    const [resumeStatus, setResumeStatus] = useState<ResumeStatus>({ canResume: false })
    const [loading, setLoading] = useState(true)
    const { isAuthenticated } = useAuth()

    useEffect(() => {
        if (!isAuthenticated || !examId) {
            setLoading(false)
            return
        }

        const checkResumeStatus = async () => {
            try {
                const response = await fetch(`/api/exam/${examId}/resume`)
                if (response.ok) {
                    const data = await response.json()
                    setResumeStatus(data)
                }
            } catch (error) {
                console.error('Failed to check resume status:', error)
            } finally {
                setLoading(false)
            }
        }

        checkResumeStatus()
    }, [examId, isAuthenticated])

    return { resumeStatus, loading }
}
