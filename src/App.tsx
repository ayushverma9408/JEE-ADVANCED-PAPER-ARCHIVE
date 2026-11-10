import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Archive, ArrowUpRight, Atom, BookOpen, Check,
  ChevronDown, Command, FileText, FlaskConical,
  LayoutDashboard, Menu, Search, SlidersHorizontal, Sparkles, X,
} from 'lucide-react'
import { papers, years } from './data/papers'
import type { Paper, Subject } from './types/paper'

const subjects: Subject[] = ['All subjects', 'Physics', 'Chemistry', 'Mathematics']

function App() {
  const [activeYear, setActiveYear] = useState(2025)
  const [activeSubject, setActiveSubject] = useState<Subject>('All subjects')
  const [query, setQuery] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)

  const visiblePapers = useMemo(() => papers.filter((paper) => {
    const matchesYear = paper.year === activeYear
    const matchesSubject = activeSubject === 'All subjects' || paper.subjects.includes(activeSubject)
    const matchesQuery = `${paper.year} paper ${paper.paperNumber}`.toLowerCase().includes(query.toLowerCase().trim())
    return matchesYear && matchesSubject && matchesQuery
  }), [activeYear, activeSubject, query])

  const availableCount = papers.filter((paper) => paper.pdfUrls.English).length
  const hindiCount = papers.filter((paper) => paper.pdfUrls.Hindi).length

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Atom size={21} strokeWidth={1.8} /></div>
          <div><strong>JEE<span>ARCHIVE</span></strong><small>THE PAPER LIBRARY</small></div>
          <button className="icon-button mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={18} /></button>
        </div>

        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          <a className="nav-item active" href="#overview"><LayoutDashboard size={17} /> Overview <span className="nav-dot" /></a>
          <a className="nav-item" href="#archive"><Archive size={17} /> Paper archive</a>
          <a className="nav-item" href="#subjects"><BookOpen size={17} /> Subjects</a>
        </nav>

        <div className="side-label years-label">BROWSE BY YEAR <ChevronDown size={13} /></div>
        <div className="year-list">
          {years.map((year) => (
            <button key={year} className={`year-item ${activeYear === year ? 'year-active' : ''}`} onClick={() => { setActiveYear(year); setMobileMenu(false) }}>
              <span>{year}</span><span className="year-count">02</span>
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-note"><Sparkles size={15} /><span>Made for focused<br />JEE preparation.</span></div>
          <div className="sidebar-foot"><span className="status-pulse" /> ARCHIVE BUILD 01 <span>·</span> v1.0</div>
        </div>
      </aside>

      {mobileMenu && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileMenu(false)} />}

      <main className="main-area" id="overview">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>Overview</strong></div>
          <div className="topbar-actions">
            <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search papers..." /><kbd>⌘ K</kbd></div>
            <button className="avatar" title="JEE Advanced Archive">JA</button>
          </div>
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={20} /></button>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> YOUR PREPARATION, ORGANIZED</div>
              <h1>The JEE Advanced<br /><span>Paper Archive.</span></h1>
              <p className="hero-copy">Every year. Every paper. One focused place to practice, revisit, and improve.</p>
            </div>
            <div className="hero-emblem"><div className="emblem-ring ring-one" /><div className="emblem-ring ring-two" /><div className="emblem-core"><Atom size={43} strokeWidth={1.1} /></div><span className="emblem-caption">EST. FOR ASPIRANTS</span></div>
          </section>

          <section className="stats-grid" aria-label="Archive statistics">
            <Stat icon={<Archive size={17} />} label="YEARS IN ARCHIVE" value="19" detail="2007 — 2025" />
            <Stat icon={<FileText size={17} />} label="PAPER SLOTS" value="38" detail="2 papers per year" />
            <Stat icon={<Check size={17} />} label="OFFICIAL PDF LINKS" value={String(availableCount).padStart(2, '0')} detail="Hosted by jeeadv.ac.in" />
            <Stat icon={<BookOpen size={17} />} label="HINDI VERSIONS" value={String(hindiCount).padStart(2, '0')} detail="Available from 2019 onward" />
          </section>

          <section className="archive-section" id="archive">
            <div className="section-heading">
              <div><div className="section-kicker">THE COLLECTION</div><h2>Explore the archive<span className="heading-period">.</span></h2><p>Select a year to find its question papers.</p></div>
              <button className="filter-button" onClick={() => { setActiveSubject('All subjects'); setQuery('') }}><SlidersHorizontal size={15} /> Reset filters</button>
            </div>

            <div className="archive-toolbar">
              <div className="year-heading"><span className="year-big">{activeYear}</span><span className="year-sub">JEE ADVANCED<br />QUESTION PAPERS</span></div>
              <div className="subject-tabs" id="subjects">
                {subjects.map((subject) => <button key={subject} onClick={() => setActiveSubject(subject)} className={activeSubject === subject ? 'subject-tab selected' : 'subject-tab'}>{subject}</button>)}
              </div>
            </div>

            <div className="paper-grid">
              {visiblePapers.map((paper) => <PaperCard key={paper.id} paper={paper} onOpen={() => setSelectedPaper(paper)} />)}
              {visiblePapers.length === 0 && <div className="empty-state"><Search size={22} /><strong>No matching papers</strong><span>Try another search or reset your filters.</span></div>}
            </div>
            <div className="archive-footnote"><span className="footnote-dot" /> Papers open from the official JEE Advanced archive. Hindi versions are available from 2019 onward.</div>
          </section>

          <section className="subject-strip">
            <div><div className="section-kicker">BUILT AROUND THE SYLLABUS</div><h3>Three subjects. One goal.</h3></div>
            <div className="subject-mini"><span className="mini-icon physics"><Atom size={17} /></span><div><strong>Physics</strong><small>Concepts &amp; application</small></div><ArrowUpRight size={15} /></div>
            <div className="subject-mini"><span className="mini-icon chemistry"><FlaskConical size={17} /></span><div><strong>Chemistry</strong><small>Reactions &amp; reasoning</small></div><ArrowUpRight size={15} /></div>
            <div className="subject-mini"><span className="mini-icon maths">∑</span><div><strong>Mathematics</strong><small>Logic &amp; problem solving</small></div><ArrowUpRight size={15} /></div>
          </section>

          <footer className="footer"><span>JEE ARCHIVE <span className="footer-muted">· A COMMUNITY-FOCUSED STUDY RESOURCE</span></span><span>BUILT TO KEEP YOU MOVING FORWARD <span className="footer-star">✳</span></span></footer>
        </div>
      </main>

      {selectedPaper && <div className="modal-backdrop" onClick={() => setSelectedPaper(null)}><div className="paper-modal" onClick={(event) => event.stopPropagation()}><button className="icon-button modal-close" onClick={() => setSelectedPaper(null)} aria-label="Close"><X size={18} /></button><div className="modal-icon"><FileText size={24} /></div><div className="section-kicker">OFFICIAL QUESTION PAPER</div><h2>{selectedPaper.year} · Paper {selectedPaper.paperNumber}</h2><p>Open the original question paper directly from the official JEE Advanced website. Choose your preferred language.</p><div className="modal-status official-status"><Check size={15} /> Official source · jeeadv.ac.in</div><div className="modal-actions"><a className="primary-button" href={selectedPaper.pdfUrls.English} target="_blank" rel="noreferrer">Open English PDF <ArrowUpRight size={14} /></a>{selectedPaper.pdfUrls.Hindi && <a className="secondary-button" href={selectedPaper.pdfUrls.Hindi} target="_blank" rel="noreferrer">Open Hindi PDF <ArrowUpRight size={14} /></a>}</div><a className="source-link" href={selectedPaper.sourceUrl} target="_blank" rel="noreferrer">View complete official archive</a></div></div>}
    </div>
  )
}

function Stat({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return <div className="stat-card"><div className="stat-top"><span className="stat-icon">{icon}</span><span className="stat-label">{label}</span></div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>
}

function PaperCard({ paper, onOpen }: { paper: Paper; onOpen: () => void }) {
  return <article className="paper-card">
    <div className="paper-card-top"><div className={paper.paperNumber === 1 ? 'paper-symbol symbol-one' : 'paper-symbol symbol-two'}>{paper.paperNumber === 1 ? <Atom size={21} /> : <Command size={21} />}</div><span className="official-badge"><span /> OFFICIAL PDF</span></div>
    <div className="paper-title">Paper {paper.paperNumber}<span>0{paper.paperNumber}</span></div>
    <p className="paper-desc">JEE Advanced {paper.year} · {paper.paperNumber === 1 ? 'Morning session' : 'Afternoon session'}</p>
    <div className="paper-subjects"><span>PHY</span><span>CHE</span><span>MAT</span></div>
    <div className="paper-card-bottom"><span><FileText size={14} /> PDF available</span><button onClick={onOpen} aria-label={'Open ' + paper.year + ' paper ' + paper.paperNumber}>Open paper <ArrowUpRight size={14} /></button></div>
  </article>
}
export default App