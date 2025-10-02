import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import { getDb } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const webBuildPath = path.join(__dirname, 'dist');
const defaultLoggers = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

const toPosix = (value) => value.replace(/\\/g, '/');

/**
 * Generates the static HTML, CSS, JS, and data files for the gallery.
 * @param {string} exportRoot - The root directory of the exported content.
 * @param {number} paginate - Number of items per page.
 * @param {{log?: Function, warn?: Function, error?: Function}} logger - Optional logger functions.
 */
export async function buildSite(exportRoot, paginate, logger = {}) {
  const { log, error } = { ...defaultLoggers, ...logger };
  log('Building static site...');

  const sitePath = path.join(exportRoot, 'site');
  const db = getDb(exportRoot);

  // 1. Clear previous site build and copy new React app assets
  log('Copying React build assets...');
  await fs.emptyDir(sitePath);
  if (!(await fs.pathExists(webBuildPath))) {
    const message = `React build not found at ${webBuildPath}. Please run 'npm run build:web' first.`;
    error(message);
    throw new Error(message);
  }
  await fs.copy(webBuildPath, sitePath);

  // 2. Generate data.json from the database
  log('Generating data.json...');
  const images = db.prepare('SELECT * FROM images ORDER BY captureDate DESC').all();
  const data = {
    images: images.map((img) => {
      const destPathPosix = toPosix(img.destPath);
      const originalSrc = `../${destPathPosix}`;
      const thumbBase = `../thumbs/${destPathPosix}`;

      return {
        ...img,
        destPath: destPathPosix,
        // Relative paths for the client
        src: originalSrc,
        thumbSrc: thumbBase.replace(/\.\w+$/, '.webp'),
        thumbSrc_fallback: thumbBase.replace(/\.\w+$/, '.jpeg'),
      };
    }),
    settings: {
      paginate,
    },
  };
  await fs.writeJson(path.join(sitePath, 'data.json'), data, { spaces: 2 });

  // 3. Generate sitemap.xml
  log('Generating sitemap.xml...');
  await generateSitemap(exportRoot, data.images, paginate);

  // 4. Generate robots.txt
  log('Generating robots.txt...');
  await generateRobotsTxt(exportRoot);

  log('Static site build finished successfully.');
}

/**
 * Generates a sitemap.xml file.
 * @param {string} exportRoot - The root directory of the exported content.
 * @param {Array} images - Array of image data objects.
 * @param {number} paginate - Number of items per page.
 */
async function generateSitemap(exportRoot, images, paginate) {
  const siteUrl = 'https://example.com'; // Placeholder: User should replace this
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Home page
  xml += `  <url><loc>${siteUrl}/</loc></url>\n`;

  // Month pages
  const months = new Set();
  images.forEach((img) => {
    months.add(`${img.year}/${String(img.month).padStart(2, '0')}`);
  });

  for (const month of months) {
    const monthImages = images.filter((img) => `${img.year}/${String(img.month).padStart(2, '0')}` === month);
    const pageCount = Math.ceil(monthImages.length / paginate);

    // First page of the month
    xml += `  <url><loc>${siteUrl}/months/${month}</loc></url>\n`;

    // Subsequent pages
    for (let i = 2; i <= pageCount; i++) {
      xml += `  <url><loc>${siteUrl}/months/${month}/page/${i}</loc></url>\n`;
    }
  }

  xml += '</urlset>';

  await fs.writeFile(path.join(exportRoot, 'site', 'sitemap.xml'), xml);
}

/**
 * Generates a robots.txt file.
 * @param {string} exportRoot - The root directory of the exported content.
 */
async function generateRobotsTxt(exportRoot) {
  const siteUrl = 'https://example.com'; // Placeholder
  const content = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;
  await fs.writeFile(path.join(exportRoot, 'site', 'robots.txt'), content);
}