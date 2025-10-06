# Photo Gallery Auto-Organizer & Static Gallery Generator

A complete workflow to organize photos by capture date, generate a polished static gallery, and deliver a portable export — now with a GUI control center and live task streaming.

## Features

- Visual pipeline orchestration (Ingest → Build → Export) with live logs
- Date-aware organization into `/YYYY/MM/` with duplicate suffixes
- High-quality 200px thumbnails (WebP + JPEG fallback)
- Static gallery generation with metadata (`data.json`), `sitemap.xml`, and `robots.txt`
- Preview the built gallery from the dashboard
- Optional one-command ZIP export for delivery

## Architecture Overview

- Frontend: React (Vite, Tailwind) dashboard at `http://localhost:5173`
- Backend: Node/Express API at `http://localhost:3001` with Server-Sent Events
- Processing: `sharp` (thumbnails), `exiftool-vendored` (metadata), `better-sqlite3` (idempotency)
- Output layout under the Export Root:
  - `/YYYY/MM/` — originals
  - `/thumbs/YYYY/MM/` — thumbnails
  - `/site/` — static gallery (copied from `dist/`) + `data.json`, `sitemap.xml`, `robots.txt`
  - `/.meta/gallery.db` — SQLite database

## Prerequisites

- Node.js v18+
- npm v8+
- ExifTool installed and available on PATH:
  - Windows: Download from the ExifTool site and add to PATH
  - macOS: `brew install exiftool`
  - Linux: `sudo apt-get install libimage-exiftool-perl`

## Quick Start

1. Install dependencies
```bash
npm install
```
2. Run the app (API + Dashboard)
```bash
npm run dev
```
3. Open the dashboard: http://localhost:5173

## Using the Dashboard

1. Ingest & Organize
   - Browse to choose the photo source folder
   - Browse to set the Export Root (defaults to `./export`)
   - Click “Launch Ingestion” and watch progress in the Activity Feed
2. Build Static Gallery
   - Click “Build Gallery” (auto-builds React if needed)
   - When finished, the Gallery Preview panel loads `export/site/index.html`
3. Export for Delivery (optional)
   - Set the ZIP filename and click “Export Archive”

Direct Gallery Access:
- After a build, open `http://localhost:3001/preview/index.html` for a full-window view.

## CLI (Optional)
```bash
node cli.js ingest --source "D:/Photos" --export-root "D:/Output/Gallery"
node cli.js build-site --export-root "D:/Output/Gallery" --paginate 200
node cli.js export --export-root "D:/Output/Gallery" --zip "D:/Deliverables/gallery.zip"
```

## Troubleshooting

- White screen when double-clicking `index.html`:
  - Serve over HTTP (dashboard preview or any static server), not `file://`.
- “React build not found … dist” during Build:
  - The system now auto-runs `npm run build:web`. If it still fails, run it manually and retry.
- Folder picker fails:
  - Windows-only at the moment. On macOS/Linux, type paths manually or ask to enable OS-specific pickers.

## Project Scripts

- `npm run dev` — run API and dashboard together
- `npm run build:web` — build the React app into `dist/`
- `npm start` — serve the built dashboard (production) + API

## License

MIT