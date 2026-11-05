export type PaperStatus = 'available' | 'pending'

export interface Paper {
  id: string
  year: number
  paperNumber: 1 | 2
  subjects: string[]
  status: PaperStatus
  pdfUrl?: string
}

export type Subject = 'All subjects' | 'Physics' | 'Chemistry' | 'Mathematics'