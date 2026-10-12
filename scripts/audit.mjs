import { chromium } from 'playwright';
const OUT='/private/tmp/claude-501/-Users-waleedjawaid-Desktop-Webistes-Shake/d8260254-206b-49e1-a5f8-ba2d7f0b3056/scratchpad/shots';
const w=Number(process.argv[2]??1280), h=Number(process.argv[3]??800), tag=process.argv[4]??'full';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:w,height:h}});
const errs=[];
page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});
page.on('pageerror',e=>errs.push('PAGEERROR '+e.message.slice(0,200)));
await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
await page.waitForTimeout(3000);
const docH=await page.evaluate(()=>document.body.scrollHeight);
console.log('doc height px:',docH,'=',(docH/h).toFixed(1),'screens');
const ctxs=await page.evaluate(()=>document.querySelectorAll('canvas').length);console.log('canvases in DOM:',ctxs);
// horizontal overflow check
const ovf=await page.evaluate(()=>{
  const bad=[];
  document.querySelectorAll('body *').forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.width>0 && (r.right>window.innerWidth+2||r.left<-2)){
      const s=el.tagName+'.'+(el.className&&typeof el.className==='string'?el.className.split(' ')[0]:'');
      if(!bad.includes(s)&&bad.length<8) bad.push(s+` [${Math.round(r.left)},${Math.round(r.right)}]`);
    }});
  return {bad, scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth};
});
console.log('overflow:',JSON.stringify(ovf));
const marks=(process.env.MARKS??'0,0.12,0.25,0.38,0.5,0.62,0.75,0.88,1.0').split(',').map(Number);
for(const m of marks){
  await page.evaluate(mm=>window.scrollTo(0,(document.body.scrollHeight-window.innerHeight)*mm),m);
  await page.waitForTimeout(1200);
  await page.screenshot({path:`${OUT}/${tag}-${String(m).replace('.','_')}.png`,timeout:300000,animations:'disabled'});
}
console.log('ERRORS:',errs.length?[...new Set(errs)].slice(0,6).join(' || '):'none');
await browser.close();
