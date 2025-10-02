#!/usr/bin/env node

import { Command } from 'commander';
import path from 'node:path';
import process from 'node:process';
import { ingest } from './ingest.js';
import { buildSite } from './build.js';
import { exportZip } from './export.js';

const program = new Command();

program
  .name('gallery-cli')
  .description('CLI for Photo Gallery Auto-Organizer');

program
  .command('ingest')
  .description('Ingest, process, and organize image files from a source directory or ZIP file.')
  .requiredOption('--source <path>', 'Source directory or ZIP file')
  .requiredOption('--export-root <dir>', 'Root directory for the exported static site')
  .action(async (options) => {
    const sourcePath = path.resolve(options.source);
    const exportRoot = path.resolve(options.exportRoot);
    console.log(`Starting ingestion from: ${sourcePath}`);
    await ingest(sourcePath, exportRoot);
    console.log('Ingestion complete.');
  });

program
  .command('build-site')
  .description('Build the static HTML/CSS/JS gallery site from processed data.')
  .requiredOption('--export-root <dir>', 'Root directory where data was processed')
  .option('--paginate <number>', 'Number of items per page', '200')
  .action(async (options) => {
    const exportRoot = path.resolve(options.exportRoot);
    console.log(`Building site in: ${exportRoot}`);
    await buildSite(exportRoot, parseInt(options.paginate, 10));
    console.log('Site build complete.');
  });

program
  .command('export')
  .description('Package the entire exported site into a single ZIP file.')
  .requiredOption('--export-root <dir>', 'Root directory of the exported site')
  .requiredOption('--zip <file>', 'Output ZIP file path')
  .action(async (options) => {
    const exportRoot = path.resolve(options.exportRoot);
    const zipPath = path.resolve(options.zip);
    console.log(`Exporting ${exportRoot} to ${zipPath}`);
    await exportZip(exportRoot, zipPath);
    console.log('Export complete.');
  });

program.parseAsync(process.argv).catch((error) => {
  console.error(error);
  process.exit(1);
});