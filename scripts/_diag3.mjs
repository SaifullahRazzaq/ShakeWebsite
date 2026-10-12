import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:3111', { waitUntil: 'load' });
await page.waitForTimeout(4000);
console.log('KHR_parallel_shader_compile:', await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  return !!gl.getExtension('KHR_parallel_shader_compile');
}));

await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1500);
const client = await page.context().newCDPSession(page);
await client.send('Profiler.enable');
await client.send('Profiler.start');
const t0 = Date.now();
while (Date.now() - t0 < 7000) { await page.mouse.wheel(0, 200); await page.waitForTimeout(35); }
const { profile } = await client.send('Profiler.stop');

const self = new Map();
const byId = new Map(profile.nodes.map(n => [n.id, n]));
const total = profile.timeDeltas.reduce((a,b)=>a+b,0);
profile.samples.forEach((id, i) => {
  const n = byId.get(id); if (!n) return;
  const f = n.callFrame;
  const key = `${f.functionName || '(anon)'} ${f.url.split('/').pop()}:${f.lineNumber}`;
  self.set(key, (self.get(key) || 0) + (profile.timeDeltas[i] || 0));
});
console.log('total profiled ms:', Math.round(total/1000));
[...self.entries()].sort((a,b)=>b[1]-a[1]).slice(0,14)
  .forEach(([k,v]) => console.log(String(Math.round(v/1000)).padStart(6), 'ms ', k));
await browser.close();
