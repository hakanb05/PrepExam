// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import fs from "node:fs"
import path from "node:path"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    // 1) Lees nbme20a JSON
    const nbme20aPath = path.join(process.cwd(), "data", "nbme20a.json")
    const nbme20a = JSON.parse(fs.readFileSync(nbme20aPath, "utf-8"))

    // 2) Lees nbme21 JSON
    const nbme21Path = path.join(process.cwd(), "data", "nbme21.json")
    const nbme21 = JSON.parse(fs.readFileSync(nbme21Path, "utf-8"))

    // 3) Upsert beide exams
    const dbExam20a = await prisma.exam.upsert({
        where: { id: nbme20a.examId },
        update: { title: nbme20a.title, version: nbme20a.version || 1 },
        create: { id: nbme20a.examId, title: nbme20a.title, version: nbme20a.version || 1 },
    })

    const dbExam21 = await prisma.exam.upsert({
        where: { id: nbme21.examId },
        update: { title: nbme21.title, version: nbme21.version || 1 },
        create: { id: nbme21.examId, title: nbme21.title, version: nbme21.version || 1 },
    })

    // 4) Process nbme20a Sections + Questions + Options
    for (const [idx, s] of nbme20a.sections.entries()) {
        // Stop als sectionId undefined is
        if (!s.sectionId) {
            console.error("sectionId is undefined for section:", s)
            throw new Error(`Section ${idx} has no sectionId`)
        }

        const section = await prisma.section.upsert({
            where: {
                examId_sectionId: {
                    examId: dbExam20a.id,
                    sectionId: s.sectionId
                }
            },
            update: {
                title: s.title,
                index: idx + 1
            },
            create: {
                sectionId: s.sectionId,
                title: s.title,
                index: idx + 1,
                examId: dbExam20a.id
            },
        })

        // Process questions for this section
        for (const [qIdx, q] of s.questions.entries()) {
            if (!q.qid) {
                console.error("qid is undefined for question:", q)
                throw new Error(`Question ${qIdx} in section ${s.sectionId} has no qid`)
            }

            const question = await prisma.question.upsert({
                where: {
                    examId_qid: {
                        examId: dbExam20a.id,
                        qid: q.qid
                    }
                },
                update: {
                    number: qIdx + 1,
                    stem: q.stem,
                    info: q.info || null,
                    infoImages: q.infoImages || null,
                    images: q.images || null,
                    explanationImage: q.explanationImage || null,
                    correctOptionId: q.correctOptionId || null,
                    explanation: q.explanation || null,
                    matrix: q.matrix || null
                },
                create: {
                    qid: q.qid,
                    number: qIdx + 1,
                    stem: q.stem,
                    info: q.info || null,
                    infoImages: q.infoImages || null,
                    images: q.images || null,
                    explanationImage: q.explanationImage || null,
                    correctOptionId: q.correctOptionId || null,
                    explanation: q.explanation || null,
                    matrix: q.matrix || null,
                    sectionId: section.id,
                    examId: dbExam20a.id
                },
            })

            // Process options if they exist
            if (q.options && Array.isArray(q.options)) {
                for (const [optIdx, opt] of q.options.entries()) {
                    await prisma.option.upsert({
                        where: {
                            questionId_letter: {
                                questionId: question.id,
                                letter: opt.id
                            }
                        },
                        update: {
                            text: opt.text
                        },
                        create: {
                            letter: opt.id,
                            text: opt.text,
                            questionId: question.id
                        },
                    })
                }
            }

            // Process categories if they exist
            if (q.categories && Array.isArray(q.categories)) {
                for (const [catIdx, cat] of q.categories.entries()) {
                    // First create the category if it doesn't exist
                    const category = await prisma.category.upsert({
                        where: { id: cat },
                        update: {},
                        create: { id: cat, name: cat }
                    })

                    // Then create the question-category relationship
                    await prisma.questionCategory.upsert({
                        where: {
                            questionId_categoryId: {
                                questionId: question.id,
                                categoryId: category.id
                            }
                        },
                        update: {},
                        create: {
                            questionId: question.id,
                            categoryId: category.id
                        },
                    })
                }
            }
        }
    }

    // 5) Process nbme21 Sections + Questions + Options
    for (const [idx, s] of nbme21.sections.entries()) {
        const section = await prisma.section.upsert({
            where: {
                examId_sectionId: {
                    examId: dbExam21.id,
                    sectionId: s.sectionId
                }
            },
            update: {
                title: s.title,
                index: idx + 1
            },
            create: {
                sectionId: s.sectionId,
                title: s.title,
                index: idx + 1,
                examId: dbExam21.id
            },
        })

        // Process questions for this section
        for (const [qIdx, q] of s.questions.entries()) {
            if (!q.qid) {
                console.error("qid is undefined for question:", q)
                throw new Error(`Question ${qIdx} in section ${s.sectionId} has no qid`)
            }

            const question = await prisma.question.upsert({
                where: {
                    examId_qid: {
                        examId: dbExam21.id,
                        qid: q.qid
                    }
                },
                update: {
                    qid: q.qid,
                    number: qIdx + 1,
                    stem: q.stem,
                    info: q.info || null,
                    infoImages: q.infoImages || null,
                    images: q.images || null,
                    explanationImage: q.explanationImage || null,
                    correctOptionId: q.correctOptionId || null,
                    explanation: q.explanation || null,
                    matrix: q.matrix || null
                },
                create: {
                    qid: q.qid,
                    number: qIdx + 1,
                    stem: q.stem,
                    info: q.info || null,
                    infoImages: q.infoImages || null,
                    images: q.images || null,
                    explanationImage: q.explanationImage || null,
                    correctOptionId: q.correctOptionId || null,
                    explanation: q.explanation || null,
                    matrix: q.matrix || null,
                    sectionId: section.id,
                    examId: dbExam21.id
                },
            })

            // Process options if they exist
            if (q.options && Array.isArray(q.options)) {
                for (const [optIdx, opt] of q.options.entries()) {
                    await prisma.option.upsert({
                        where: {
                            id: `${q.qid}-${opt.id}`
                        },
                        update: {
                            text: opt.text,
                            questionId: question.id
                        },
                        create: {
                            id: `${q.qid}-${opt.id}`,
                            letter: opt.id,
                            text: opt.text,
                            questionId: question.id
                        },
                    })
                }
            }

            // Process categories if they exist
            if (q.categories && Array.isArray(q.categories)) {
                for (const [catIdx, cat] of q.categories.entries()) {
                    // First create the category if it doesn't exist
                    const category = await prisma.category.upsert({
                        where: { id: cat },
                        update: {},
                        create: { id: cat, name: cat }
                    })

                    // Then create the question-category relationship
                    await prisma.questionCategory.upsert({
                        where: {
                            questionId_categoryId: {
                                questionId: question.id,
                                categoryId: category.id
                            }
                        },
                        update: {},
                        create: {
                            questionId: question.id,
                            categoryId: category.id
                        },
                    })
                }
            }
        }
    }

    // 6) Create test user and purchases
    const testUser = await prisma.user.upsert({
        where: { email: "hakanbektas934@gmail.com" },
        update: {},
        create: {
            email: "hakanbektas934@gmail.com",
            name: "Hakan Bektas",
            password: await hash("testpassword", 12),
            emailVerified: new Date(),
            image: "/default-user-avatar.png"
        },
    })

    // Create purchases for both exams
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

    await prisma.purchase.upsert({
        where: {
            userId_examId: {
                userId: testUser.id,
                examId: dbExam20a.id
            }
        },
        update: {
            expiresAt: oneYearFromNow,
            purchasedAt: new Date(),
            stripePaymentIntentId: "test_payment_20a"
        },
        create: {
            userId: testUser.id,
            examId: dbExam20a.id,
            expiresAt: oneYearFromNow,
            purchasedAt: new Date(),
            stripePaymentIntentId: "test_payment_20a"
        },
    })

    await prisma.purchase.upsert({
        where: {
            userId_examId: {
                userId: testUser.id,
                examId: dbExam21.id
            }
        },
        update: {
            expiresAt: oneYearFromNow,
            purchasedAt: new Date(),
            stripePaymentIntentId: "test_payment_21"
        },
        create: {
            userId: testUser.id,
            examId: dbExam21.id,
            expiresAt: oneYearFromNow,
            purchasedAt: new Date(),
            stripePaymentIntentId: "test_payment_21"
        },
    })

    console.log("Test user and purchases created successfully")
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })