import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3111', { waitUntil: 'load' });
await page.waitForTimeout(4000);

await page.evaluate(() => {
  window.__f = [];
  const tick = t => { window.__f.push(t); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
const measure = async (label) => {
  await page.evaluate(() => { window.__f = []; });
  await page.waitForTimeout(3000);
  const f = await page.evaluate(() => window.__f);
  const d = []; for (let i=1;i<f.length;i++) d.push(f[i]-f[i-1]);
  const mean = d.reduce((a,b)=>a+b,0)/d.length;
  console.log(label.padEnd(34), 'fps', (1000/mean).toFixed(1), ' frames', d.length);
};
await measure('baseline (top of page)');
await page.evaluate(() => { document.querySelectorAll('svg').forEach(s=>{ if(s.querySelector('feTurbulence')) s.style.display='none'; }); });
await measure('- film grain');
await page.evaluate(() => { window.__cv=[...document.querySelectorAll('canvas')]; window.__cv.forEach(c=>c.style.display='none'); });
await measure('- grain - canvases hidden');
const live = await page.evaluate(() => document.querySelectorAll('canvas').length);
console.log('canvases in DOM:', live);
await browser.close();
