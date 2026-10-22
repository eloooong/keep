// Usage: node scripts/render-showcase.cjs [--preview]
// Requires Playwright (or PLAYWRIGHT_MODULE pointing to an installed copy).
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const preview = process.argv.includes('--preview');
  const output = path.resolve('.motion-work', preview ? 'previews-v2' : 'frames-v2');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
    page.on('pageerror', error => { throw error; });
    await page.goto(`${process.env.SHOWCASE_BASE_URL || 'http://localhost:3000'}/showcase/index.html?capture`);
    await page.waitForFunction(() => window.keepFilm?.ready);
    const times = preview ? [1, 3.5, 6.8, 9.3, 11.8, 14.4, 17.2] : Array.from({ length: 1080 }, (_, i) => i / 60);
    for (let i = 0; i < times.length; i++) {
      const data = await page.evaluate(t => {
        window.keepFilm.render(t);
        return document.getElementById('film').toDataURL('image/png').split(',')[1];
      }, times[i]);
      fs.writeFileSync(path.join(output, `${String(i).padStart(5, '0')}.png`), Buffer.from(data, 'base64'));
      if (i % 120 === 0) console.log(`Rendered ${i + 1}/${times.length}`);
    }
    console.log(`Finished ${times.length} frames in ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
