# Photo Gallery Auto-Organizer & Static Gallery Generator

This project is a complete solution for photographers to automatically organize their photos by date and generate a beautiful, fast, and portable static web gallery.

It consists of:

- A **Node.js Backend & CLI** for ingesting files, processing metadata, generating thumbnails, and exporting the final site.
- A **React Frontend** that provides the user interface for viewing the generated static gallery.

## Features

- **Automated Organization**: Ingests local directories or ZIP files and sorts images into `/YYYY/MM/` folders based on EXIF date.
- **Broad Format Support**: Handles JPEG, PNG, WEBP, and even complex formats like HEIC and RAW (`.CR2`, `.NEF`) via `exiftool` and `sharp`.
- **Idempotent Processing**: Re-running an ingest only processes new or changed files, making updates fast and efficient.
- **High-Quality Thumbnails**: Generates 200px WebP thumbnails (with JPEG fallbacks) for fast gallery loading.
- **Modern Gallery UI**: A fully responsive gallery built with React and TailwindCSS, featuring a lightbox with keyboard and swipe navigation.
- **Static Export**: Bundles the entire gallery (original images, thumbnails, HTML, CSS, JS) into a single folder or ZIP file, ready for deployment on any static host (Netlify, Vercel, GitHub Pages, etc.).

## Tech Stack

- **Monorepo**: npm Workspaces
- **Backend & CLI**: Node.js, Express, Commander.js
- **Image Processing**: `sharp`, `exiftool-vendored`
- **Database**: `better-sqlite3` for metadata storage and idempotency.
- **Frontend**: React, Vite, TailwindCSS

## Getting Started

### Prerequisites

- Node.js v18+
- npm v8+
- `exiftool` must be installed on your system. The `exiftool-vendored` library relies on it.
  - **macOS**: `brew install exiftool`
  - **Windows**: Download from the ExifTool website and ensure it's in your system's PATH.
  - **Linux**: `sudo apt-get install libimage-exiftool-perl`

### Installation

Clone the repository and run the installation script which installs root dependencies and dependencies for both the `server` and `web` workspaces.

```bash
git clone <your-repo-url>
cd gallery-maker-monorepo
npm run install-all
```

### Usage (CLI)

The core functionality is exposed via a CLI. All paths should be absolute or relative to the project root.

1.  **Ingest & Process Files**:
    This command finds images, reads their metadata, copies them to the export directory, and generates thumbnails.

    ```bash
    node cli.js ingest --source /path/to/your/photos --export-root ./export
    ```

2.  **Build the Static Site**:
    This command uses the processed data to generate the `index.html`, month pages, and other site assets.

    ```bash
    node cli.js build-site --export-root ./export --paginate 200
    ```

3.  **Export as a ZIP file (Optional)**:
    This command packages the entire contents of the `--export-root` directory into a single zip file.
    ```bash
    node cli.js export --export-root ./export --zip gallery.zip
    ```
