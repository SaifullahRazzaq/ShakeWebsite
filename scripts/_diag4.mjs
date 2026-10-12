import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:3111', { waitUntil: 'load' });

// let the governor settle on the hero
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(2000);
  const s = await page.evaluate(() => [...document.querySelectorAll('canvas')]
    .map(c => `${c.width}x${c.height}`).filter(x => x !== '300x150'));
  console.log(`t+${(i+1)*2}s  hero canvases:`, s.join('  '));
}

const fps = async (label) => {
  await page.evaluate(() => { window.__f = []; const t = x => { window.__f.push(x); requestAnimationFrame(t); }; requestAnimationFrame(t); });
  await page.waitForTimeout(2500);
  const f = await page.evaluate(() => window.__f);
  const d = []; for (let i=1;i<f.length;i++) d.push(f[i]-f[i-1]);
  console.log(label.padEnd(28), (1000 / (d.reduce((a,b)=>a+b,0)/d.length)).toFixed(1), 'fps');
};
await fps('hero, both layers');
await page.evaluate(() => { document.querySelectorAll('canvas')[1].style.visibility = 'hidden'; });
await fps('hero, front layer hidden');
await browser.close();
