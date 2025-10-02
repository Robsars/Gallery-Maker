const path = require('path');
const fs = require('fs-extra');
const Database = require('better-sqlite3');

let db;

/**
 * Initializes and returns the SQLite database instance for a given export root.
 * @param {string} exportRoot - The root directory for the export.
 * @returns {Database.Database} The database instance.
 */
function getDb(exportRoot) {
  if (db) {
    return db;
  }

  const dbDir = path.join(exportRoot, '.meta');
  fs.ensureDirSync(dbDir);
  const dbPath = path.join(dbDir, 'gallery.db');
  
  db = new Database(dbPath);

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

  return db;
}

module.exports = { getDb };