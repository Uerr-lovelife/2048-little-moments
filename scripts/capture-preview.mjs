import { chromium, devices } from '@playwright/test';

const channel = process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined);
const browser = await chromium.launch({ channel, headless: true });
const errors = [];
const url = process.env.PREVIEW_URL ?? 'http://127.0.0.1:5173';
try {
  for (const [name, options] of [
    ['desktop', { viewport: { width: 1440, height: 1080 }, deviceScaleFactor: 1 }],
    ['laptop', { viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 }],
    ['mobile', { ...devices['Pixel 7'], deviceScaleFactor: 1 }],
  ]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.locator('.tile').first().waitFor();
    await page.evaluate(() => {
      localStorage.setItem('little-moments-2048-v1', JSON.stringify({
        version: 1,
        state: { board: [[2,4,8,0], [4,8,16,0], [2,16,32,0], [0,2,4,8]], score: 196, moves: 42, continued: false },
        best: 512,
      }));
    });
    await page.reload();
    await page.locator('.tile').first().waitFor();
    await page.screenshot({ path: `docs/images/${name}.png`, fullPage: true, animations: 'disabled' });
    console.log(`${name}: screenshot saved; ${await page.locator('.tile').count()} tiles`);
    await context.close();
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log('No browser runtime errors.');
} finally {
  await browser.close();
}
