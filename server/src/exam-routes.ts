import { Prisma, PrismaClient, QuestionType } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from './middleware.js'

const answerValue = z.union([z.string().max(2000), z.number().finite(), z.array(z.union([z.string().max(2000), z.number().finite()])).max(20), z.null()])
const saveAnswerSchema = z.object({
  answer: answerValue.optional(),
  isMarked: z.boolean().optional(),
  isVisited: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, 'Provide an answer or an answer-state field.')

function isAttemptExpired(startedAt: Date, durationSec: number, now = new Date()) {
  return now.getTime() >= startedAt.getTime() + durationSec * 1000
}

function normalizeAnswer(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value]
  return values.map((item) => String(item).trim()).sort()
}

function isCorrect(question: { type: QuestionType; correctAnswer: Prisma.JsonValue }, answer: Prisma.JsonValue | null) {
  if (answer === null || answer === undefined) return false

  if (question.type === 'NUMERICAL') {
    const expected = Number(question.correctAnswer)
    const actual = Number(answer)
    return Number.isFinite(expected) && Number.isFinite(actual)
      && Math.abs(expected - actual) <= 1e-6 * Math.max(1, Math.abs(expected))
  }

  const expected = normalizeAnswer(question.correctAnswer)
  const actual = normalizeAnswer(answer)
  return expected.length === actual.length && expected.every((value, index) => value === actual[index])
}

function publicQuestion(question: {
  id: string; section: string; subject: string; topic: string | null; type: QuestionType
  prompt: string; options: Prisma.JsonValue; positiveMarks: number; negativeMarks: number; displayOrder: number
}) {
  return {
    id: question.id,
    section: question.section,
    subject: question.subject,
    topic: question.topic,
    type: question.type,
    prompt: question.prompt,
    options: question.options,
    positiveMarks: question.positiveMarks,
    negativeMarks: question.negativeMarks,
    displayOrder: question.displayOrder,
  }
}

export function createExamRouter(prisma: PrismaClient) {
  const router = Router()
  router.use(requireAuth(prisma))

  router.get('/', async (_req, res, next) => {
    try {
      const exams = await prisma.exam.findMany({
        where: { isPublished: true },
        orderBy: [{ year: 'desc' }, { paperNumber: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true, title: true, year: true, paperNumber: true, durationSec: true,
          _count: { select: { questions: true } },
        },
      })
      res.json({ exams })
    } catch (error) { next(error) }
  })

  router.get('/:examId', async (req, res, next) => {
    try {
      const exam = await prisma.exam.findFirst({
        where: { id: req.params.examId, isPublished: true },
        select: {
          id: true, title: true, year: true, paperNumber: true, durationSec: true,
          questions: {
            orderBy: { displayOrder: 'asc' },
            select: {
              id: true, section: true, subject: true, topic: true, type: true,
              prompt: true, options: true, positiveMarks: true, negativeMarks: true, displayOrder: true,
            },
          },
        },
      })
      if (!exam) {
        res.status(404).json({ error: { code: 'EXAM_NOT_FOUND', message: 'Published exam not found.' } })
        return
      }
      res.json({ exam })
    } catch (error) { next(error) }
  })

  router.post('/:examId/attempts', async (req, res, next) => {
    try {
      const userId = res.locals.user.id as string
      const exam = await prisma.exam.findFirst({
        where: { id: req.params.examId, isPublished: true },
        select: { id: true, durationSec: true },
      })
      if (!exam) {
        res.status(404).json({ error: { code: 'EXAM_NOT_FOUND', message: 'Published exam not found.' } })
        return
      }

      let attempt = await prisma.examAttempt.findFirst({
        where: { examId: exam.id, userId, status: 'IN_PROGRESS' },
        orderBy: { startedAt: 'desc' },
      })
      if (attempt && isAttemptExpired(attempt.startedAt, exam.durationSec)) {
        attempt = await prisma.examAttempt.update({
          where: { id: attempt.id },
          data: { status: 'EXPIRED', submittedAt: new Date() },
        })
      }
      if (!attempt) {
        attempt = await prisma.examAttempt.create({
          data: { examId: exam.id, userId },
        })
      }
      const answers = await prisma.attemptAnswer.findMany({
        where: { attemptId: attempt.id },
        select: { questionId: true, answer: true, isMarked: true, isVisited: true, updatedAt: true },
      })
      res.status(200).json({
        attempt: {
          id: attempt.id, status: attempt.status, startedAt: attempt.startedAt,
          deadlineAt: new Date(attempt.startedAt.getTime() + exam.durationSec * 1000),
          submittedAt: attempt.submittedAt,
        },
        answers,
      })
    } catch (error) { next(error) }
  })

  router.get('/attempts/:attemptId', async (req, res, next) => {
    try {
      const userId = res.locals.user.id as string
      const attempt = await prisma.examAttempt.findFirst({
        where: { id: req.params.attemptId, userId },
        include: {
          exam: {
            select: {
              id: true, title: true, durationSec: true,
              questions: {
                orderBy: { displayOrder: 'asc' },
                select: {
                  id: true, section: true, subject: true, topic: true, type: true,
                  prompt: true, options: true, positiveMarks: true, negativeMarks: true, displayOrder: true,
                },
              },
            },
          },
          answers: { select: { questionId: true, answer: true, isMarked: true, isVisited: true, updatedAt: true } },
        },
      })
      if (!attempt) {
        res.status(404).json({ error: { code: 'ATTEMPT_NOT_FOUND', message: 'Attempt not found.' } })
        return
      }
      let status = attempt.status
      if (status === 'IN_PROGRESS' && isAttemptExpired(attempt.startedAt, attempt.exam.durationSec)) {
        status = 'EXPIRED'
        await prisma.examAttempt.update({ where: { id: attempt.id }, data: { status, submittedAt: new Date() } })
      }
      res.json({
        attempt: {
          id: attempt.id, status, startedAt: attempt.startedAt,
          deadlineAt: new Date(attempt.startedAt.getTime() + attempt.exam.durationSec * 1000),
          submittedAt: attempt.submittedAt, score: attempt.score,
        },
        exam: {
          id: attempt.exam.id, title: attempt.exam.title, durationSec: attempt.exam.durationSec,
          questions: attempt.exam.questions.map(publicQuestion),
        },
        answers: attempt.answers,
      })
    } catch (error) { next(error) }
  })

  router.patch('/attempts/:attemptId/answers/:questionId', async (req, res, next) => {
    const parsed = saveAnswerSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Invalid answer data.' } })
      return
    }
    try {
      const userId = res.locals.user.id as string
      const attempt = await prisma.examAttempt.findFirst({
        where: { id: req.params.attemptId, userId },
        include: { exam: { select: { durationSec: true } } },
      })
      if (!attempt) {
        res.status(404).json({ error: { code: 'ATTEMPT_NOT_FOUND', message: 'Attempt not found.' } })
        return
      }
      if (attempt.status !== 'IN_PROGRESS' || isAttemptExpired(attempt.startedAt, attempt.exam.durationSec)) {
        if (attempt.status === 'IN_PROGRESS') {
          await prisma.examAttempt.update({ where: { id: attempt.id }, data: { status: 'EXPIRED', submittedAt: new Date() } })
        }
        res.status(409).json({ error: { code: 'ATTEMPT_CLOSED', message: 'This attempt is no longer accepting answers.' } })
        return
      }
      const question = await prisma.question.findFirst({
        where: { id: req.params.questionId, examId: attempt.examId },
        select: { id: true },
      })
      if (!question) {
        res.status(404).json({ error: { code: 'QUESTION_NOT_FOUND', message: 'Question not found in this exam.' } })
        return
      }
      const updateData: Prisma.AttemptAnswerUncheckedCreateInput = {
        attemptId: attempt.id,
        questionId: question.id,
        ...(parsed.data.answer !== undefined ? { answer: parsed.data.answer === null ? Prisma.JsonNull : parsed.data.answer as Prisma.InputJsonValue } : {}),
        ...(parsed.data.isMarked !== undefined ? { isMarked: parsed.data.isMarked } : {}),
        ...(parsed.data.isVisited !== undefined ? { isVisited: parsed.data.isVisited } : {}),
      }
      const saved = await prisma.attemptAnswer.upsert({
        where: { attemptId_questionId: { attemptId: attempt.id, questionId: question.id } },
        create: updateData,
        update: {
          ...(parsed.data.answer !== undefined ? { answer: parsed.data.answer === null ? Prisma.JsonNull : parsed.data.answer as Prisma.InputJsonValue } : {}),
          ...(parsed.data.isMarked !== undefined ? { isMarked: parsed.data.isMarked } : {}),
          ...(parsed.data.isVisited !== undefined ? { isVisited: parsed.data.isVisited } : {}),
        },
        select: { questionId: true, answer: true, isMarked: true, isVisited: true, updatedAt: true },
      })
      res.json({ answer: saved })
    } catch (error) { next(error) }
  })

  router.post('/attempts/:attemptId/submit', async (req, res, next) => {
    try {
      const userId = res.locals.user.id as string
      const attempt = await prisma.examAttempt.findFirst({
        where: { id: req.params.attemptId, userId },
        include: {
          exam: { include: { questions: { orderBy: { displayOrder: 'asc' } } } },
          answers: true,
        },
      })
      if (!attempt) {
        res.status(404).json({ error: { code: 'ATTEMPT_NOT_FOUND', message: 'Attempt not found.' } })
        return
      }
      if (attempt.status !== 'IN_PROGRESS') {
        res.status(409).json({ error: { code: 'ATTEMPT_CLOSED', message: 'This attempt has already been closed.' } })
        return
      }
      const expired = isAttemptExpired(attempt.startedAt, attempt.exam.durationSec)
      const answerMap = new Map(attempt.answers.map((item) => [item.questionId, item.answer]))
      let score = 0
      let correctCount = 0
      let incorrectCount = 0
      let unansweredCount = 0
      const breakdown = attempt.exam.questions.map((question) => {
        const answer = answerMap.get(question.id) ?? null
        const answered = answer !== null && answer !== undefined && !(typeof answer === 'string' && answer.trim() === '') && !(Array.isArray(answer) && answer.length === 0)
        const correct = answered && isCorrect(question, answer)
        const marksAwarded = correct ? question.positiveMarks : answered ? -question.negativeMarks : 0
        score += marksAwarded
        if (correct) correctCount += 1
        else if (answered) incorrectCount += 1
        else unansweredCount += 1
        return { questionId: question.id, subject: question.subject, topic: question.topic, prompt: question.prompt, type: question.type, answer, correctAnswer: question.correctAnswer, positiveMarks: question.positiveMarks, answered, correct, marksAwarded }
      })
      const closed = await prisma.examAttempt.update({
        where: { id: attempt.id },
        data: { status: expired ? 'EXPIRED' : 'SUBMITTED', submittedAt: new Date(), score, resultData: { correctCount, incorrectCount, unansweredCount, totalQuestions: attempt.exam.questions.length, maxScore: attempt.exam.questions.reduce((total, question) => total + question.positiveMarks, 0), breakdown } as Prisma.InputJsonValue },
      })
      res.json({
        result: {
          attemptId: closed.id, status: closed.status, score,
          correctCount, incorrectCount, unansweredCount,
          totalQuestions: attempt.exam.questions.length,
          maxScore: attempt.exam.questions.reduce((total, question) => total + question.positiveMarks, 0),
          breakdown,
        },
      })
    } catch (error) { next(error) }
  })

  return router
}
