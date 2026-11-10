import type { Paper } from '../types/paper'

const OFFICIAL_PAPER_ARCHIVE = 'https://jeeadv.ac.in/archive.html'
const OFFICIAL_PDF_ROOT = 'https://jeeadv.ac.in/past_qps'

export const papers: Paper[] = Array.from({ length: 19 }, (_, index) => 2025 - index)
  .flatMap((year) => ([1, 2] as const).map((paperNumber) => {
    const stem = `${year}_${paperNumber}`
    const pdfUrls = year >= 2019
      ? {
          English: `${OFFICIAL_PDF_ROOT}/${stem}_English.pdf`,
          Hindi: `${OFFICIAL_PDF_ROOT}/${stem}_Hindi.pdf`,
        }
      : {
          English: `${OFFICIAL_PDF_ROOT}/${stem}.pdf`,
        }

    return {
      id: `${year}-paper-${paperNumber}`,
      year,
      paperNumber,
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      status: 'available' as const,
      pdfUrls,
      sourceUrl: OFFICIAL_PAPER_ARCHIVE,
    }
  }))

export const years = Array.from({ length: 19 }, (_, index) => 2025 - index)
