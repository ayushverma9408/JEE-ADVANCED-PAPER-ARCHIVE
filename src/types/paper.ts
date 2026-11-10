export type PaperStatus = 'available' | 'pending'
export type PaperLanguage = 'English' | 'Hindi'

export interface Paper {
  id: string
  year: number
  paperNumber: 1 | 2
  subjects: string[]
  status: PaperStatus
  pdfUrls: Partial<Record<PaperLanguage, string>>
  sourceUrl: string
}

export type Subject = 'All subjects' | 'Physics' | 'Chemistry' | 'Mathematics'
