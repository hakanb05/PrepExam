// Test data for exam functionality tests
export const testExamData = {
    id: "test-exam-1",
    examId: "test-exam-1",
    title: "Test USMLE Exam",
    description: "Test exam for automated testing",
    sections: [
        {
            id: "test-section-1",
            sectionId: "s1",
            title: "Test Section 1",
            questions: [
                {
                    id: "q1",
                    qid: "q1",
                    number: 1,
                    stem: "A 25-year-old patient presents with chest pain. What is the most likely diagnosis?",
                    images: undefined,
                    matrix: undefined,
                    options: [
                        { id: "A", letter: "A", text: "Myocardial infarction" },
                        { id: "B", letter: "B", text: "Pneumonia" },
                        { id: "C", letter: "C", text: "Anxiety disorder" },
                        { id: "D", letter: "D", text: "Pulmonary embolism" }
                    ],
                    correctOptionId: "C"
                },
                {
                    id: "q2",
                    qid: "q2",
                    number: 2,
                    stem: "Which medication is first-line for hypertension?",
                    images: undefined,
                    matrix: undefined,
                    options: [
                        { id: "A", letter: "A", text: "ACE inhibitors" },
                        { id: "B", letter: "B", text: "Beta blockers" },
                        { id: "C", letter: "C", text: "Calcium channel blockers" },
                        { id: "D", letter: "D", text: "Diuretics" }
                    ],
                    correctOptionId: "A"
                }
            ]
        },
        {
            id: "test-section-2",
            sectionId: "s2",
            title: "Test Section 2",
            questions: [
                {
                    id: "q3",
                    qid: "q3",
                    number: 3,
                    stem: "Matrix question: Match symptoms to conditions",
                    images: undefined,
                    matrix: {
                        columns: ["Condition A", "Condition B", "Condition C"],
                        rows: [
                            {
                                name: "Fever and headache",
                                options: ["✓", "", ""]
                            },
                            {
                                name: "Rash and joint pain",
                                options: ["", "✓", ""]
                            }
                        ]
                    },
                    options: [
                        { id: "A", letter: "A", text: "Fever and headache" },
                        { id: "B", letter: "B", text: "Rash and joint pain" }
                    ],
                    correctOptionId: "A"
                }
            ]
        }
    ]
}

export const testAttemptData = {
    id: "test-attempt-1",
    userId: "test-user-1",
    examId: "test-exam-1",
    startedAt: new Date("2024-01-01T10:00:00Z"),
    finishedAt: new Date("2024-01-01T12:00:00Z"),
    totalPausedTime: 300000, // 5 minutes
    sections: [
        {
            id: "test-attempt-section-1",
            attemptId: "test-attempt-1",
            sectionId: "test-section-1",
            currentQuestionIndex: 0,
            responses: [
                {
                    id: "response-1",
                    questionId: "q1",
                    answer: "C", // Correct answer
                    flagged: true,
                    note: "Patient seems anxious, classic presentation"
                },
                {
                    id: "response-2",
                    questionId: "q2",
                    answer: "B", // Incorrect answer (correct is A)
                    flagged: false,
                    note: null
                }
            ]
        },
        {
            id: "test-attempt-section-2",
            attemptId: "test-attempt-1",
            sectionId: "test-section-2",
            currentQuestionIndex: 0,
            responses: [
                {
                    id: "response-3",
                    questionId: "q3",
                    answer: "A", // Correct answer
                    flagged: false,
                    note: "Matrix question - remember symptom patterns"
                }
            ]
        }
    ]
}

export const testQuestionStats = {
    "q1": {
        correct: 7,
        total: 10,
        percentage: 70 // Should be green
    },
    "q2": {
        correct: 3,
        total: 10,
        percentage: 30 // Should be red
    },
    "q3": {
        correct: 5,
        total: 10,
        percentage: 50 // Should be orange
    }
}

export const testPreviousAttempts = [
    {
        id: "attempt-1",
        completedAt: "2024-01-01T12:00:00Z",
        completedTime: "12:00 PM",
        duration: "2h 0m",
        totalQuestions: 3,
        correctAnswers: 2,
        percentage: 67, // Orange
        score: "2/3"
    },
    {
        id: "attempt-2",
        completedAt: "2024-01-02T14:30:00Z",
        completedTime: "2:30 PM",
        duration: "1h 45m",
        totalQuestions: 3,
        correctAnswers: 3,
        percentage: 100, // Green
        score: "3/3"
    },
    {
        id: "attempt-3",
        completedAt: "2024-01-03T09:15:00Z",
        completedTime: "9:15 AM",
        duration: "2h 15m",
        totalQuestions: 3,
        correctAnswers: 1,
        percentage: 33, // Red
        score: "1/3"
    },
    {
        id: "attempt-4",
        completedAt: "2024-01-04T16:45:00Z",
        completedTime: "4:45 PM",
        duration: "1h 30m",
        totalQuestions: 3,
        correctAnswers: 2,
        percentage: 67, // Orange  
        score: "2/3"
    }
]

export const testUser = {
    id: "test-user-1",
    email: "test@example.com",
    name: "Test User",
    verified: true
}
