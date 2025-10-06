# Product Requirements Document (PRD) — Photo Gallery Automation Studio

## 1. Executive Summary

Photographers and archivists need a fast, reliable way to organize large photo libraries by date and publish a portable, attractive gallery. This product ingests folders, resolves capture dates from EXIF, generates thumbnails, and builds a static site with a modern UI to orchestrate the workflow — no CLI required, though it remains available.

## 2. Goals & Non-Goals

- Goals
  - Organize images by `/YYYY/MM/` reliably and idempotently
  - Provide an intuitive dashboard to run Ingest → Build → Export
  - Produce a performant static gallery with SEO basics (sitemap, robots)
  - Support ZIP export for distribution/hosting
- Non-Goals (v1)
  - Video formats, authentication, multi-user teams
  - Advanced EXIF editing, cloud sync

## 3. Users & Personas

- Solo photographer organizing personal/professional shoots
- Archivist digitizing and cataloging historical images
- Family user creating a private album for local/LAN sharing

## 4. User Stories (MVP)

- As a user, I can select a source folder and an export root via a file picker
- As a user, I can run ingestion and see live progress and errors
- As a user, I can build the static gallery and preview it in the app
- As a user, I can export a ZIP for handoff or hosting
- As a user, I can re-run steps without duplicating prior work (idempotency)

## 5. Requirements

### Functional
- F1: Discover supported image formats recursively from a source directory
- F2: Resolve capture date via EXIF `DateTimeOriginal` with mtime fallback
- F3: Copy originals to `/YYYY/MM/`; suffix duplicates
- F4: Generate 200px WebP thumbnails + JPEG fallback
- F5: Persist metadata in SQLite for idempotency and build
- F6: Build a static site (copy React `dist/` → `export/site`, write `data.json`, `sitemap.xml`, `robots.txt`)
- F7: Stream live logs/status to the UI via SSE, prevent concurrent tasks
- F8: Allow ZIP export of the entire `exportRoot`
- F9: Windows folder picker; clear errors on unsupported OS

### Non-Functional
- N1: Ingest throughput ≥50 img/sec (JPG/PNG/WebP), ≥10 img/sec (HEIC/RAW) on mid-tier hardware
- N2: Month gallery LCP <2.5s with 200 thumbs on 3G Fast
- N3: JS payload <120KB gzipped
- N4: Accessible UI (keyboard navigation, ARIA labels where applicable)
- N5: Operates offline after install; no external network calls required

## 6. KPIs
- Time-to-first-gallery (minutes from install to preview)
- Ingest throughput (imgs/sec) and error rate (% failed files)
- Build duration and page-size metrics
- Export success rate and archive size

## 7. Constraints & Assumptions
- Node.js 18+; ExifTool must be installed and on PATH
- UI and API run locally; intended for single-user machine
- Folder picker initially Windows-only

## 8. Risks & Mitigations
- R1: Large RAW/HEIC files slow down ingestion
  - Batch processing; informative logs; consider worker threads in future
- R2: Users double-click `index.html` (file://) and see blank pages
  - Provide clear guidance; preview served via `/preview`; dashboard integrates preview
- R3: Path compatibility across OSes
  - Normalize client paths to POSIX; store originals as-is on disk

## 9. Release Plan & Roadmap

- v1.0 (Now)
  - GUI dashboard with SSE logs, Windows folder picker
  - Agents A–H implemented; auto `build:web` if missing
- v1.1 (Next 2–4 weeks)
  - macOS & Linux folder pickers
  - Per-month pre-rendered HTML pages for SEO (optional path)
- v1.2 (4–6 weeks)
  - Pause/Resume tasks; partial reprocessing by directory filter
  - Basic theming for the gallery

## 10. Acceptance Criteria
- Selecting folders and running Ingest → Build yields a working preview at `/preview/index.html`
- Re-running Ingest on the same data yields skips for existing hashes and processes only new files
- Build succeeds without manual `build:web`; failures surface in the Activity Feed with actionable messages
- Export produces a valid ZIP containing originals, thumbs, and site