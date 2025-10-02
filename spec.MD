# Technical Spec — Photo Gallery Auto-Organizer

## Architecture
Hosted web app with server-side processing (ingestion, EXIF, thumbnails) and static-site generation. Static export produces `/YYYY/MM/` originals, mirrored `/thumbs/`, and `/site/` HTML/CSS/JS.

## Data Model
Each image record includes:
- hash, ext, sourcePath
- exifDate, modified time
- resolved captureDate (ISO)
- year, month
- destPath
- thumbnail metadata (width, height, path)

## Processing Rules
- **Date priority:** EXIF DateTimeOriginal → file modified time  
- **Copying:** duplicates get `-1`, `-2`, etc.  
- **Idempotent:** skip already processed files by hash/size  
- **Thumbnails:** 200px on longest side; WebP q≈80 + JPEG fallback; orientation preserved  
- **Cards:** +50px width & height, drop shadow, random gradient per render  
- **Pagination:** 200 items/page  
- **Lightbox:** fit-to-screen; click again = full-size original; next/prev, keyboard arrows, swipe on mobile  
- **SEO:** per-page titles, descriptions, OpenGraph tags, sitemap.xml, robots.txt  

## Export Layout
/export-root
/YYYY/MM/ # Originals
/thumbs/YYYY/MM/ # Thumbnails
/site/
index.html # Homepage
/months/YYYY/MM/
index.html # Month page
page-2.html ...
/assets/css/
/assets/js/
sitemap.xml
robots.txt

python
Copy code

## CLI
```bash
app ingest --source <dir|zip> --export-root <dir>
app build-site --export-root <dir>
app export --export-root <dir> --zip out.zip
Performance Targets
Ingest ≥50 img/sec JPEG/PNG/WEBP; ≥10 img/sec RAW/HEIC

Month page LCP <2.5s on 3G Fast with 200 thumbs

JS payload <120KB gzipped

Accessibility
WCAG 2.2 AA controls; keyboard nav; aria-labels; focus outlines