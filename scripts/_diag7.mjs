import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.addInitScript(() => {
  const real = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (String(t).startsWith('webgl')) this.__gl = true; return real.call(this, t, ...a); };
});
await page.goto('http://localhost:3111', { waitUntil: 'load' });
await page.waitForTimeout(9000);
// take the shader out of the picture entirely so we are measuring only the DOM
await page.evaluate(() => document.querySelectorAll('canvas').forEach(c => { if (c.__gl) c.style.display = 'none'; }));

await page.evaluate(() => { window.__f = []; const t = x => { window.__f.push(x); requestAnimationFrame(t); }; requestAnimationFrame(t); });
const fps = async (label) => {
  await page.evaluate(() => { window.__f = []; });
  await page.waitForTimeout(2200);
  const v = await page.evaluate(() => { const f = window.__f, d = []; for (let i=1;i<f.length;i++) d.push(f[i]-f[i-1]);
    return (1000 / (d.reduce((a,b)=>a+b,0)/d.length)).toFixed(1); });
  console.log(label.padEnd(40), String(v).padStart(5), 'fps');
};
await fps('DOM only (canvases off)');

const kill = async (label, fn) => { await page.evaluate(fn); await fps('  after: ' + label); };
await kill('film grain off',        () => { const g=[...document.querySelectorAll('div')].find(d=>d.style.mixBlendMode==='overlay'&&d.style.zIndex==='9998'); if(g) g.style.display='none'; });
await kill('FruitField blur/shadow off', () => document.querySelectorAll('[data-fruit], svg').forEach(e => { if (e.style.filter && e.style.filter !== 'none') e.style.filter = 'none'; }));
await kill('all element filters off',    () => document.querySelectorAll('*').forEach(e => { if (e.style && e.style.filter) e.style.filter = 'none'; }));
await kill('all mix-blend-mode off',     () => document.querySelectorAll('*').forEach(e => { if (e.style && e.style.mixBlendMode && e.style.mixBlendMode !== 'normal') e.style.mixBlendMode = 'normal'; }));
await kill('nav backdrop-filter off',    () => document.querySelectorAll('*').forEach(e => { if (e.style && e.style.backdropFilter) e.style.backdropFilter = 'none'; }));
await browser.close();
