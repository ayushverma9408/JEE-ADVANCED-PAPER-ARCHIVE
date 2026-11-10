import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, BookOpen, Check, CircleAlert, FilePlus2, LoaderCircle, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'

type Exam = {
  id: string
  title: string
  year: number | null
  paperNumber: number | null
  durationSec: number
  isPublished: boolean
  _count: { questions: number; attempts: number }
}

type Question = {
  id: string
  section: string
  subject: string
  topic: string | null
  type: 'SINGLE_CORRECT' | 'MULTIPLE_CORRECT' | 'NUMERICAL'
  prompt: string
  positiveMarks: number
  negativeMarks: number
  displayOrder: number
}

type Props = { onBack: () => void }

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/admin${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  if (response.status === 204) return undefined as T
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error?.message || 'The request could not be completed.')
  return payload as T
}

export default function AdminDashboard({ onBack }: Props) {
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showExamForm, setShowExamForm] = useState(false)
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  const [examForm, setExamForm] = useState({ title: '', year: '2025', paperNumber: '1', durationMinutes: '180' })
  const [questionForm, setQuestionForm] = useState({
    section: 'Section 1', subject: 'Physics', topic: '', type: 'SINGLE_CORRECT',
    prompt: '', options: '[{"id":"A","text":""},{"id":"B","text":""},{"id":"C","text":""},{"id":"D","text":""}]',
    correctAnswer: '"A"', positiveMarks: '4', negativeMarks: '1', displayOrder: '1',
  })

  const loadExams = async (keepSelection = true) => {
    const result = await api<{ exams: Exam[] }>('/exams')
    setExams(result.exams)
    const nextId = keepSelection && result.exams.some((exam) => exam.id === selectedId)
      ? selectedId
      : result.exams[0]?.id ?? ''
    setSelectedId(nextId)
    return nextId
  }

  const loadQuestions = async (examId: string) => {
    if (!examId) { setQuestions([]); return }
    const result = await api<{ questions: Question[] }>(`/exams/${examId}/questions`)
    setQuestions(result.questions)
  }

  useEffect(() => {
    let active = true
    api<{ exams: Exam[] }>('/exams')
      .then(({ exams: rows }) => {
        if (!active) return
        setExams(rows)
        setSelectedId(rows[0]?.id ?? '')
      })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'Unable to load exams.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    if (!selectedId) { setQuestions([]); return }
    api<{ questions: Question[] }>(`/exams/${selectedId}/questions`)
      .then(({ questions: rows }) => { if (active) setQuestions(rows) })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : 'Unable to load questions.') })
    return () => { active = false }
  }, [selectedId])

  const runAction = async (action: () => Promise<void>, success: string) => {
    setBusy(true); setError(''); setNotice('')
    try { await action(); setNotice(success) }
    catch (err) { setError(err instanceof Error ? err.message : 'Something went wrong.') }
    finally { setBusy(false) }
  }

  const createExam = async (event: FormEvent) => {
    event.preventDefault()
    await runAction(async () => {
      const result = await api<{ exam: Exam }>('/exams', {
        method: 'POST',
        body: JSON.stringify({
          title: examForm.title,
          year: Number(examForm.year) || null,
          paperNumber: Number(examForm.paperNumber) || null,
          durationSec: Number(examForm.durationMinutes) * 60,
        }),
      })
      await loadExams(false)
      setSelectedId(result.exam.id)
      setShowExamForm(false)
      setExamForm({ title: '', year: '2025', paperNumber: '1', durationMinutes: '180' })
    }, 'Exam created successfully.')
  }

  const createQuestion = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedId) return
    await runAction(async () => {
      let options: unknown
      let correctAnswer: unknown
      try { options = questionForm.options.trim() ? JSON.parse(questionForm.options) : undefined }
      catch { throw new Error('Options must be valid JSON.') }
      try { correctAnswer = JSON.parse(questionForm.correctAnswer) }
      catch { correctAnswer = questionForm.correctAnswer }
      await api(`/exams/${selectedId}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          section: questionForm.section,
          subject: questionForm.subject,
          topic: questionForm.topic || null,
          type: questionForm.type,
          prompt: questionForm.prompt,
          ...(options === undefined ? {} : { options }),
          correctAnswer,
          positiveMarks: Number(questionForm.positiveMarks),
          negativeMarks: Number(questionForm.negativeMarks),
          displayOrder: Number(questionForm.displayOrder),
        }),
      })
      await loadQuestions(selectedId)
      await loadExams()
      setShowQuestionForm(false)
      setQuestionForm((old) => ({ ...old, prompt: '', topic: '', displayOrder: String(questions.length + 2) }))
    }, 'Question added to the exam.')
  }

  const publishExam = async () => {
    if (!selectedId) return
    await runAction(async () => {
      await api(`/exams/${selectedId}`, { method: 'PATCH', body: JSON.stringify({ isPublished: !selectedExam?.isPublished }) })
      await loadExams()
    }, selectedExam?.isPublished ? 'Exam moved to draft.' : 'Exam published.')
  }

  const deleteQuestion = async (questionId: string) => {
    if (!window.confirm('Delete this question permanently?')) return
    await runAction(async () => {
      await api(`/questions/${questionId}`, { method: 'DELETE' })
      await loadQuestions(selectedId)
      await loadExams()
    }, 'Question deleted.')
  }

  const deleteExam = async () => {
    if (!selectedExam || !window.confirm(`Delete "${selectedExam.title}" and all its questions and attempts?`)) return
    await runAction(async () => {
      await api(`/exams/${selectedExam.id}`, { method: 'DELETE' })
      await loadExams(false)
    }, 'Exam deleted.')
  }

  const selectedExam = exams.find((exam) => exam.id === selectedId)

  return (
    <section className="admin-page">
      <div className="admin-page-heading">
        <div>
          <div className="admin-kicker"><ShieldCheck size={14} /> ADMINISTRATION</div>
          <h1>Exam control <span>room.</span></h1>
          <p>Create papers, maintain the question bank, and publish exams.</p>
        </div>
        <button className="admin-back" onClick={onBack}><ArrowLeft size={15} /> Back to archive</button>
      </div>

      <div className="admin-metrics">
        <div><span>EXAMS</span><strong>{exams.length}</strong></div>
        <div><span>QUESTIONS</span><strong>{exams.reduce((sum, exam) => sum + exam._count.questions, 0)}</strong></div>
        <div><span>PUBLISHED</span><strong>{exams.filter((exam) => exam.isPublished).length}</strong></div>
      </div>

      {error && <div className="admin-alert admin-alert-error"><CircleAlert size={15} />{error}</div>}
      {notice && <div className="admin-alert admin-alert-success"><Check size={15} />{notice}</div>}

      <div className="admin-layout">
        <aside className="admin-panel admin-exam-list">
          <div className="admin-panel-heading"><div><span className="admin-kicker">LIBRARY</span><h2>Exams</h2></div><button className="admin-square-button" onClick={() => { setError(''); setShowExamForm((value) => !value) }} aria-label="Create exam"><Plus size={17} /></button></div>
          {showExamForm && <form className="admin-form" onSubmit={createExam}>
            <label>EXAM TITLE<input required minLength={3} maxLength={160} value={examForm.title} onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} placeholder="JEE Advanced 2025 · Paper 1" /></label>
            <div className="admin-form-row"><label>YEAR<input type="number" min="2000" max="2100" value={examForm.year} onChange={(e) => setExamForm({ ...examForm, year: e.target.value })} /></label><label>PAPER<select value={examForm.paperNumber} onChange={(e) => setExamForm({ ...examForm, paperNumber: e.target.value })}><option value="1">Paper 1</option><option value="2">Paper 2</option></select></label></div>
            <label>DURATION (MINUTES)<input type="number" min="1" max="1440" required value={examForm.durationMinutes} onChange={(e) => setExamForm({ ...examForm, durationMinutes: e.target.value })} /></label>
            <button className="admin-primary-button" disabled={busy}>Create exam</button>
          </form>}
          {loading ? <div className="admin-empty"><LoaderCircle size={18} className="admin-spin" /> Loading exams…</div> : exams.length === 0 ? <div className="admin-empty">No exams yet. Create your first paper.</div> : <div className="admin-exam-items">
            {exams.map((exam) => <button key={exam.id} className={selectedId === exam.id ? 'admin-exam-item selected' : 'admin-exam-item'} onClick={() => { setSelectedId(exam.id); setShowQuestionForm(false) }}>
              <span className="admin-exam-item-top"><strong>{exam.title}</strong><i className={exam.isPublished ? 'published' : ''}>{exam.isPublished ? 'LIVE' : 'DRAFT'}</i></span>
              <small>{exam._count.questions} questions · {exam.durationSec / 60} min</small>
            </button>)}
          </div>}
        </aside>

        <div className="admin-main-column">
          {selectedExam ? <>
            <div className="admin-panel admin-selected-exam">
              <div className="admin-selected-top"><div><span className="admin-kicker">SELECTED PAPER</span><h2>{selectedExam.title}</h2><p>{selectedExam.year ?? 'Custom'} · {selectedExam.paperNumber ? `Paper ${selectedExam.paperNumber}` : 'Practice set'} · {Math.round(selectedExam.durationSec / 60)} minutes</p></div><span className={selectedExam.isPublished ? 'admin-status live' : 'admin-status'}>{selectedExam.isPublished ? 'PUBLISHED' : 'DRAFT'}</span></div>
              <div className="admin-selected-actions"><button className="admin-primary-button" onClick={() => { setShowQuestionForm((value) => !value); setError('') }}><FilePlus2 size={14} /> Add question</button><button className="admin-secondary-button" onClick={publishExam} disabled={busy || questions.length === 0 && !selectedExam.isPublished}>{selectedExam.isPublished ? 'Unpublish' : 'Publish exam'}</button><button className="admin-danger-button" onClick={deleteExam} disabled={busy}><Trash2 size={14} /> Delete</button></div>
            </div>

            {showQuestionForm && <form className="admin-panel admin-question-form" onSubmit={createQuestion}>
              <div className="admin-panel-heading"><div><span className="admin-kicker">QUESTION EDITOR</span><h2>New question</h2></div><button type="button" className="admin-text-button" onClick={() => setShowQuestionForm(false)}>Close</button></div>
              <div className="admin-form-grid">
                <label>SUBJECT<select value={questionForm.subject} onChange={(e) => setQuestionForm({ ...questionForm, subject: e.target.value })}><option>Physics</option><option>Chemistry</option><option>Mathematics</option></select></label>
                <label>QUESTION TYPE<select value={questionForm.type} onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}><option value="SINGLE_CORRECT">Single correct</option><option value="MULTIPLE_CORRECT">Multiple correct</option><option value="NUMERICAL">Numerical</option></select></label>
                <label>SECTION<input required value={questionForm.section} onChange={(e) => setQuestionForm({ ...questionForm, section: e.target.value })} /></label>
                <label>TOPIC<input value={questionForm.topic} onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })} placeholder="Optional topic" /></label>
              </div>
              <label className="admin-full-label">QUESTION STATEMENT<textarea required rows={5} value={questionForm.prompt} onChange={(e) => setQuestionForm({ ...questionForm, prompt: e.target.value })} placeholder="Enter the question text. Math notation can be added in a later editor upgrade." /></label>
              {questionForm.type !== 'NUMERICAL' && <label className="admin-full-label">OPTIONS · JSON<textarea rows={3} value={questionForm.options} onChange={(e) => setQuestionForm({ ...questionForm, options: e.target.value })} /></label>}
              <div className="admin-form-grid admin-answer-grid">
                <label>CORRECT ANSWER · JSON<input required value={questionForm.correctAnswer} onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })} placeholder={'"A" or ["A","C"] or 12.5'} /></label>
                <label>POSITIVE MARKS<input type="number" step="0.5" min="0" value={questionForm.positiveMarks} onChange={(e) => setQuestionForm({ ...questionForm, positiveMarks: e.target.value })} /></label>
                <label>NEGATIVE MARKS<input type="number" step="0.5" min="0" value={questionForm.negativeMarks} onChange={(e) => setQuestionForm({ ...questionForm, negativeMarks: e.target.value })} /></label>
                <label>DISPLAY ORDER<input type="number" min="0" value={questionForm.displayOrder} onChange={(e) => setQuestionForm({ ...questionForm, displayOrder: e.target.value })} /></label>
              </div>
              <button className="admin-primary-button" disabled={busy || !questionForm.prompt.trim()}>{busy ? 'Saving…' : 'Save question'}</button>
            </form>}

            <div className="admin-panel admin-question-list">
              <div className="admin-panel-heading"><div><span className="admin-kicker">QUESTION BANK</span><h2>{questions.length} questions</h2></div><button className="admin-square-button" onClick={() => loadQuestions(selectedId).catch((err) => setError(err.message))} aria-label="Refresh questions"><RefreshCw size={15} /></button></div>
              {questions.length === 0 ? <div className="admin-empty"><BookOpen size={19} /> No questions in this exam yet. Add the first question to enable publishing.</div> : <div className="admin-question-items">
                {questions.map((question, index) => <article className="admin-question-item" key={question.id}><div className="admin-question-number">{String(index + 1).padStart(2, '0')}</div><div className="admin-question-copy"><div><span>{question.subject.toUpperCase()}</span><span>{question.type.replaceAll('_', ' ')}</span><span>{question.positiveMarks > 0 ? `+${question.positiveMarks}` : '0'} / −{question.negativeMarks}</span></div><p>{question.prompt}</p><small>{question.section}{question.topic ? ` · ${question.topic}` : ''}</small></div><button className="admin-icon-danger" onClick={() => deleteQuestion(question.id)} aria-label="Delete question"><Trash2 size={15} /></button></article>)}
              </div>}
            </div>
          </> : <div className="admin-panel admin-empty admin-no-selection"><BookOpen size={22} /><strong>Select an exam</strong><span>Choose a paper from the library or create a new one.</span></div>}
        </div>
      </div>
      <div className="admin-security-note"><ShieldCheck size={14} /> Answer keys are only visible in administrator tools. They must never be sent to the student exam interface.</div>
    </section>
  )
}
