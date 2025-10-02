const path = require('path');
const fs = require('fs-extra');
const klaw = require('klaw');
const crypto = require('crypto');
const sharp = require('sharp');
const { ExifTool } = require('exiftool-vendored');
const { getDb } = require('./database');

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.cr2', '.nef'];
const exiftool = new ExifTool();

/**
 * Ingests a source directory, processes all images, and organizes them.
 * @param {string} sourcePath - The path to the source directory or ZIP file.
 * @param {string} exportRoot - The root directory for the exported content.
 */
async function ingest(sourcePath, exportRoot) {
  const db = getDb(exportRoot);
  const insertStmt = db.prepare(
    'INSERT OR REPLACE INTO images (hash, sourcePath, captureDate, year, month, destPath) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const findByHashStmt = db.prepare('SELECT hash FROM images WHERE hash = ?');

  const imagePaths = [];
  for await (const file of klaw(sourcePath)) {
    if (SUPPORTED_EXTENSIONS.includes(path.extname(file.path).toLowerCase())) {
      imagePaths.push(file.path);
    }
  }

  console.log(`Found ${imagePaths.length} potential image files.`);

  for (const imagePath of imagePaths) {
    try {
      const fileBuffer = await fs.readFile(imagePath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Idempotency check: skip if hash already exists in DB
      if (findByHashStmt.get(hash)) {
        console.log(`Skipping (already processed): ${path.basename(imagePath)}`);
        continue;
      }

      console.log(`Processing: ${path.basename(imagePath)}`);

      // 1. Resolve Date
      const captureDate = await resolveDate(imagePath);
      const year = captureDate.getFullYear();
      const month = captureDate.getMonth() + 1;

      // 2. Determine Destination Path & Copy
      const destPath = await copyOriginal(fileBuffer, imagePath, year, month, exportRoot);

      // 3. Generate Thumbnail
      await generateThumbnail(fileBuffer, destPath, exportRoot);

      // 4. Save to Database
      insertStmt.run(hash, imagePath, captureDate.toISOString(), year, month, destPath);

    } catch (error) {
      console.error(`Failed to process ${path.basename(imagePath)}:`, error.message);
    }
  }

  await exiftool.end();
  console.log('Finished processing all files.');
}

/**
 * Resolves the capture date of an image, prioritizing EXIF over file modification time.
 * @param {string} imagePath - Path to the image file.
 * @returns {Promise<Date>} The resolved capture date.
 */
async function resolveDate(imagePath) {
  try {
    const tags = await exiftool.read(imagePath);
    // DateTimeOriginal is the most reliable EXIF tag for capture time.
    if (tags.DateTimeOriginal && tags.DateTimeOriginal.toMillis) {
      return new Date(tags.DateTimeOriginal.toMillis());
    }
  } catch (e) {
    // exiftool might fail on some files, fall back to mtime
  }
  
  // Fallback to file modification time
  const stats = await fs.stat(imagePath);
  return stats.mtime;
}

/**
 * Copies the original file to the correct /YYYY/MM/ directory, handling duplicates.
 * @param {Buffer} fileBuffer - The buffer of the original file.
 * @param {string} sourcePath - The original path of the file.
  * @param {number} year - The resolved year.
 * @param {number} month - The resolved month.
 * @param {string} exportRoot - The root directory for the export.
 * @returns {Promise<string>} The final destination path relative to the export root.
 */
async function copyOriginal(fileBuffer, sourcePath, year, month, exportRoot) {
  const monthDir = path.join(exportRoot, String(year), String(month).padStart(2, '0'));
  await fs.ensureDir(monthDir);

  const originalFileName = path.basename(sourcePath);
  const ext = path.extname(originalFileName);
  const baseName = path.basename(originalFileName, ext);

  let destPath = path.join(String(year), String(month).padStart(2, '0'), originalFileName);
  let finalDestPath = path.join(exportRoot, destPath);
  let counter = 1;

  // Handle duplicates by appending -1, -2, etc.
  while (await fs.pathExists(finalDestPath)) {
    const newName = `${baseName}-${counter}${ext}`;
    destPath = path.join(String(year), String(month).padStart(2, '0'), newName);
    finalDestPath = path.join(exportRoot, destPath);
    counter++;
  }

  await fs.writeFile(finalDestPath, fileBuffer);
  return destPath;
}

/**
 * Generates a 200px thumbnail in both WebP and JPEG formats.
 * @param {Buffer} fileBuffer - The buffer of the original file.
 * @param {string} destPath - The destination path of the original file, relative to exportRoot.
 * @param {string} exportRoot - The root directory for the export.
 */
async function generateThumbnail(fileBuffer, destPath, exportRoot) {
  const thumbDir = path.join(exportRoot, 'thumbs', path.dirname(destPath));
  await fs.ensureDir(thumbDir);

  const baseName = path.basename(destPath, path.extname(destPath));
  const thumbPathWebP = path.join(thumbDir, `${baseName}.webp`);
  const thumbPathJpeg = path.join(thumbDir, `${baseName}.jpeg`);

  const image = sharp(fileBuffer, { failOn: 'none' });
  const metadata = await image.metadata();

  // Skip if thumbnail already exists
  if (await fs.pathExists(thumbPathWebP)) {
    return;
  }

  const resizeOptions = {
    width: 200,
    height: 200,
    fit: 'inside',
    withoutEnlargement: true,
  };

  // Generate WebP thumbnail
  await image
    .clone()
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(resizeOptions)
    .webp({ quality: 80 })
    .toFile(thumbPathWebP);

  // Generate JPEG fallback thumbnail
  await image
    .clone()
    .rotate()
    .resize(resizeOptions)
    .jpeg({ quality: 80 })
    .toFile(thumbPathJpeg);

  // Update DB with thumbnail dimensions
  const thumbMeta = await sharp(thumbPathWebP).metadata();
  const db = getDb(exportRoot);
  db.prepare('UPDATE images SET thumbWidth = ?, thumbHeight = ? WHERE destPath = ?')
    .run(thumbMeta.width, thumbMeta.height, destPath);
}

module.exports = { ingest };