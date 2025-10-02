**`PRD.md`**
```md
# Photo Gallery Auto-Organizer & Static Gallery Generator — PRD

## Executive Summary
Problem: photographers need quick date-based organization and beautiful galleries.  
Goal: hosted web app that ingests a directory, sorts into `/YYYY/MM/`, generates thumbnails & static galleries, and exports portable HTML/CSS/JS.  

## Scope
- Single user  
- Formats: JPEG, PNG, WEBP, HEIC, RAW (.CR2, .NEF)  
- No videos, no password protection, no custom domains in v1  
- Pagination = 200, responsive, SEO basic  

## Requirements (excerpt)
- Ingest with directory picker/ZIP  
- Date = EXIF DateTimeOriginal → modified time fallback  
- Copy to `/YYYY/MM/` with duplicate suffixes  
- Thumbnails 200px longest side; card = thumb+50/+50, drop shadow, random gradient per render  
- Homepage: year→month; Month page: thumbs, pagination=200  
- Lightbox: fit-to-screen preview → click again = full-size; next/prev, keyboard, swipe  
- Export static folder + sitemap + robots.txt  

## Risks
- Browser directory picker not universal → ZIP fallback  
- RAW/HEIC perf concerns → batch, streaming  
- Gradient randomness → possible confusion  

## Open Questions
- Timezone policy for EXIF vs modified time  
- Option to stabilize gradients by hash seed in future