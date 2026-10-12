import { chromium } from 'playwright';
const PORT = process.argv[2] ?? '3111';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: Number(process.argv[3] ?? 1) });
await page.goto(`http://localhost:${PORT}`, { waitUntil: 'load' });
await page.waitForTimeout(4000);

const renderer = await page.evaluate(() => {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  const d = gl && gl.getExtension('WEBGL_debug_renderer_info');
  return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown';
});
console.log('GPU:', renderer);

await page.evaluate(() => {
  window.__f = [];
  const tick = t => { window.__f.push(t); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});

const stats = arr => {
  const d = [];
  for (let i = 1; i < arr.length; i++) d.push(arr[i] - arr[i - 1]);
  d.sort((a, b) => a - b);
  const p = q => d[Math.min(d.length - 1, Math.floor(d.length * q))];
  const mean = d.reduce((a, b) => a + b, 0) / d.length;
  const jank = d.filter(x => x > 33).length;
  return { fps: (1000 / mean).toFixed(1), medMs: p(0.5)?.toFixed(1), p95Ms: p(0.95)?.toFixed(1), worstMs: d[d.length-1]?.toFixed(0), janky: `${jank}/${d.length}` };
};

const marks = [0, 0.06, 0.2, 0.4, 0.6, 0.8, 0.95];
for (const m of marks) {
  await page.evaluate(mm => { window.scrollTo(0, (document.body.scrollHeight - innerHeight) * mm); }, m);
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__f = []; });
  // scroll continuously with the wheel for 2.5s, the way a user would
  const t0 = Date.now();
  while (Date.now() - t0 < 2500) { await page.mouse.wheel(0, 120); await page.waitForTimeout(40); }
  const f = await page.evaluate(() => window.__f);
  console.log(`scroll ${String(m).padEnd(5)}`, JSON.stringify(stats(f)));
}
await browser.close();
