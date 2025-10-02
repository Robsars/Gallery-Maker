const fs = require('fs');
const archiver = require('archiver');

/**
 * Packages the entire export directory into a single ZIP file.
 * @param {string} exportRoot - The directory to zip.
 * @param {string} zipPath - The path for the output ZIP file.
 */
function exportZip(exportRoot, zipPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    output.on('close', () => {
      console.log(archive.pointer() + ' total bytes');
      console.log('Archiver has been finalized and the output file descriptor has closed.');
      resolve();
    });

    archive.on('error', err => reject(err));
    archive.pipe(output);
    archive.directory(exportRoot, false);
    archive.finalize();
  });
}

module.exports = { exportZip };