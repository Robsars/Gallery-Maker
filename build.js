const path = require('path');
const fs = require('fs-extra');
const { getDb } = require('./database');

const webBuildPath = path.resolve(__dirname, '../../web/dist');

/**
 * Generates the static HTML, CSS, JS, and data files for the gallery.
 * @param {string} exportRoot - The root directory of the exported content.
 * @param {number} paginate - Number of items per page.
 */
async function buildSite(exportRoot, paginate) {
  console.log('Building static site...');

  const sitePath = path.join(exportRoot, 'site');
  const db = getDb(exportRoot);

  // 1. Clear previous site build and copy new React app assets
  console.log('Copying React build assets...');
  await fs.emptyDir(sitePath);
  if (!(await fs.pathExists(webBuildPath))) {
    throw new Error(`React build not found at ${webBuildPath}. Please run 'npm run build:web' first.`);
  }
  await fs.copy(webBuildPath, sitePath);

  // 2. Generate data.json from the database
  console.log('Generating data.json...');
  const images = db.prepare('SELECT * FROM images ORDER BY captureDate DESC').all();
  const data = {
    images: images.map(img => ({
      ...img,
      // Relative paths for the client
      src: path.join('..', img.destPath),
      thumbSrc: path.join('..', 'thumbs', img.destPath).replace(/\.\w+$/, '.webp'),
      thumbSrc_fallback: path.join('..', 'thumbs', img.destPath).replace(/\.\w+$/, '.jpeg'),
    })),
    settings: {
      paginate,
    },
  };
  await fs.writeJson(path.join(sitePath, 'data.json'), data);

  // 3. Generate sitemap.xml
  console.log('Generating sitemap.xml...');
  await generateSitemap(exportRoot, data.images, paginate);

  // 4. Generate robots.txt
  console.log('Generating robots.txt...');
  await generateRobotsTxt(exportRoot);

  console.log('Static site build finished successfully.');
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
  images.forEach(img => {
    months.add(`${img.year}/${String(img.month).padStart(2, '0')}`);
  });

  for (const month of months) {
    const monthImages = images.filter(img => `${img.year}/${String(img.month).padStart(2, '0')}` === month);
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

module.exports = { buildSite };