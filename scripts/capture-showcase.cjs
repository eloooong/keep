// Capture only the local demo account. No keys are revealed or copied.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const output = path.resolve('public/showcase/assets');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 850 }, deviceScaleFactor: 1 });
    await page.addInitScript(() => localStorage.setItem('theme', 'light'));
    await page.goto(process.env.SHOWCASE_BASE_URL || 'http://localhost:3000');
    await page.getByText('demo@keep.app', { exact: true }).waitFor();
    await page.getByText('OpenAI Production', { exact: true }).waitFor();
    const style = 'nextjs-portal { display: none !important; }';
    await page.addStyleTag({ content: style });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(output, 'vault.png') });
    await page.getByPlaceholder('Search by name, notes, category, or tag...').fill('production');
    await page.waitForTimeout(650);
    await page.screenshot({ path: path.join(output, 'search.png') });
    await page.getByPlaceholder('Search by name, notes, category, or tag...').fill('');
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Share', exact: true }).nth(1).click();
    await page.getByText('teammate@keep.app', { exact: true }).waitFor();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(output, 'sharing.png') });
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await page.waitForTimeout(650);
    await page.screenshot({ path: path.join(output, 'dark.png') });
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await page.getByRole('link', { name: 'Activity', exact: true }).click();
    await page.getByText('Activity log', { exact: true }).waitFor();
    await page.addStyleTag({ content: style });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(output, 'activity.png') });
    console.log('Saved five demo-only website captures to', output);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
