import { Prisma, PrismaClient, QuestionType } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { requireAdmin, requireAuth } from './middleware.js'

const examCreateSchema = z.object({
  title: z.string().trim().min(3).max(160),
  year: z.number().int().min(2000).max(2100).nullable().optional(),
  paperNumber: z.number().int().min(1).max(2).nullable().optional(),
  durationSec: z.number().int().min(60).max(24 * 60 * 60),
})

const examUpdateSchema = examCreateSchema.partial().extend({
  isPublished: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update.')

const questionFields = {
  section: z.string().trim().min(1).max(80),
  subject: z.enum(['Physics', 'Chemistry', 'Mathematics']),
  topic: z.string().trim().max(120).nullable().optional(),
  type: z.nativeEnum(QuestionType),
  prompt: z.string().trim().min(1).max(20000),
  options: z.unknown().optional(),
  correctAnswer: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
  positiveMarks: z.number().finite().min(0).max(100).optional(),
  negativeMarks: z.number().finite().min(0).max(100).optional(),
  displayOrder: z.number().int().min(0).max(10000),
}

const questionCreateSchema = z.object(questionFields)
const questionUpdateSchema = z.object(questionFields).partial()
  .refine((data) => Object.keys(data).length > 0, 'Provide at least one field to update.')

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}

function questionData(data: z.infer<typeof questionCreateSchema> | z.infer<typeof questionUpdateSchema>) {
  const result: Record<string, unknown> = { ...data }
  if ('options' in result) {
    result.options = result.options === null ? Prisma.JsonNull : toJsonInput(result.options)
  }
  if ('correctAnswer' in result) result.correctAnswer = toJsonInput(result.correctAnswer)
  return result
}

export function createAdminRouter(prisma: PrismaClient) {
  const router = Router()
  router.use(requireAuth(prisma), requireAdmin)

  router.get('/exams', async (_req, res, next) => {
    try {
      const exams = await prisma.exam.findMany({
        orderBy: [{ year: 'desc' }, { paperNumber: 'asc' }, { createdAt: 'desc' }],
        include: { _count: { select: { questions: true, attempts: true } } },
      })
      res.json({ exams })
    } catch (error) {
      next(error)
    }
  })

  router.post('/exams', async (req, res, next) => {
    const parsed = examCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid exam data.' } })
      return
    }
    try {
      const exam = await prisma.exam.create({ data: parsed.data })
      res.status(201).json({ exam })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/exams/:examId', async (req, res, next) => {
    const parsed = examUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid exam data.' } })
      return
    }
    try {
      if (parsed.data.isPublished === true) {
        const questionCount = await prisma.question.count({ where: { examId: req.params.examId } })
        if (questionCount === 0) {
          res.status(400).json({ error: { code: 'EMPTY_EXAM', message: 'Add at least one question before publishing this exam.' } })
          return
        }
      }
      const exam = await prisma.exam.update({ where: { id: req.params.examId }, data: parsed.data })
      res.json({ exam })
    } catch (error) {
      next(error)
    }
  })

  router.delete('/exams/:examId', async (req, res, next) => {
    try {
      await prisma.exam.delete({ where: { id: req.params.examId } })
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  router.get('/exams/:examId/questions', async (req, res, next) => {
    try {
      const exam = await prisma.exam.findUnique({ where: { id: req.params.examId }, select: { id: true } })
      if (!exam) {
        res.status(404).json({ error: { code: 'EXAM_NOT_FOUND', message: 'Exam not found.' } })
        return
      }
      const questions = await prisma.question.findMany({
        where: { examId: exam.id },
        orderBy: { displayOrder: 'asc' },
      })
      res.json({ questions })
    } catch (error) {
      next(error)
    }
  })

  router.post('/exams/:examId/questions', async (req, res, next) => {
    const parsed = questionCreateSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid question data.' } })
      return
    }
    try {
      const exam = await prisma.exam.findUnique({ where: { id: req.params.examId }, select: { id: true } })
      if (!exam) {
        res.status(404).json({ error: { code: 'EXAM_NOT_FOUND', message: 'Exam not found.' } })
        return
      }
      const question = await prisma.question.create({
        data: { ...questionData(parsed.data), examId: exam.id } as Prisma.QuestionUncheckedCreateInput,
      })
      res.status(201).json({ question })
    } catch (error) {
      next(error)
    }
  })

  router.patch('/questions/:questionId', async (req, res, next) => {
    const parsed = questionUpdateSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid question data.' } })
      return
    }
    try {
      const question = await prisma.question.update({
        where: { id: req.params.questionId },
        data: questionData(parsed.data) as Prisma.QuestionUncheckedUpdateInput,
      })
      res.json({ question })
    } catch (error) {
      next(error)
    }
  })

  router.delete('/questions/:questionId', async (req, res, next) => {
    try {
      await prisma.question.delete({ where: { id: req.params.questionId } })
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  })

  return router
}
