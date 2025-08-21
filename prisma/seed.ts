// prisma/seed.ts
import { PrismaClient } from "@prisma/client"
import fs from "node:fs"
import path from "node:path"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // 1) Lees JSON
  const jsonPath = path.join(process.cwd(), "data", "nbme20a.json") // jij hebt dit bestand al
  const exam = JSON.parse(fs.readFileSync(jsonPath, "utf-8"))

  // 2) Upsert Exam
  const dbExam = await prisma.exam.upsert({
    where: { id: exam.examId },
    update: { title: exam.title, version: exam.version },
    create: { id: exam.examId, title: exam.title, version: exam.version },
  })

  // 3) Sections + Questions + Options
  for (const [idx, s] of exam.sections.entries()) {
    const section = await prisma.section.upsert({
      where: { examId_sectionId: { examId: dbExam.id, sectionId: s.sectionId } },
      update: { title: s.title, index: idx + 1 },
      create: { sectionId: s.sectionId, title: s.title, index: idx + 1, examId: dbExam.id },
    })

    for (const q of s.questions) {
      const question = await prisma.question.upsert({
        where: { examId_qid: { examId: dbExam.id, qid: q.qid } },
        update: {
          number: q.number,
          stem: q.stem,
          info: q.info ?? null,
          infoImages: q.infoImages ? (Array.isArray(q.infoImages) ? q.infoImages : [q.infoImages]) : null,
          images: q.image ? (Array.isArray(q.image) ? q.image : [q.image]) : null,
          correctOptionId: q.correctOptionId ?? null,
          explanation: q.explanation ?? null,
          matrix: q.matrix ?? null,
          sectionId: section.id,
        },
        create: {
          examId: dbExam.id,
          qid: q.qid,
          number: q.number,
          stem: q.stem,
          info: q.info ?? null,
          infoImages: q.infoImages ? (Array.isArray(q.infoImages) ? q.infoImages : [q.infoImages]) : null,
          images: q.image ? (Array.isArray(q.image) ? q.image : [q.image]) : null,
          correctOptionId: q.correctOptionId ?? null,
          explanation: q.explanation ?? null,
          matrix: q.matrix ?? null,
          sectionId: section.id,
        },
      })

      if (q.options?.length) {
        // verwijder & schrijf opnieuw (simpel voor seed)
        await prisma.option.deleteMany({ where: { questionId: question.id } })
        for (const opt of q.options) {
          await prisma.option.create({
            data: {
              letter: opt.id,
              text: opt.text,
              value: opt.value ?? null,
              questionId: question.id,
            },
          })
        }
      }

      if (q.categories?.length) {
        for (const catName of q.categories) {
          // catName kan id of naam zijn; als jij een aparte categories array hebt, vervang dit door die id's.
          const catId = catName.toLowerCase().replace(/\W+/g, "_")
          const cat = await prisma.category.upsert({
            where: { id: catId },
            update: { name: catName },
            create: { id: catId, name: catName },
          })
          await prisma.questionCategory.upsert({
            where: { questionId_categoryId: { questionId: question.id, categoryId: cat.id } },
            update: {},
            create: { questionId: question.id, categoryId: cat.id },
          })
        }
      }
    }
  }

  // 4) Testuser + purchase (1 jaar geldig)
  // prisma/seed.ts (user stuk)
  const user = await prisma.user.upsert({
    where: { email: "hakanbektas934@gmail.com" },
    update: {
      name: "Hakan Bektas",
      image: null,
    },
    create: {
      email: "hakanbektas934@gmail.com",
      password: await hash("Kaas38!", 10),
      name: "Hakan Bektas",
      image: null,
      verified: true,
    },
  })

  const purchaseDate = new Date()
  const validUntil = new Date(purchaseDate)
  validUntil.setFullYear(validUntil.getFullYear() + 1)

  await prisma.purchase.upsert({
    where: {
      userId_examId: {
        userId: user.id,
        examId: dbExam.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      examId: dbExam.id,
      purchasedAt: purchaseDate,
      expiresAt: validUntil,
      amount: 2500,
      currency: 'usd'
    },
  })



  console.log("Seed completed.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
