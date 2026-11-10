import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Archive, ArrowUpRight, Atom, BookOpen, Check,
  ChevronDown, ChevronLeft, ChevronRight, Command, FileText, FlaskConical,
  Download, ExternalLink, LayoutDashboard, Maximize2, Menu, Search, SlidersHorizontal, Sparkles, X, ZoomIn, ZoomOut, RotateCcw,
} from 'lucide-react'
import { papers, years } from './data/papers'
import type { Paper, PaperLanguage, Subject } from './types/paper'

const subjects: Subject[] = ['All subjects', 'Physics', 'Chemistry', 'Mathematics']

function App() {
  const [activeYear, setActiveYear] = useState(2025)
  const [activeSubject, setActiveSubject] = useState<Subject>('All subjects')
  const [query, setQuery] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [readerLanguage, setReaderLanguage] = useState<PaperLanguage>('English')
  const [readerFullscreen, setReaderFullscreen] = useState(false)
  const [readerZoom, setReaderZoom] = useState(100)
  const [readerPage, setReaderPage] = useState(1)
  const readerRef = useRef<HTMLDivElement>(null)

  const openReader = (paper: Paper) => {
    setReaderLanguage('English')
    setReaderZoom(100)
    setReaderPage(1)
    setSelectedPaper(paper)
  }

  const selectedPaperIndex = selectedPaper ? papers.findIndex((paper) => paper.id === selectedPaper.id) : -1
  const previousPaper = selectedPaperIndex > 0 ? papers[selectedPaperIndex - 1] : null
  const nextPaper = selectedPaperIndex >= 0 && selectedPaperIndex < papers.length - 1 ? papers[selectedPaperIndex + 1] : null

  const navigateReader = (paper: Paper | null) => {
    if (!paper) return
    setReaderLanguage((current) => paper.pdfUrls[current] ? current : 'English')
    setReaderZoom(100)
    setReaderPage(1)
    setSelectedPaper(paper)
  }

  useEffect(() => {
    if (!selectedPaper) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPaper(null)
      if (event.key === 'ArrowLeft') { event.preventDefault(); navigateReader(previousPaper) }
      if (event.key === 'ArrowRight') { event.preventDefault(); navigateReader(nextPaper) }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [selectedPaper, previousPaper, nextPaper])

  useEffect(() => {
    const syncFullscreen = () => setReaderFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])

  const toggleReaderFullscreen = async () => {
    if (!readerRef.current) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await readerRef.current.requestFullscreen()
    } catch {
      window.open(selectedPaper?.pdfUrls[readerLanguage], '_blank', 'noopener,noreferrer')
    }
  }

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
              {visiblePapers.map((paper) => <PaperCard key={paper.id} paper={paper} onOpen={() => openReader(paper)} />)}
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

      {selectedPaper && <div className="reader-backdrop" onClick={() => setSelectedPaper(null)}>
        <section className="pdf-reader" ref={readerRef} onClick={(event) => event.stopPropagation()} aria-label="PDF paper reader">
          <header className="reader-header">
            <div className="reader-brand"><span className="reader-file-icon"><FileText size={18} /></span><div><strong>JEE Advanced {selectedPaper.year} · Paper {selectedPaper.paperNumber}</strong><small>OFFICIAL QUESTION PAPER</small></div></div>
            <div className="reader-header-actions">
              <a className="reader-icon-action" href={selectedPaper.sourceUrl} target="_blank" rel="noreferrer" title="Official archive"><ExternalLink size={16} /><span>Source</span></a>
              <button className="reader-icon-action" onClick={toggleReaderFullscreen} title="Toggle fullscreen"><Maximize2 size={16} /><span>{readerFullscreen ? 'Exit fullscreen' : 'Fullscreen'}</span></button>
              <button className="reader-close" onClick={() => setSelectedPaper(null)} aria-label="Close reader"><X size={19} /></button>
            </div>
          </header>
          <div className="reader-toolbar">
            <div className="reader-language">
              <span>LANGUAGE</span>
              {(['English', 'Hindi'] as PaperLanguage[]).map((language) => (
                <button key={language} disabled={!selectedPaper.pdfUrls[language]} className={readerLanguage === language ? 'reader-language-active' : ''} onClick={() => { setReaderLanguage(language); setReaderPage(1) }}>{language}</button>
              ))}
            </div>
            <div className="reader-view-controls" aria-label="PDF view controls">
              <div className="reader-zoom-controls">
                <button onClick={() => setReaderZoom((zoom) => Math.max(50, zoom - 10))} disabled={readerZoom <= 50} title="Zoom out"><ZoomOut size={14} /></button>
                <button className="reader-zoom-value" onClick={() => setReaderZoom(100)} title="Reset zoom">{readerZoom}%</button>
                <button onClick={() => setReaderZoom((zoom) => Math.min(200, zoom + 10))} disabled={readerZoom >= 200} title="Zoom in"><ZoomIn size={14} /></button>
              </div>
              <label className="reader-page-control"><span>PAGE</span><input aria-label="Go to PDF page" type="number" min="1" step="1" value={readerPage} onChange={(event) => setReaderPage(Math.max(1, Number.parseInt(event.target.value, 10) || 1))} /></label>
              <button className="reader-reset-control" onClick={() => { setReaderZoom(100); setReaderPage(1) }} title="Reset PDF view"><RotateCcw size={13} /><span>Reset</span></button>
            </div>
            <div className="reader-paper-nav" aria-label="Paper navigation">
              <button onClick={() => navigateReader(previousPaper)} disabled={!previousPaper} title="Previous paper (←)"><ChevronLeft size={15} /><span>Previous</span></button>
              <span>{selectedPaperIndex + 1} / {papers.length}</span>
              <button onClick={() => navigateReader(nextPaper)} disabled={!nextPaper} title="Next paper (→)"><span>Next</span><ChevronRight size={15} /></button>
            </div>
            <div className="reader-document-actions">
              <span className="reader-source-label"><span /> OFFICIAL PDF</span>
              <a href={selectedPaper.pdfUrls[readerLanguage]} target="_blank" rel="noreferrer" className="reader-download"><Download size={14} /> Download / open</a>
            </div>
          </div>
          <div className="reader-frame-wrap">
            <iframe key={`${selectedPaper.pdfUrls[readerLanguage]}-${readerPage}-${readerZoom}`} className="reader-frame" src={selectedPaper.pdfUrls[readerLanguage] ? `${selectedPaper.pdfUrls[readerLanguage]}#toolbar=1&navpanes=0&page=${readerPage}&zoom=${readerZoom}` : undefined} title={`JEE Advanced ${selectedPaper.year} Paper ${selectedPaper.paperNumber} ${readerLanguage} PDF`} />
          </div>
          <footer className="reader-footer"><span>PDF served by the official JEE Advanced website</span><a href={selectedPaper.sourceUrl} target="_blank" rel="noreferrer">Having trouble viewing? Open official archive <ArrowUpRight size={12} /></a></footer>
        </section>
      </div>}
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