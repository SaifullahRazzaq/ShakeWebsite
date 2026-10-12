import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// long-task observer: what is actually blocking the main thread
await page.addInitScript(() => {
  window.__long = [];
  new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push(Math.round(e.duration)))).observe({ entryTypes: ['longtask'] });
});
await page.goto('http://localhost:3111', { waitUntil: 'load' });
await page.waitForTimeout(5000);
console.log('long tasks during load (ms):', (await page.evaluate(() => window.__long)).filter(d => d > 60).join(', ') || 'none > 60ms');

const sizes = await page.evaluate(() => [...document.querySelectorAll('canvas')]
  .map(c => `${c.width}x${c.height}`).filter(s => s !== '1x1'));
console.log('backing store sizes (top of page):', sizes.join('  '));
console.log('devicePixelRatio:', await page.evaluate(() => devicePixelRatio));

await page.evaluate(() => { window.__long = []; });
const t0 = Date.now();
while (Date.now() - t0 < 6000) { await page.mouse.wheel(0, 200); await page.waitForTimeout(35); }
const long = await page.evaluate(() => window.__long);
console.log('long tasks while scrolling:', long.filter(d => d > 60).join(', ') || 'none > 60ms');
console.log('total blocked ms:', long.reduce((a, b) => a + b, 0));
await browser.close();
