# JEE Advanced Paper Archive

A responsive, dark-mode library for browsing JEE Advanced previous-year question papers from **2007 to 2025**. The archive links directly to PDFs hosted by the official JEE Advanced website.

## Features

- Browse 19 years of JEE Advanced papers (2007–2025)
- Separate Paper 1 and Paper 2 entries for each year
- Filter by Physics, Chemistry, and Mathematics
- Search papers by year and paper number
- Embedded PDF reader with English/Hindi language switching where available
- Previous/Next paper navigation inside the reader
- Reader zoom controls (50%–200%) and direct page-number navigation, using the browser PDF viewer
- Automatically save and restore each paper's selected page and zoom for each language on the same browser
- Show saved page/zoom on paper cards and offer a Resume action for papers with saved progress
- Keyboard navigation with the left and right arrow keys
- Fullscreen reader mode
- Direct PDF open/download link and official archive fallback
- Responsive dark academic interface

## PDF sources and language availability

- Official archive: https://jeeadv.ac.in/archive.html
- Official question-paper PDFs: https://jeeadv.ac.in/past_qps
- English links are listed for 2007–2025.
- Hindi links are listed for 2019–2025, where the official archive provides them.
- PDFs are loaded from the official website; this repository does not bundle the question-paper files.

Reading positions are stored locally in the browser per paper and language. The card indicator reflects the page and zoom selected with the archive's custom reader controls; the embedded cross-origin PDF viewer does not expose native-toolbar navigation or scroll position to the app.

The application generates the archive entries from `src/data/papers.ts`. Check the official archive before adding or changing a PDF URL.

## Tech stack

- React 18
- Vite 6
- TypeScript
- Lucide React
- Custom responsive CSS

## Run locally

```bash
git clone https://github.com/ayushverma9408/JEE-ADVANCED-PAPER-ARCHIVE.git
cd JEE-ADVANCED-PAPER-ARCHIVE
npm install
npm run dev
```

Create and preview a production build:

```bash
npm run build
npm run preview
```

## Project structure

```text
.
├── index.html
├── package.json
├── src/
│   ├── data/
│   │   └── papers.ts
│   ├── types/
│   │   └── paper.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
└── .github/
    └── workflows/
        └── build.yml
```

## Roadmap

- [x] Responsive archive dashboard
- [x] Year navigation, subject filters, and search
- [x] Official PDF links for the listed archive years
- [x] Embedded PDF reader
- [x] English/Hindi language switching where available
- [x] Previous/Next paper navigation
- [x] PDF zoom and page controls
- [x] Remember reader page and zoom between visits
- [x] Show saved reading positions and resume papers from their cards
- [x] Keyboard navigation and fullscreen support
- [ ] Accessibility and cross-device reader testing

---

Built as a community-focused study resource for JEE Advanced aspirants.
