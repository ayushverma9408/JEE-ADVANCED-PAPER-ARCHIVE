import { PrismaClient } from '@prisma/client'
import { Router } from 'express'
import { requireAuth } from './middleware.js'

type StoredBreakdown = {
  questionId: string
  subject: string
  topic: string | null
  prompt: string
  type: string
  answer: unknown
  correctAnswer: unknown
  answered: boolean
  correct: boolean
  marksAwarded: number
}

function resultPayload(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const data = value as Record<string, unknown>
  if (!Array.isArray(data.breakdown)) return null
  return {
    correctCount: Number(data.correctCount ?? 0),
    incorrectCount: Number(data.incorrectCount ?? 0),
    unansweredCount: Number(data.unansweredCount ?? 0),
    totalQuestions: Number(data.totalQuestions ?? 0),
    maxScore: Number(data.maxScore ?? 0),
    breakdown: data.breakdown as StoredBreakdown[],
  }
}

export function createAnalyticsRouter(prisma: PrismaClient) {
  const router = Router()
  router.use(requireAuth(prisma))

  router.get('/summary', async (req, res, next) => {
    try {
      const userId = res.locals.user.id as string
      const attempts = await prisma.examAttempt.findMany({
        where: { userId, status: { in: ['SUBMITTED', 'EXPIRED'] }, submittedAt: { not: null } },
        orderBy: { submittedAt: 'asc' },
        select: {
          id: true, status: true, startedAt: true, submittedAt: true, score: true, resultData: true,
          exam: { select: { id: true, title: true, year: true, paperNumber: true } },
        },
      })

      const subjectMap = new Map<string, { attempted: number; correct: number; marks: number; maxMarks: number }>()
      const topicMap = new Map<string, { attempted: number; incorrect: number }>()
      let totalCorrect = 0
      let totalAnswered = 0
      let totalQuestions = 0
      let totalMaxScore = 0
      let bestScore = Number.NEGATIVE_INFINITY
      let totalScore = 0

      for (const attempt of attempts) {
        const result = resultPayload(attempt.resultData)
        if (!result) continue
        totalCorrect += result.correctCount
        totalAnswered += result.correctCount + result.incorrectCount
        totalQuestions += result.totalQuestions
        totalMaxScore += result.maxScore
        const score = attempt.score ?? 0
        totalScore += score
        bestScore = Math.max(bestScore, score)
        for (const item of result.breakdown) {
          const subject = subjectMap.get(item.subject) ?? { attempted: 0, correct: 0, marks: 0, maxMarks: 0 }
          subject.maxMarks += Math.max(0, item.marksAwarded)
          if (item.answered) subject.attempted += 1
          if (item.correct) subject.correct += 1
          subject.marks += item.marksAwarded
          subjectMap.set(item.subject, subject)
          if (item.topic) {
            const topic = topicMap.get(item.topic) ?? { attempted: 0, incorrect: 0 }
            if (item.answered) topic.attempted += 1
            if (item.answered && !item.correct) topic.incorrect += 1
            topicMap.set(item.topic, topic)
          }
        }
      }

      const subjectStats = Array.from(subjectMap, ([subject, data]) => ({
        subject, ...data,
        accuracy: data.attempted ? Math.round(data.correct / data.attempted * 100) : 0,
      })).sort((a, b) => a.subject.localeCompare(b.subject))
      const weakTopics = Array.from(topicMap, ([topic, data]) => ({
        topic, ...data,
        errorRate: data.attempted ? Math.round(data.incorrect / data.attempted * 100) : 0,
      })).filter((item) => item.attempted >= 2)
        .sort((a, b) => b.errorRate - a.errorRate || b.attempted - a.attempted).slice(0, 6)

      res.json({
        summary: {
          attempts: attempts.length,
          averageScore: attempts.length ? Math.round(totalScore / attempts.length * 100) / 100 : 0,
          bestScore: attempts.length ? bestScore : 0,
          accuracy: totalAnswered ? Math.round(totalCorrect / totalAnswered * 100) : 0,
          questionsAttempted: totalAnswered,
          totalQuestions,
          totalMaxScore,
        },
        subjectStats,
        weakTopics,
        attempts: attempts.map((attempt) => ({
          id: attempt.id, status: attempt.status, startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt, score: attempt.score,
          exam: attempt.exam,
        })).reverse(),
      })
    } catch (error) { next(error) }
  })

  router.get('/attempts/:attemptId', async (req, res, next) => {
    try {
      const attempt = await prisma.examAttempt.findFirst({
        where: {
          id: req.params.attemptId,
          userId: res.locals.user.id as string,
          status: { in: ['SUBMITTED', 'EXPIRED'] },
        },
        select: {
          id: true, status: true, startedAt: true, submittedAt: true, score: true, resultData: true,
          exam: { select: { id: true, title: true, year: true, paperNumber: true } },
        },
      })
      if (!attempt) {
        res.status(404).json({ error: { code: 'RESULT_NOT_FOUND', message: 'Closed attempt result not found.' } })
        return
      }
      const result = resultPayload(attempt.resultData)
      if (!result) {
        res.status(409).json({ error: { code: 'RESULT_UNAVAILABLE', message: 'This attempt predates stored question-level review data.' } })
        return
      }
      res.json({ attempt: { id: attempt.id, status: attempt.status, startedAt: attempt.startedAt, submittedAt: attempt.submittedAt, score: attempt.score, exam: attempt.exam }, result })
    } catch (error) { next(error) }
  })

  return router
}
