"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, TrendingUp, ArrowLeft, Eye, Users, Award, Target } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePreviousAttempts } from "@/hooks/use-previous-attempts"

// Remove AttemptData interface - use PreviousAttempt from hook instead

interface ExamData {
    examId: string
    title: string
    description: string
}

export default function ExamResultsPage() {
    const router = useRouter()
    const params = useParams()
    const examId = params.examId as string
    const { isAuthenticated, isLoading: authLoading } = useAuth()

    const [examData, setExamData] = useState<ExamData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Use the existing hook for attempts - use examId if available, fallback to nbme20a
    const actualExamId = examId || 'nbme20a'
    const { attempts: hookAttempts, loading: attemptsLoading } = usePreviousAttempts(actualExamId)

    // Filtering and pagination states  
    const [sortBy, setSortBy] = useState<string>('recent')
    const [currentPage, setCurrentPage] = useState(0)
    const itemsPerPage = 5

    useEffect(() => {
        if (authLoading) return

        if (!isAuthenticated) {
            router.push('/login')
            return
        }

        const fetchExamData = async () => {
            try {
                // Fetch exam data only (attempts come from hook)
                const examResponse = await fetch(`/api/exam/${actualExamId}`, {
                    credentials: 'include'
                })
                if (!examResponse.ok) {
                    throw new Error('Failed to fetch exam data')
                }
                const examData = await examResponse.json()
                setExamData(examData)
            } catch (err) {
                console.error('Error fetching exam data:', err)
                setError('Failed to load exam data')
            } finally {
                setLoading(false)
            }
        }

        fetchExamData()
    }, [actualExamId, isAuthenticated, authLoading, router])

    // Sorting logic - use hook attempts
    const sortedAttempts = (hookAttempts || []).slice().sort((a, b) => {
        switch (sortBy) {
            case 'recent':
                return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
            case 'old':
                return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
            case 'score-high':
                return b.percentage - a.percentage
            case 'score-low':
                return a.percentage - b.percentage
            default:
                return 0
        }
    })

    // Pagination logic
    const totalPages = Math.ceil(sortedAttempts.length / itemsPerPage)
    const paginatedAttempts = sortedAttempts.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage
    )

    const getPercentageColor = (percentage: number) => {
        if (percentage >= 70) return 'text-green-600 bg-green-50 border-green-200'
        if (percentage >= 40) return 'text-orange-600 bg-orange-50 border-orange-200'
        return 'text-red-600 bg-red-50 border-red-200'
    }

    const getBadgeVariant = (percentage: number) => {
        if (percentage >= 70) return 'default'
        if (percentage >= 40) return 'secondary'
        return 'destructive'
    }

    // Calculate statistics - use hook attempts
    const totalAttempts = (hookAttempts || []).length
    const averageScore = totalAttempts > 0
        ? Math.round((hookAttempts || []).reduce((sum, attempt) => sum + attempt.percentage, 0) / totalAttempts)
        : 0
    const bestScore = totalAttempts > 0
        ? Math.max(...(hookAttempts || []).map(a => a.percentage))
        : 0
    const latestAttempt = sortedAttempts.length > 0
        ? sortedAttempts.find(a => new Date(a.completedAt).getTime() === Math.max(...(hookAttempts || []).map(a => new Date(a.completedAt).getTime())))
        : null

    if (authLoading || loading || attemptsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading exam results...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Exam Results</h1>
                    <p className="text-red-600">{error}</p>
                </div>
                <Button onClick={() => router.push('/results')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to results
                </Button>
            </div>
        )
    }

    if (!examData || !hookAttempts || hookAttempts.length === 0) {
        return (
            <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">{examData?.title || 'Exam Results'}</h1>
                    <p className="text-muted-foreground">No completed attempts found for this exam</p>
                </div>
                <Button onClick={() => router.push('/results')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to results
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/results')}
                        className="mb-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to results
                    </Button>
                    <h1 className="text-3xl font-bold">{examData.title}</h1>
                    <p className="text-muted-foreground">{examData.description}</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            Total Attempts
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalAttempts}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <Target className="h-4 w-4 mr-2" />
                            Average Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getPercentageColor(averageScore).split(' ')[0]}`}>
                            {averageScore}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Average across all {totalAttempts} attempts
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <Award className="h-4 w-4 mr-2" />
                            Best Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getPercentageColor(bestScore).split(' ')[0]}`}>
                            {bestScore}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Highest score achieved
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Latest Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${latestAttempt ? getPercentageColor(latestAttempt.percentage).split(' ')[0] : 'text-gray-500'}`}>
                            {latestAttempt ? `${latestAttempt.percentage}%` : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {latestAttempt ? `Most recent attempt` : 'No attempts yet'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">All Attempts ({totalAttempts})</h2>
                <Select value={sortBy} onValueChange={(value: string) => setSortBy(value)}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="old">Oldest First</SelectItem>
                        <SelectItem value="score-high">Highest Score</SelectItem>
                        <SelectItem value="score-low">Lowest Score</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Attempts List - using same format as exams page */}
            <div className="space-y-3">
                {paginatedAttempts.map((attempt, index) => {
                    const displayIndex = (currentPage * itemsPerPage) + index + 1
                    return (
                        <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                                    <span className="text-sm font-medium">{displayIndex}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-sm">
                                            Attempt {displayIndex} - {new Date(attempt.completedAt).toLocaleDateString()} at {attempt.completedTime}
                                        </p>
                                        <Badge className={`text-xs px-2 py-1 ${getPercentageColor(attempt.percentage)}`}>
                                            {attempt.percentage}%
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Duration: {attempt.duration} • Score: {attempt.score}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push(`/exam/${actualExamId}/review?attemptId=${attempt.id}`)}
                                >
                                    <Eye className="mr-1 h-3 w-3" />
                                    Review
                                </Button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage >= totalPages - 1}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    )
}
