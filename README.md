# JEE Advanced Paper Archive

A focused, dark-mode archive interface for browsing JEE Advanced question papers by year and paper number.

> **Current status:** The dashboard UI is scaffolded. The 2007–2025 paper entries are placeholders until verified PDFs are added. No question-paper PDFs are bundled yet.

## ✨ Features in the initial build

- Browse the 2007–2025 archive year by year
- Separate Paper 1 and Paper 2 entries
- Filter by Physics, Chemistry, and Mathematics
- Search the selected year's papers
- Responsive dark academic dashboard
- Clear pending states for PDFs that have not yet been uploaded

## 🧰 Tech stack

- React 18
- Vite 6
- TypeScript
- Lucide React
- Custom responsive CSS

## 🚀 Run locally

```bash
git clone https://github.com/ayushverma9408/JEE-ADVANCED-PAPER-ARCHIVE.git
cd JEE-ADVANCED-PAPER-ARCHIVE
npm install
npm run dev
```

Create a production build:

```bash
npm run build
npm run preview
```

## 📁 Project structure

```text
src/
├── components/       # Reusable UI components (planned extraction)
├── data/
│   └── papers.ts     # Archive metadata
├── types/
│   └── paper.ts      # TypeScript paper types
├── App.tsx           # Dashboard and current interactions
├── index.css         # Theme and responsive styling
└── main.tsx          # Application entry point

public/
└── papers/           # Add verified PDFs here, grouped by year
```

## 📄 Adding a paper PDF

1. Add the verified PDF under `public/papers/<year>/`.
2. Update the corresponding entry in `src/data/papers.ts` with `status: 'available'` and its public URL, for example `/papers/2025/jee-advanced-2025-paper-1.pdf`.
3. The paper card can then expose a viewer/download action.

Only add files after checking the year, paper number, and document integrity. The archive should not imply a PDF is available when it has not been added.

## 🗺️ Roadmap

- [x] Initial responsive dashboard
- [x] Year navigation and paper cards
- [x] Subject filters and search
- [ ] Add and verify official paper PDFs
- [ ] Embedded PDF viewer and download controls
- [ ] Paper metadata (exam date, duration, marking scheme)
- [ ] Improved mobile navigation and accessibility review

---

Built as a study resource for JEE Advanced aspirants.
