# Technical Specification — Photo Gallery Automation Studio

This specification documents the system’s components, APIs, data contracts, processing rules, and expected behaviors. It is intended as standalone onboarding material for new contributors and LLM agents.

## 1. Architecture

- React Dashboard (Vite + Tailwind)
  - Controls the pipeline and visualizes progress via SSE
  - Provides folder pickers (Windows) for Source and Export Root
  - Loads gallery preview from `/preview/`
- Node/Express API
  - Exposes task endpoints and server-sent events
  - Serves the built gallery preview and, in production, the SPA bundle
- Processing Pipeline
  - Ingestion (EXIF + file ops), Thumbnails (sharp), Build (React + data), Export (archiver)
- Persistence
  - SQLite (`better-sqlite3`) per `exportRoot/.meta/gallery.db`

## 2. Supported Formats

- Images: `.jpg`, `.jpeg`, `.png`, `.webp`, `.heic`, `.cr2`, `.nef`
- Thumbnails: `.webp` primary, `.jpeg` fallback

## 3. API Endpoints

- `GET /api/status` → `{ currentTask, history }`
  - `currentTask`: `{ id, type: 'ingest'|'build-site'|'export', status: 'running', startedAt, params } | null`
  - `history`: per-task summary `{ [type]: { status, finishedAt, durationMs, params, error? } }`

- `GET /api/events` (SSE)
  - Events: `status` → same payload as `/status`; `log` → `{ taskId, type, level, message, timestamp }`; `ping`

- `POST /api/ingest`
  - Body: `{ source: string, exportRoot: string }`
  - Behavior: starts ingestion; rejects with 409 if another task is running

- `POST /api/build`
  - Body: `{ exportRoot: string, paginate?: number }`
  - Behavior: if `dist/` missing, auto-runs `npm run build:web`; copies into `exportRoot/site`; writes `data.json`, `sitemap.xml`, `robots.txt`

- `POST /api/export`
  - Body: `{ exportRoot: string, zip: string }`
  - Behavior: zips `exportRoot/` into `zip`

- `POST /api/pick-folder` (Windows only)
  - Body: `{ title?: string, initialDir?: string }`
  - Returns: `{ path: string }` or 204 if canceled; 501 on unsupported OS

- Preview
  - `GET /preview/*` statically serves `exportRoot/site/*`

## 4. Data Model

SQLite schema (`exportRoot/.meta/gallery.db`):
```
CREATE TABLE IF NOT EXISTS images (
  hash TEXT PRIMARY KEY,
  sourcePath TEXT NOT NULL,
  captureDate TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  destPath TEXT NOT NULL,         -- POSIX, e.g., 2024/05/IMG_0001.jpg
  thumbWidth INTEGER,
  thumbHeight INTEGER
);
```

`data.json` structure (`exportRoot/site/data.json`):
```
{
  "images": [
    {
      "hash": "<sha256>",
      "sourcePath": "C:/…/IMG_0001.jpg",
      "captureDate": "2024-05-30T14:23:10.000Z",
      "year": 2024,
      "month": 5,
      "destPath": "2024/05/IMG_0001.jpg",
      "thumbWidth": 200,
      "thumbHeight": 150,
      "src": "../2024/05/IMG_0001.jpg",
      "thumbSrc": "../thumbs/2024/05/IMG_0001.webp",
      "thumbSrc_fallback": "../thumbs/2024/05/IMG_0001.jpeg"
    }
  ],
  "settings": { "paginate": 200 }
}
```

## 5. Processing Rules

- Enumeration: Recursive directory walk via `klaw` with extension filter
- Hashing: `sha256` over file bytes; used for idempotency
- Date Priority: EXIF `DateTimeOriginal` → fallback to file mtime
- Copying: Destination = `exportRoot/YYYY/MM/<name>`; if exists, suffix with `-1`, `-2`, …
- Thumbnails: `sharp`
  - Resize: `{ width: 200, height: 200, fit: 'inside', withoutEnlargement: true }`
  - Orientation: `rotate()` to honor EXIF
  - Formats: WebP quality 80 (primary), JPEG quality 80 (fallback)
  - Skip: if WebP already exists
- Build: Ensure `dist/` exists, else run `npm run build:web`; copy to `exportRoot/site/`
- Paths: Normalize `destPath` and URL paths to POSIX for client portability
- SEO: Build `sitemap.xml` (home + paginated months) and `robots.txt`

## 6. Frontend Behavior

- Dashboard State: `currentTask`, `history`, `logs`, `previewAvailable`
- Activity Feed: SSE `log` events, capped at ~300 entries
- Gallery Preview: iframe loads `/preview/index.html` with cache-busting `?rev`
- Folder Picker: Calls `/api/pick-folder` and populates inputs; shows error if unsupported/failed

## 7. Concurrency & Error Handling

- Single-Task Gate: Orchestrator rejects new tasks with 409 if one is running
- Logging: All tasks emit `[start]`, progress, and `[done]`/`[error]` lines to SSE
- Failures: Task `history[type]` records `status: 'failed'`, `error`, and duration

## 8. Security & Safety

- Inputs are treated as file-system paths; no shell expansion is performed on them
- The only spawned command is `npm run build:web` and the Windows folder picker PowerShell; outputs are streamed and errors surfaced
- API is intended for local use during authoring

## 9. Performance Targets

- Ingest: ~50 img/sec (JPEG/PNG/WebP); ~10 img/sec (HEIC/RAW) on mid-tier hardware
- Month page LCP: <2.5s with 200 thumbnails on 3G Fast
- JS payload: <120KB gzipped for main bundle

## 10. Edge Cases

- Corrupt images: Skip with logged error; continue
- EXIF missing: Use mtime; still organized into `/YYYY/MM/`
- Permission errors: Log and continue; report failures in Activity Feed
- Long paths / non-ASCII: Stored as-is; client paths normalized to POSIX

## 11. Local Development

- Run API + UI: `npm run dev`
- Manual CLI: see README
- Static preview without API: `npx serve export/site -l 8080`

## 12. Future Enhancements

- Cross-platform folder pickers (macOS: AppleScript; Linux: zenity/kdialog)
- Pause/Resume and batching for massive libraries
- Optional EXIF timezone normalization
- Advanced SEO (OpenGraph per page)