import { chromium } from 'playwright';
const OUT = '/private/tmp/claude-501/-Users-waleedjawaid-Desktop-Webistes-Shake/d8260254-206b-49e1-a5f8-ba2d7f0b3056/scratchpad/shots';
const marks = process.argv[2] ? process.argv[2].split(',').map(Number) : [0, 0.2, 0.38, 0.48, 0.62, 0.84, 0.97];
const tag = process.argv[3] ?? 'hero';
const w = Number(process.argv[4] ?? 1440), h = Number(process.argv[5] ?? 900);

const browser = await chromium.launch({
  args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-webgl']
});
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const errs = [];
page.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const info = await page.evaluate(() => {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  return { gl: !!gl, ver: gl && gl.getParameter(gl.VERSION), docH: document.body.scrollHeight };
});
console.log('WEBGL:', JSON.stringify(info));

for (const m of marks) {
  await page.evaluate((mm) => {
    const max = document.body.scrollHeight - window.innerHeight;
    window.scrollTo(0, max * mm);
  }, m);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/${tag}-${String(m).replace('.','_')}.png`, timeout: 180000, animations: 'disabled' });
}
console.log('ERRORS:', errs.slice(0,8).join(' | ') || 'none');
await browser.close();
