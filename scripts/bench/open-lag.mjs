// Opens a project in a production build, then pans straight away, and records how long the page stalls.
// npx vite preview --port 5199, then: node scripts/bench/open-lag.mjs <doc.oui> [webkit|chromium] [url]
import fs from 'node:fs';
import {webkit,chromium} from '@playwright/test';
const [file,engine='webkit',url='http://127.0.0.1:5199/']=process.argv.slice(2),buffer=fs.readFileSync(file);
const browser=await (engine==='chromium'?chromium:webkit).launch(),page=await browser.newPage({viewport:{width:1512,height:982},deviceScaleFactor:2});
page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
await page.goto(url);await page.waitForTimeout(800);
const blank=page.getByRole('button',{name:/New (design|file|project)|Blank/i}).first();if(await blank.isVisible().catch(()=>false))await blank.click();
await page.waitForSelector('#forma-design-canvas',{timeout:15000});
await page.evaluate(()=>{const w=window,b=w.__bench={gaps:[],stalls:[],on:true,last:performance.now(),start:performance.now()};const tick=()=>{const now=performance.now(),gap=now-b.last;b.last=now;b.gaps.push(gap);if(gap>50)b.stalls.push([Math.round(now-b.start),Math.round(gap)]);if(b.on)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
await page.getByRole('menuitem',{name:'File',exact:true}).click();
const choose=page.waitForEvent('filechooser');await page.getByRole('menuitem',{name:/^Open project…/}).click();
await page.evaluate(()=>{const b=window.__bench;b.start=performance.now();b.gaps.length=0;b.stalls.length=0;});
await (await choose).setFiles({name:'bench.oui',mimeType:'application/json',buffer});
await page.waitForFunction(()=>document.querySelectorAll('#forma-design-canvas [data-node-id]').length>50,undefined,{timeout:Number(process.env.OPEN_LIMIT??120000)}).catch(async e=>{console.log(await page.evaluate(()=>document.body.innerText.slice(0,700)));if(process.env.OPEN_SHOT)await page.screenshot({path:process.env.OPEN_SHOT});throw e;});
const report=await page.evaluate(async process_sample=>{
 const b=window.__bench,el=document.querySelector('#forma-design-canvas'),shown=performance.now()-b.start,pan=[];
 for(let i=0;i<180;i++){const at=performance.now(),box=el.getBoundingClientRect();el.dispatchEvent(new WheelEvent('wheel',{deltaX:0,deltaY:i%60<30?12:-12,clientX:box.x+400,clientY:box.y+300,bubbles:true,cancelable:true}));await new Promise(r=>requestAnimationFrame(r));pan.push(performance.now()-at);}
 await new Promise(r=>setTimeout(r,2500));b.on=false;
 const census={};for(const e of el.querySelectorAll('*'))census[e.localName]=(census[e.localName]??0)+1;b.census=Object.entries(census).sort((x,y)=>y[1]-x[1]).slice(0,14);const one=el.querySelector('[data-node-id$="row-3-t"]')?.outerHTML.slice(0,1400),card=el.querySelector('[data-node-id$="row-3"]')?.outerHTML.slice(0,2200);b.sample={one,card};
 const sorted=a=>[...a].sort((x,y)=>x-y),p=(a,q)=>Math.round(sorted(a)[Math.min(a.length-1,Math.floor(a.length*q))]);
 return {canvasMs:Math.round(shown),layersInDom:el.querySelectorAll('[data-node-id]').length,elements:el.querySelectorAll('*').length,biggestStallMs:Math.round(Math.max(...b.gaps)),stallsOver50:b.stalls.length,totalStallMs:b.stalls.reduce((n,s)=>n+s[1],0),firstStalls:b.stalls.slice(0,8),panP50:p(pan,.5),panP95:p(pan,.95),panMax:p(pan,.999),census:b.census,zoom:el.querySelector('[data-camera]')?.getAttribute('transform'),sample:process_sample?b.sample:undefined};
},!!process.env.OPEN_SAMPLE);
if(process.env.OPEN_SHOT)await page.screenshot({path:process.env.OPEN_SHOT});
console.log(engine,JSON.stringify(report));await browser.close();
