import path from 'node:path';
import fs from 'fs-extra';
import Database from 'better-sqlite3';

const dbCache = new Map();

/**
 * Initializes and returns the SQLite database instance for a given export root.
 * @param {string} exportRoot - The root directory for the export.
 * @returns {Database.Database} The database instance.
 */
export function getDb(exportRoot) {
  if (dbCache.has(exportRoot)) {
    return dbCache.get(exportRoot);
  }

  const dbDir = path.join(exportRoot, '.meta');
  fs.ensureDirSync(dbDir);
  const dbPath = path.join(dbDir, 'gallery.db');

  const db = new Database(dbPath);

  // Create schema if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      hash TEXT PRIMARY KEY,
      sourcePath TEXT NOT NULL,
      captureDate TEXT NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      destPath TEXT NOT NULL,
      thumbWidth INTEGER,
      thumbHeight INTEGER
    )
  `);

  dbCache.set(exportRoot, db);
  return db;
}