import { useEffect, useState } from 'react'
import { Activity, ArrowLeft, ArrowUpRight, Award, BookOpenCheck, ChartNoAxesColumnIncreasing, CircleAlert, Clock3, LoaderCircle, Target } from 'lucide-react'

type Attempt = {
  id: string; status: 'SUBMITTED' | 'EXPIRED'; startedAt: string; submittedAt: string | null
  score: number | null; exam: { id: string; title: string; year: number | null; paperNumber: number | null }
}
type Breakdown = {
  questionId: string; subject: string; topic: string | null; prompt: string; type: string
  answer: unknown; correctAnswer: unknown; answered: boolean; correct: boolean; marksAwarded: number
}
type Result = { correctCount: number; incorrectCount: number; unansweredCount: number; totalQuestions: number; maxScore: number; breakdown: Breakdown[] }
type Summary = {
  summary: { attempts: number; averageScore: number; bestScore: number; accuracy: number; questionsAttempted: number; totalQuestions: number; totalMaxScore: number }
  subjectStats: { subject: string; attempted: number; correct: number; marks: number; maxMarks: number; accuracy: number }[]
  weakTopics: { topic: string; attempted: number; incorrect: number; errorRate: number }[]
  attempts: Attempt[]
}
type Detail = { attempt: Attempt; result: Result }

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`/api/analytics${path}`, { credentials: 'include' })
  const payload = await response.json().catch(() => ({})) as T & { error?: { message?: string } }
  if (!response.ok) throw new Error(payload.error?.message || 'Unable to load analytics.')
  return payload
}

function answerText(value: unknown) {
  if (value === null || value === undefined || value === '') return 'Not answered'
  if (Array.isArray(value)) return value.join(', ')
  return String(value)
}

export default function AnalyticsDashboard({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<Summary | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true); setError('')
    api<Summary>('/summary').then(setData).catch((err: unknown) => setError(err instanceof Error ? err.message : 'Unable to load analytics.')).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openDetail = async (id: string) => {
    setBusyId(id); setError('')
    try { setDetail(await api<Detail>(`/attempts/${id}`)) }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load result review.') }
    finally { setBusyId('') }
  }

  if (detail) return <section className="analytics-page">
    <div className="analytics-heading"><div><div className="analytics-kicker">CLOSED ATTEMPT · QUESTION REVIEW</div><h1>Result <span>review.</span></h1><p>{detail.attempt.exam.title}</p></div><button className="exam-secondary" onClick={() => setDetail(null)}><ArrowLeft size={15}/> Back to analytics</button></div>
    <div className="analytics-review-summary"><strong>{detail.attempt.score ?? 0} <small>/ {detail.result.maxScore} marks</small></strong><span>{detail.result.correctCount} correct · {detail.result.incorrectCount} incorrect · {detail.result.unansweredCount} unanswered</span></div>
    <div className="analytics-review-list">{detail.result.breakdown.map((item, index) => <article className="analytics-review-card" key={item.questionId}>
      <div className="analytics-review-top"><span>QUESTION {String(index + 1).padStart(2, '0')} · {item.subject.toUpperCase()}</span><b className={item.correct ? 'good' : item.answered ? 'bad' : ''}>{item.correct ? 'Correct' : item.answered ? 'Incorrect' : 'Unanswered'} · {item.marksAwarded > 0 ? '+' : ''}{item.marksAwarded}</b></div>
      <p>{item.prompt}</p><div className="analytics-answer-grid"><div><small>YOUR ANSWER</small><strong>{answerText(item.answer)}</strong></div><div><small>CORRECT ANSWER</small><strong>{answerText(item.correctAnswer)}</strong></div></div>
      {item.topic && <small className="analytics-topic">TOPIC · {item.topic}</small>}
    </article>)}</div>
  </section>

  return <section className="analytics-page">
    <div className="analytics-heading"><div><div className="analytics-kicker"><Activity size={14}/> STUDENT PERFORMANCE</div><h1>Performance <span>insights.</span></h1><p>Your submitted attempts, accuracy, subject trends, and topics to revisit.</p></div><button className="exam-secondary" onClick={onBack}><ArrowLeft size={15}/> Back to archive</button></div>
    {error && <div className="exam-alert"><CircleAlert size={15}/>{error}</div>}
    {loading ? <div className="exam-empty"><LoaderCircle className="admin-spin" size={20}/> Loading your performance…</div> : !data ? null : <>
      <div className="analytics-metrics">
        <Metric icon={<BookOpenCheck size={17}/>} label="CLOSED ATTEMPTS" value={data.summary.attempts}/>
        <Metric icon={<Award size={17}/>} label="BEST SCORE" value={data.summary.bestScore}/>
        <Metric icon={<ChartNoAxesColumnIncreasing size={17}/>} label="AVERAGE SCORE" value={data.summary.averageScore}/>
        <Metric icon={<Target size={17}/>} label="ANSWER ACCURACY" value={`${data.summary.accuracy}%`}/>
      </div>
      <div className="analytics-columns">
        <section className="analytics-panel"><div className="analytics-panel-heading"><div><span>SUBJECT BREAKDOWN</span><h2>Where you stand</h2></div></div>
          {data.subjectStats.length ? data.subjectStats.map((subject) => <div className="analytics-subject" key={subject.subject}><div><strong>{subject.subject}</strong><span>{subject.correct}/{subject.attempted} correct · {subject.marks.toFixed(1)} marks</span></div><b>{subject.accuracy}%</b><div className="analytics-track"><i style={{width:`${subject.accuracy}%`}}/></div></div>) : <div className="analytics-empty">Subject insights appear after your first submitted attempt.</div>}
        </section>
        <section className="analytics-panel"><div className="analytics-panel-heading"><div><span>REVISION PRIORITIES</span><h2>Topics to revisit</h2></div></div>
          {data.weakTopics.length ? data.weakTopics.map((topic) => <div className="analytics-topic-row" key={topic.topic}><div><strong>{topic.topic}</strong><small>{topic.incorrect} incorrect of {topic.attempted} attempted</small></div><b>{topic.errorRate}% error rate</b></div>) : <div className="analytics-empty">Topic trends need at least two answered questions per topic.</div>}
        </section>
      </div>
      <section className="analytics-panel analytics-history"><div className="analytics-panel-heading"><div><span>YOUR RECORD</span><h2>Attempt history</h2></div><span className="analytics-count">{data.attempts.length} attempts</span></div>
        {data.attempts.length ? data.attempts.map((attempt) => <article className="analytics-attempt" key={attempt.id}><div className="analytics-attempt-icon"><Clock3 size={17}/></div><div className="analytics-attempt-copy"><strong>{attempt.exam.title}</strong><small>{attempt.exam.year ?? 'Practice'}{attempt.exam.paperNumber ? ` · Paper ${attempt.exam.paperNumber}` : ''} · {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'Date unavailable'}</small></div><b>{attempt.score ?? 0}</b><button disabled={busyId === attempt.id} onClick={() => openDetail(attempt.id)}>{busyId === attempt.id ? 'Loading…' : 'Review'} <ArrowUpRight size={13}/></button></article>) : <div className="analytics-empty">No completed attempts yet. Submit a practice paper to start building your history.</div>}
      </section>
      <p className="analytics-footnote">Analytics include only your own submitted or expired attempts. Active attempts and answer keys are not included.</p>
    </>}
  </section>
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <article className="analytics-metric"><span>{icon}</span><small>{label}</small><strong>{value}</strong></article>
}
