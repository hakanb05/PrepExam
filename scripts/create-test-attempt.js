const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestAttempt() {
    try {
        // 1. Zoek de user
        const user = await prisma.user.findUnique({
            where: { email: 'hakanbektas934@gmail.com' }
        })

        if (!user) {
            console.log('User not found')
            return
        }

        // 2. Zoek het exam
        const exam = await prisma.exam.findUnique({
            where: { id: 'nbme20a' }
        })

        if (!exam) {
            console.log('Exam not found')
            return
        }

        // 3. Maak een nieuwe attempt
        const attempt = await prisma.attempt.create({
            data: {
                userId: user.id,
                examId: exam.id,
                startedAt: new Date(),
                completedAt: new Date(),
                status: 'completed',
                elapsedSeconds: 3600, // 1 uur
                isPaused: false
            }
        })

        console.log('Created attempt:', attempt.id)

        // 4. Zoek alle sections
        const sections = await prisma.section.findMany({
            where: { examId: exam.id },
            orderBy: { index: 'asc' }
        })

        // 5. Voor elke section, maak een attempt section en responses
        for (const section of sections) {
            const attemptSection = await prisma.attemptSection.create({
                data: {
                    attemptId: attempt.id,
                    sectionId: section.id,
                    startedAt: new Date(),
                    completedAt: new Date(),
                    status: 'completed'
                }
            })

            console.log('Created attempt section:', attemptSection.id)

            // 6. Zoek alle vragen in deze section
            const questions = await prisma.question.findMany({
                where: { sectionId: section.id },
                include: { options: true }
            })

            // 7. Voor elke vraag, maak een response met antwoord "E"
            for (const question of questions) {
                // Zoek optie E
                const optionE = question.options.find(opt => opt.letter === 'E')

                if (optionE) {
                    await prisma.response.create({
                        data: {
                            attemptId: attempt.id,
                            questionId: question.id,
                            selectedOptionId: optionE.id,
                            isCorrect: optionE.id === question.correctOptionId,
                            answeredAt: new Date()
                        }
                    })
                } else {
                    // Als er geen optie E is, neem de eerste optie
                    const firstOption = question.options[0]
                    if (firstOption) {
                        await prisma.response.create({
                            data: {
                                attemptId: attempt.id,
                                questionId: question.id,
                                selectedOptionId: firstOption.id,
                                isCorrect: firstOption.id === question.correctOptionId,
                                answeredAt: new Date()
                            }
                        })
                    }
                }
            }

            console.log(`Created responses for section ${section.sectionId}`)
        }

        console.log('Test attempt created successfully!')
        console.log('Attempt ID:', attempt.id)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createTestAttempt()
