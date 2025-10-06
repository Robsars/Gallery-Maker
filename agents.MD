# Agents & Task Graph

This project implements an automated photo pipeline with a GUI control center backed by a small Node API. The system is decomposed into agents with clear contracts (inputs, outputs, success criteria) and a single Orchestrator that coordinates their work. Agents are idempotent and safe to re-run.

## Agents

- Agent A — Ingestion & Discovery
  - Purpose: Walk a source directory (≤200k files), discover supported images, compute a content hash, and stage originals into the export root, organized by year/month.
  - Inputs: `source` (directory), `exportRoot` (directory)
  - Outputs:
    - Originals: `exportRoot/YYYY/MM/<filename>` (with `-1`, `-2` suffixes for duplicates)
    - Thumbnails: `exportRoot/thumbs/YYYY/MM/<name>.webp` + `.jpeg`
    - DB row per image in `exportRoot/.meta/gallery.db`
  - Success Criteria: All discovered images either inserted (new) or skipped (hash already present); thumbnails created; DB updated.

- Agent B — Date Resolver
  - Purpose: Resolve capture date per image using EXIF `DateTimeOriginal`, fallback to file mtime.
  - Inputs: `imagePath`
  - Outputs: `{ captureDate: ISO, year: YYYY, month: 1–12 }`
  - Success: Valid date for every image; EXIF orientation preserved by downstream thumbnailer.

- Agent C — Organizer / Copier
  - Purpose: Copy original bytes into `/YYYY/MM/` using deduplication by hash, suffixing duplicates: `-1`, `-2`, ...
  - Inputs: `fileBuffer`, `sourcePath`, `year`, `month`, `exportRoot`
  - Outputs: `destPath` (POSIX style): `YYYY/MM/<final-name>`
  - Success: Destination exists; collisions resolved deterministically.

- Agent D — Thumbnailer
  - Purpose: Generate 200px longest-side thumbnails with WebP primary and JPEG fallback.
  - Inputs: `fileBuffer`, `destPath`, `exportRoot`
  - Outputs: `thumbs/YYYY/MM/<name>.webp` and `.jpeg`, DB `thumbWidth`, `thumbHeight`
  - Success: WebP exists (skip if already present), JPEG fallback exists; DB updated.

- Agent E — Gallery Generator
  - Purpose: Emit a static site bundle and metadata (`data.json`), sitemap, and robots.
  - Inputs: `exportRoot`, `paginate=200`
  - Outputs:
    - `exportRoot/site/` (React build copied from `dist/`)
    - `exportRoot/site/data.json` with normalized paths
    - `exportRoot/site/sitemap.xml`, `exportRoot/site/robots.txt`
  - Success: Site assets present; data.json lists all images ordered by `captureDate DESC`.

- Agent F — Lightbox & UX (Frontend)
  - Purpose: Provide in-browser viewing UX: fit-to-screen preview, next/prev, keyboard navigation, swipe.
  - Inputs: `data.json`
  - Outputs: Interactive gallery experience in the browser.
  - Success: Fast LCP with 200 thumbnails on a month page; smooth navigation.

- Agent G — SEO & Export
  - Purpose: `sitemap.xml`, `robots.txt`, and a ZIP archive for delivery.
  - Inputs: `exportRoot`, `zip`
  - Outputs: `gallery.zip`
  - Success: Valid sitemap and robots; compressed archive produced.

- Agent H — Orchestrator
  - Purpose: Coordinate A→G, enforce single-task-at-a-time, broadcast status/logs via SSE to the UI.
  - Inputs: Task requests from the UI/HTTP
  - Outputs: Live `status` and `log` events, task results in `history`.
  - Success: No overlapping tasks; clear error reporting; resumability by re-run.

## Invocation & Coordination

- API Endpoints (served by Express on `http://localhost:3001`):
  - `GET /api/status` → `{ currentTask, history }`
  - `GET /api/events` → Server-Sent Events: `status`, `log`, `ping`
  - `POST /api/ingest` → `{ source, exportRoot }`
  - `POST /api/build` → `{ exportRoot, paginate? }`
  - `POST /api/export` → `{ exportRoot, zip }`
  - `POST /api/pick-folder` → `{ title?, initialDir? }` → `{ path }` (Windows-only native dialog)

- UI Integration
  - The React dashboard connects to `/api/events` to show live output and task state.
  - After Build completes, the preview iframe loads `http://localhost:3001/preview/index.html` (serving `exportRoot/site`).

## Data Flow & Persistence

1. Enumerate source via `klaw` → filter by extension → compute `sha256` of bytes.
2. Resolve date via `exiftool-vendored` → choose `DateTimeOriginal` or `mtime`.
3. Copy original → `/YYYY/MM/` under `exportRoot` with duplicate suffixing.
4. Generate thumbnails in `exportRoot/thumbs/…` using `sharp`.
5. Insert DB row into `exportRoot/.meta/gallery.db` (SQLite via better-sqlite3).
6. Build copies `dist/` → `exportRoot/site/` and writes `data.json`, `sitemap.xml`, `robots.txt`.
7. Export creates `gallery.zip` from `exportRoot/` using `archiver`.

### Database Schema (images)
```
images(
  hash TEXT PRIMARY KEY,
  sourcePath TEXT NOT NULL,
  captureDate TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  destPath TEXT NOT NULL,        -- POSIX: YYYY/MM/name.ext
  thumbWidth INTEGER,
  thumbHeight INTEGER
)
```

## Metrics (suggested)
- ingest.count, ingest.duration_ms
- copy.duplicates_renamed
- thumbs.generated, thumbs.skipped
- build.duration_ms, pages.pagination
- export.ok, export.bytes

## Example Requests

- Ingest
```http
POST /api/ingest
Content-Type: application/json
{
  "source": "D:/Photos/2024",
  "exportRoot": "D:/Output/Gallery"
}
```

- Build
```http
POST /api/build
Content-Type: application/json
{
  "exportRoot": "D:/Output/Gallery",
  "paginate": 200
}
```

- Export
```http
POST /api/export
Content-Type: application/json
{
  "exportRoot": "D:/Output/Gallery",
  "zip": "D:/Deliverables/gallery.zip"
}
```