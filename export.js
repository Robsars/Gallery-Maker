import { createWriteStream } from 'node:fs';
import archiver from 'archiver';

const defaultLoggers = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

/**
 * Packages the entire export directory into a single ZIP file.
 * @param {string} exportRoot - The directory to zip.
 * @param {string} zipPath - The path for the output ZIP file.
 * @param {{log?: Function, warn?: Function, error?: Function}} logger - Optional logger functions.
 */
export function exportZip(exportRoot, zipPath, logger = {}) {
  const { log, error } = { ...defaultLoggers, ...logger };

  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    log(`Creating archive at ${zipPath}`);

    output.on('close', () => {
      log(`${archive.pointer()} total bytes written`);
      log('Archive finalized successfully.');
      resolve();
    });

    archive.on('warning', (warnErr) => {
      if (warnErr.code === 'ENOENT') {
        log(warnErr.message);
      } else {
        error(warnErr.message);
      }
    });

    archive.on('error', (err) => {
      error(err.message);
      reject(err);
    });

    archive.pipe(output);
    archive.directory(exportRoot, false);
    archive.finalize();
  });
}