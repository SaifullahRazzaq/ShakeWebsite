import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:3111', { waitUntil: 'load' });
await page.waitForTimeout(9000);   // let the governor settle

await page.evaluate(() => {
  window.__f = []; const t = x => { window.__f.push(x); requestAnimationFrame(t); }; requestAnimationFrame(t);
});
const fps = async (label) => {
  await page.evaluate(() => { window.__f = []; });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const f = window.__f, d = [];
    for (let i = 1; i < f.length; i++) d.push(f[i] - f[i - 1]);
    const sizes = [...document.querySelectorAll('canvas')].map(c => `${c.width}x${c.height}`).filter(s => s !== '300x150');
    return { fps: (1000 / (d.reduce((a, b) => a + b, 0) / d.length)).toFixed(1), sizes };
  });
  console.log(label.padEnd(34), r.fps.padStart(5), 'fps  ', r.sizes.join(' '));
};

await fps('settled, as shipped');
// force the backing stores tiny: if fill is the cost, this flies; if not, it is overhead
await page.evaluate(() => {
  window.__shrink = setInterval(() => {
    [...document.querySelectorAll('canvas')].forEach(c => {
      if (c.width > 64) { c.width = 64; c.height = 40; const g = c.getContext('webgl2') || c.getContext('webgl'); g && g.viewport(0,0,64,40); }
    });
  }, 100);
});
await fps('backing stores forced to 64x40');
await browser.close();
