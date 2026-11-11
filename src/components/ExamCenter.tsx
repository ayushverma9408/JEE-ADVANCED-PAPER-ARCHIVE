import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, ChevronLeft, ChevronRight, CircleAlert, Clock3, Flag, LoaderCircle, Send, ShieldCheck, Trash2 } from 'lucide-react'

type Exam = { id: string; title: string; year: number | null; paperNumber: number | null; durationSec: number; _count: { questions: number } }
type Question = {
  id: string; section: string; subject: string; topic: string | null
  type: 'SINGLE_CORRECT' | 'MULTIPLE_CORRECT' | 'NUMERICAL'
  prompt: string; options: unknown; positiveMarks: number; negativeMarks: number; displayOrder: number
}
type SavedAnswer = { questionId: string; answer: unknown; isMarked: boolean; isVisited: boolean }
type Attempt = { id: string; status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED'; startedAt: string; deadlineAt: string; submittedAt: string | null; score?: number | null }
type Result = { attemptId: string; status: string; score: number; correctCount: number; incorrectCount: number; unansweredCount: number; totalQuestions: number; maxScore: number; breakdown: { questionId: string; answered: boolean; correct: boolean; marksAwarded: number }[] }
type AnswerState = { answer: unknown; isMarked: boolean; isVisited: boolean }
type Props = { onBack: () => void }

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/exams${path}`, {
    ...options, credentials: 'include',
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error?.message || 'The request could not be completed.')
  return payload as T
}

function optionsOf(value: unknown): { id: string; text: string }[] {
  if (!Array.isArray(value)) return []
  return value.map((item, index) => {
    if (typeof item === 'string' || typeof item === 'number') return { id: String(item), text: String(item) }
    if (item && typeof item === 'object') {
      const option = item as Record<string, unknown>
      return { id: String(option.id ?? index), text: String(option.text ?? option.label ?? option.id ?? '') }
    }
    return { id: String(index), text: String(item) }
  })
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds)
  return `${String(Math.floor(safe / 3600)).padStart(2, '0')}:${String(Math.floor((safe % 3600) / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`
}

export default function ExamCenter({ onBack }: Props) {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({})
  const [activeIndex, setActiveIndex] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [pending, setPending] = useState(0)
  const pendingRef = useRef<Record<string, Partial<AnswerState>>>({})
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inFlightSave = useRef<Promise<void> | null>(null)
  const submitting = useRef(false)

  const activeQuestion = questions[activeIndex]
  const currentState = activeQuestion ? answers[activeQuestion.id] : undefined
  const answeredCount = useMemo(() => Object.values(answers).filter((item) => item.answer !== null && item.answer !== undefined && item.answer !== '').length, [answers])
  const markedCount = useMemo(() => Object.values(answers).filter((item) => item.isMarked).length, [answers])

  useEffect(() => {
    let alive = true
    api<{ exams: Exam[] }>('')
      .then(({ exams: rows }) => { if (alive) setExams(rows) })
      .catch((err: unknown) => { if (alive) setError(err instanceof Error ? err.message : 'Unable to load exams.') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const queueSave = useCallback((questionId: string, patch: Partial<AnswerState>) => {
    pendingRef.current[questionId] = { ...pendingRef.current[questionId], ...patch }
    setPending(1)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const batch = pendingRef.current
      pendingRef.current = {}
      const saving = Promise.all(Object.entries(batch).map(([id, data]) =>
        api(`/attempts/${attempt?.id}/answers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      )).then(() => undefined)
      inFlightSave.current = saving
      try {
        await saving
      } catch (err) {
        setError(err instanceof Error ? `Autosave issue: ${err.message}` : 'Autosave failed. Your latest changes may not be saved.')
        pendingRef.current = { ...batch, ...pendingRef.current }
      } finally {
        if (inFlightSave.current === saving) inFlightSave.current = null
      }
      setPending(0)
    }, 450)
  }, [attempt?.id])

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
  }, [])

  const openExam = async (exam: Exam) => {
    setBusy(true); setError(''); setResult(null)
    try {
      const started = await api<{ attempt: Attempt; answers: SavedAnswer[] }>(`/${exam.id}/attempts`, { method: 'POST', body: '{}' })
      const data = await api<{ attempt: Attempt; exam: { questions: Question[] }; answers: SavedAnswer[] }>(`/attempts/${started.attempt.id}`)
      setAttempt(data.attempt)
      setQuestions(data.exam.questions)
      setAnswers(Object.fromEntries(data.answers.map((item) => [item.questionId, {
        answer: item.answer, isMarked: item.isMarked, isVisited: item.isVisited,
      }])))
      setActiveIndex(0)
      const firstQuestion = data.exam.questions[0]
      if (firstQuestion && data.attempt.status === 'IN_PROGRESS' && !data.answers.some((item) => item.questionId === firstQuestion.id && item.isVisited)) {
        setAnswers((old) => ({ ...old, [firstQuestion.id]: { answer: null, isMarked: false, isVisited: true } }))
        void api(`/attempts/${data.attempt.id}/answers/${firstQuestion.id}`, { method: 'PATCH', body: JSON.stringify({ isVisited: true }) })
          .catch((err: unknown) => setError(err instanceof Error ? `Could not save question state: ${err.message}` : 'Could not save question state.'))
      }
      setRemaining(Math.max(0, Math.floor((new Date(data.attempt.deadlineAt).getTime() - Date.now()) / 1000)))
      if (data.attempt.status !== 'IN_PROGRESS') {
        setError('This attempt is already closed. Start a new published paper when available.')
        setAttempt(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start this exam.')
    } finally { setBusy(false) }
  }

  const submitExam = useCallback(async (automatic = false) => {
    if (!attempt || submitting.current) return
    submitting.current = true
    setBusy(true); setError('')
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    try {
      if (inFlightSave.current) await inFlightSave.current
      const batch = pendingRef.current
      pendingRef.current = {}
      if (Object.keys(batch).length > 0) {
        const saving = Promise.all(Object.entries(batch).map(([id, data]) =>
          api(`/attempts/${attempt.id}/answers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        )).then(() => undefined)
        inFlightSave.current = saving
        try {
          await saving
        } finally {
          if (inFlightSave.current === saving) inFlightSave.current = null
        }
      }
    } catch (err) {
      setError(err instanceof Error ? `Could not save the latest responses: ${err.message}` : 'Could not save the latest responses.')
      if (!automatic) {
        pendingRef.current = { ...pendingRef.current }
        setBusy(false)
        submitting.current = false
        return
      }
    }
    try {
      const response = await api<{ result: Result }>(`/attempts/${attempt.id}/submit`, { method: 'POST', body: '{}' })
      setResult(response.result)
      setAttempt(null)
      setQuestions([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit the exam.')
    } finally {
      setBusy(false)
      submitting.current = false
      if (automatic) setRemaining(0)
    }
  }, [attempt])

  useEffect(() => {
    if (!attempt || result) return
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.floor((new Date(attempt.deadlineAt).getTime() - Date.now()) / 1000))
      setRemaining(seconds)
      if (seconds <= 0) void submitExam(true)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [attempt, result, submitExam])

  const updateCurrent = (patch: Partial<AnswerState>) => {
    if (!activeQuestion) return
    const next = { ...currentState, ...patch, isVisited: true } as AnswerState
    setAnswers((old) => ({ ...old, [activeQuestion.id]: next }))
    queueSave(activeQuestion.id, { ...patch, isVisited: true })
  }

  const goTo = (index: number) => {
    if (index < 0 || index >= questions.length) return
    setActiveIndex(index)
    const question = questions[index]
    const state = answers[question.id]
    if (!state?.isVisited) {
      setAnswers((old) => ({ ...old, [question.id]: { ...old[question.id], answer: old[question.id]?.answer ?? null, isMarked: old[question.id]?.isMarked ?? false, isVisited: true } }))
      queueSave(question.id, { isVisited: true })
    }
  }

  if (result) {
    return <section className="exam-center">
      <div className="exam-result-card">
        <div className="exam-kicker"><ShieldCheck size={14} /> ATTEMPT EVALUATED</div>
        <h1>Paper <span>complete.</span></h1>
        <div className="exam-score">{result.score}<small> / {result.maxScore} marks</small></div>
        <div className="exam-result-grid">
          <div><strong>{result.correctCount}</strong><span>Correct</span></div>
          <div><strong>{result.incorrectCount}</strong><span>Incorrect</span></div>
          <div><strong>{result.unansweredCount}</strong><span>Unanswered</span></div>
        </div>
        <p className="exam-muted">Your answers were evaluated on the server using the paper's configured positive and negative marks.</p>
        <button className="exam-primary" onClick={() => { setResult(null); setAnswers({}); setError('') }}><ArrowLeft size={15} /> Back to published exams</button>
        <div className="exam-breakdown">
          <h2>Question-wise review</h2>
          {result.breakdown.map((item, index) => <div key={item.questionId} className="exam-breakdown-row"><span>Q{index + 1}</span><strong className={item.correct ? 'correct' : item.answered ? 'incorrect' : ''}>{item.correct ? 'Correct' : item.answered ? 'Incorrect' : 'Not answered'}</strong><b>{item.marksAwarded > 0 ? '+' : ''}{item.marksAwarded}</b></div>)}
        </div>
      </div>
    </section>
  }

  if (attempt && activeQuestion) {
    const opts = optionsOf(activeQuestion.options)
    const selected = Array.isArray(currentState?.answer) ? currentState?.answer.map(String) : currentState?.answer == null ? [] : [String(currentState.answer)]
    const sections = Array.from(new Set(questions.map((question) => question.section)))
    return <section className="exam-center exam-taking">
      <header className="exam-topline">
        <div><span className="exam-kicker">JEE ARCHIVE · LIVE ATTEMPT</span><h1>Practice <span>session.</span></h1></div>
        <div className={remaining < 300 ? 'exam-clock urgent' : 'exam-clock'}><Clock3 size={17} /><div><small>TIME REMAINING</small><strong>{formatTime(remaining)}</strong></div></div>
      </header>
      <div className="exam-layout">
        <main className="exam-question-panel">
          <div className="exam-question-meta"><span>{activeQuestion.subject.toUpperCase()}</span><span>{activeQuestion.section}</span><span>{activeQuestion.type.replace('_', ' ')}</span><span>+{activeQuestion.positiveMarks} / −{activeQuestion.negativeMarks}</span></div>
          <div className="exam-question-heading"><strong>QUESTION {String(activeIndex + 1).padStart(2, '0')}</strong><span>{activeIndex + 1} OF {questions.length}</span></div>
          <div className="exam-prompt">{activeQuestion.prompt}</div>
          {activeQuestion.type === 'NUMERICAL' ? <label className="exam-numerical"><span>YOUR ANSWER</span><input inputMode="decimal" value={currentState?.answer == null ? '' : String(currentState.answer)} onChange={(event) => updateCurrent({ answer: event.target.value === '' ? null : event.target.value })} placeholder="Enter numerical value" /></label> : <div className="exam-options">
            {opts.map((option) => {
              const checked = selected.includes(option.id)
              return <button key={option.id} className={checked ? 'exam-option selected' : 'exam-option'} onClick={() => {
                if (activeQuestion.type === 'SINGLE_CORRECT') updateCurrent({ answer: option.id })
                else updateCurrent({ answer: checked ? (selected.length === 1 ? null : selected.filter((id) => id !== option.id)) : [...selected, option.id] })
              }}><span className="exam-option-key">{option.id}</span><span>{option.text}</span><span className="exam-option-check">{checked ? <Check size={15} /> : null}</span></button>
            })}
          </div>}
          <div className="exam-question-actions">
            <button className="exam-secondary" onClick={() => updateCurrent({ answer: null })}><Trash2 size={14} /> Clear response</button>
            <button className={currentState?.isMarked ? 'exam-mark active' : 'exam-mark'} onClick={() => updateCurrent({ isMarked: !currentState?.isMarked })}><Flag size={14} /> {currentState?.isMarked ? 'Marked for review' : 'Mark for review'}</button>
          </div>
          <div className="exam-navigation">
            <button className="exam-secondary" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0}><ChevronLeft size={15} /> Previous</button>
            <button className="exam-primary" onClick={() => goTo(activeIndex + 1)} disabled={activeIndex === questions.length - 1}>Save &amp; next <ChevronRight size={15} /></button>
          </div>
          <div className="exam-save-status"><span className="exam-live-dot" /> {pending ? 'Saving your responses…' : 'Responses are autosaved'} </div>
        </main>
        <aside className="exam-palette-panel">
          <div className="exam-palette-heading"><div><span className="exam-kicker">QUESTION PALETTE</span><h2>Your progress</h2></div><span>{answeredCount}/{questions.length}</span></div>
          <div className="exam-progress-track"><span style={{ width: `${questions.length ? answeredCount / questions.length * 100 : 0}%` }} /></div>
          <div className="exam-palette-legend"><span><i className="answered" /> Answered</span><span><i className="marked" /> Review</span><span><i className="unvisited" /> Not visited</span></div>
          {sections.map((section) => <div className="exam-palette-section" key={section}><h3>{section}</h3><div>{questions.map((question, index) => ({ question, index })).filter(({ question }) => question.section === section).map(({ question, index }) => {
            const state = answers[question.id]
            const hasAnswer = state?.answer !== null && state?.answer !== undefined && state?.answer !== ''
            const cls = state?.isMarked ? 'marked' : hasAnswer ? 'answered' : state?.isVisited ? 'visited' : 'unvisited'
            return <button key={question.id} className={`exam-palette-number ${cls} ${index === activeIndex ? 'current' : ''}`} onClick={() => goTo(index)}>{index + 1}</button>
          })}</div></div>)}
          <div className="exam-palette-summary"><span>{answeredCount} answered</span><span>{markedCount} marked</span><span>{questions.length - answeredCount} unanswered</span></div>
          <button className="exam-submit" disabled={busy} onClick={() => { if (window.confirm('Submit this paper now? You cannot change answers after submission.')) void submitExam() }}><Send size={14} /> Submit paper</button>
        </aside>
      </div>
    </section>
  }

  return <section className="exam-center">
    <div className="exam-page-heading"><div><div className="exam-kicker"><ShieldCheck size={14} /> STUDENT WORKSPACE</div><h1>Practice <span>exams.</span></h1><p>Published papers, timed attempts, and saved progress.</p></div><button className="exam-secondary" onClick={onBack}><ArrowLeft size={15} /> Back to archive</button></div>
    {error && <div className="exam-alert"><CircleAlert size={15} />{error}</div>}
    {loading ? <div className="exam-empty"><LoaderCircle className="admin-spin" size={20} /> Loading published exams…</div> : exams.length === 0 ? <div className="exam-empty">No published exams are available yet.</div> : <div className="exam-list-grid">{exams.map((exam) => <article className="exam-list-card" key={exam.id}><div className="exam-card-icon"><Clock3 size={20} /></div><span className="exam-kicker">{exam.year ?? 'PRACTICE'} {exam.paperNumber ? `· PAPER ${exam.paperNumber}` : ''}</span><h2>{exam.title}</h2><div className="exam-card-meta"><span>{exam._count.questions} questions</span><span>{Math.round(exam.durationSec / 60)} minutes</span></div><button className="exam-primary" disabled={busy} onClick={() => openExam(exam)}>{busy ? 'Loading…' : 'Start / resume exam'} <ChevronRight size={15} /></button></article>)}</div>}
  </section>
}
