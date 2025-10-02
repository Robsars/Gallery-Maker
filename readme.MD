# Photo Gallery Auto-Organizer & Static Gallery Generator

A complete workflow for photographers to organize images by capture date, generate a polished static gallery, and deliver a portable export. The project now ships with a **modern control-center UI** so you can run the full pipeline without touching the CLI.

## Features

- **Visual Pipeline Orchestration** – Launch ingestion, gallery builds, and exports from a three-step dashboard with live task feedback.
- **Automated Organization** – Resolve EXIF capture dates, copy originals into `/YYYY/MM/`, and handle duplicates automatically.
- **High-Speed Thumbnails** – Generate 200px WebP thumbnails (with JPEG fallbacks) while preserving orientation.
- **Static Gallery Builder** – Produce a responsive gallery with pagination, lightbox UX, sitemap, and robots directives.
- **Portable Exports** – Bundle the complete output into a ZIP ready for hand-off or static hosting.

## Tech Stack

- **Backend & Pipeline**: Node.js, Express, Commander.js
- **Image Processing**: `sharp`, `exiftool-vendored`
- **Database**: `better-sqlite3`
- **Frontend**: React + TailwindCSS (Vite)
- **Task Streaming**: Server-Sent Events for real-time logs

## Getting Started

### Prerequisites

- Node.js v18+
- npm v8+
- `exiftool` installed and available on your system `PATH`  
  - **macOS**: `brew install exiftool`  
  - **Windows**: Download from the ExifTool site and add to `PATH`  
  - **Linux**: `sudo apt-get install libimage-exiftool-perl`

### Installation

```bash
git clone <your-repo-url>
cd Gallery-Maker
npm install
```

### Local Development

Run the dashboard and API together:

```bash
npm run dev
```

- UI: http://localhost:5173 – queue tasks, watch logs, and preview the gallery
- API: http://localhost:3001 – serves pipeline endpoints and static previews

### Pipeline Workflow (UI)

1. **Ingest & Organize** – Point at a source directory and export root, then launch ingestion.
2. **Build Static Gallery** – Use the same export root to generate the static site. The preview iframe refreshes automatically when the build finishes.
3. **Export Archive** – Package everything into a shareable ZIP.

The activity feed streams live logs from every stage, and the history panel records the last run of each task.

### CLI (Optional)

Prefer scripts? The CLI remains available:

```bash
node cli.js ingest --source /path/to/photos --export-root ./export
node cli.js build-site --export-root ./export --paginate 200
node cli.js export --export-root ./export --zip gallery.zip
```

## Production Build

```bash
npm run build:web
```

The Node server (`npm start`) serves the built dashboard (`dist/`) and continues to expose the pipeline API and preview assets.

## Preview

After a successful build, the static gallery is accessible via the dashboard preview and directly at `http://localhost:3001/preview/`.

## License

MIT