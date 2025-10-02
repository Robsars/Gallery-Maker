**`agents.md`**
```md
# Agents & Task Graph

This document defines autonomous agents for building and operating the Photo Gallery Auto-Organizer. Each agent has a clear contract: inputs, outputs, and success criteria.

## Agents
- **Agent A — Ingestion & Discovery**: Enumerates files (≤200k) from a directory or ZIP.  
- **Agent B — Date Resolver**: Reads EXIF DateTimeOriginal or falls back to modified time.  
- **Agent C — Organizer / Copier**: Copies into `/YYYY/MM/`; resolves duplicates by suffix.  
- **Agent D — Thumbnailer**: Generates 200px longest-side thumbnails (WebP + JPEG fallback).  
- **Agent E — Gallery Generator**: Builds homepage + month pages with gradient cards and pagination (200/page).  
- **Agent F — Lightbox & UX**: Provides fit-to-screen preview, next/prev, keyboard arrows, and swipe navigation.  
- **Agent G — SEO & Export**: Generates sitemap.xml, robots.txt, meta tags; packages static export.  
- **Agent H — Orchestrator**: Coordinates pipeline A→G, manages retries and checkpoints.  

## Metrics
- ingest.count, ingest.duration  
- copy.duplicates_renamed  
- thumbs.generated, thumbs.throughput  
- pages.render_time, pages.pagination  
- export.ok, export.files