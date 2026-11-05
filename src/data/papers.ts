import type { Paper } from '../types/paper'

// Add a PDF under public/papers/<year>/ and set pdfUrl when it is ready.
// The archive intentionally marks every entry pending until a verified file is added.
export const papers: Paper[] = Array.from({ length: 19 }, (_, index) => 2025 - index)
  .flatMap((year) => ([1, 2] as const).map((paperNumber) => ({
    id: `${year}-paper-${paperNumber}`,
    year,
    paperNumber,
    subjects: ['Physics', 'Chemistry', 'Mathematics'],
    status: 'pending' as const,
  })))

export const years = Array.from({ length: 19 }, (_, index) => 2025 - index)