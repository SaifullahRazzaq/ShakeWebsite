import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

// count how many GL contexts the page itself creates, without creating any
await page.addInitScript(() => {
  window.__ctx = 0;
  const real = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    if (String(t).startsWith('webgl')) { window.__ctx++; this.__gl = true; }
    return real.call(this, t, ...a);
  };
});
await page.goto('http://localhost:3111', { waitUntil: 'load' });
await page.waitForTimeout(9000);

await page.evaluate(() => { window.__f = []; const t = x => { window.__f.push(x); requestAnimationFrame(t); }; requestAnimationFrame(t); });
const fps = async (label) => {
  await page.evaluate(() => { window.__f = []; });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const f = window.__f, d = [];
    for (let i = 1; i < f.length; i++) d.push(f[i] - f[i - 1]);
    return {
      fps: (1000 / (d.reduce((a, b) => a + b, 0) / d.length)).toFixed(1),
      live: [...document.querySelectorAll('canvas')].filter(c => c.__gl).length,
      sizes: [...document.querySelectorAll('canvas')].filter(c => c.__gl).map(c => `${c.width}x${c.height}`),
    };
  });
  console.log(label.padEnd(30), r.fps.padStart(5), 'fps   live contexts:', r.live, ' ', r.sizes.join(' '));
};

await fps('as shipped');
await page.evaluate(() => {
  window.__i = setInterval(() => [...document.querySelectorAll('canvas')].filter(c => c.__gl && c.width > 64)
    .forEach(c => { c.width = 64; c.height = 40; c.__gl.viewport?.(0,0,64,40); }), 80);
});
await fps('hero fill reduced to 64x40');
await page.evaluate(() => { clearInterval(window.__i); document.querySelectorAll('canvas').forEach(c => { if (c.__gl) c.style.display = 'none'; }); });
await fps('hero canvases removed');
await browser.close();
