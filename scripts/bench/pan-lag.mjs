// Opens a project, sets the camera close enough that shadows are drawn, then pans and zooms with a wheel the way a hand does and records every frame.
// npx vite preview --port 5199, then: node scripts/bench/pan-lag.mjs <doc.oui> [webkit|chromium] [url] [zoom=.72]
import fs from 'node:fs';
import {webkit,chromium} from '@playwright/test';
const [file,engine='webkit',url='http://127.0.0.1:5199/',zoomArg='.72']=process.argv.slice(2),buffer=fs.readFileSync(file);
const browser=await (engine==='chromium'?chromium:webkit).launch(),page=await browser.newPage({viewport:{width:1512,height:982},deviceScaleFactor:2});
page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
await page.goto(url);await page.waitForTimeout(800);
const blank=page.getByRole('button',{name:/New (design|file|project)|Blank/i}).first();if(await blank.isVisible().catch(()=>false))await blank.click();
await page.waitForSelector('#forma-design-canvas',{timeout:15000});
await page.getByRole('menuitem',{name:'File',exact:true}).click();
const choose=page.waitForEvent('filechooser');await page.getByRole('menuitem',{name:/^Open project…/}).click();await (await choose).setFiles({name:'bench.oui',mimeType:'application/json',buffer});
await page.waitForFunction(()=>document.querySelectorAll('#forma-design-canvas [data-node-id]').length>50,undefined,{timeout:120000});await page.waitForTimeout(2000);
const zoomNow=()=>page.evaluate(()=>Number(/scale\(([^)]+)\)/.exec(document.querySelector('[data-camera]').getAttribute('transform'))[1]));
for(let i=0;i<120&&await zoomNow()<Number(zoomArg);i++){await page.evaluate(()=>{const el=document.querySelector('#forma-design-canvas'),r=el.getBoundingClientRect();el.dispatchEvent(new WheelEvent('wheel',{ctrlKey:true,deltaY:-6,clientX:r.x+r.width*.3,clientY:r.y+r.height*.3,bubbles:true,cancelable:true}));});await page.waitForTimeout(40);}
await page.waitForTimeout(1500);
// kind: pan is a slow scroll back and forth, sweep travels across the page, fling is fast travel, zoom breathes in and out, out is one long zoom out.
const gesture=(kind,steps=kind==='sweep'?240:kind==='fling'?160:180)=>page.evaluate(async({kind,steps})=>{const el=document.querySelector('#forma-design-canvas'),r=el.getBoundingClientRect(),frames=[],raf=()=>new Promise(f=>requestAnimationFrame(f));let last=performance.now(),missing=0,checks=0;
 const camera=()=>{const m=/translate\(([^ ]+) ([^)]+)\) scale\(([^)]+)\)/.exec(document.querySelector('[data-camera]').getAttribute('transform')),b=el.getBoundingClientRect(),w=el.parentElement.getBoundingClientRect();return {zoom:Number(m[3])*(b.width/r.width),x:Number(m[1])*(b.width/r.width)+b.x-w.x,y:Number(m[2])*(b.width/r.width)+b.y-w.y};};
 const blankCheck=()=>{const c=camera();for(let s=0;s<60;s++){const x=(s%10)*435*c.zoom+c.x,y=Math.floor(s/10)*872*c.zoom+c.y,w=375*c.zoom,h=812*c.zoom;if(x+w<0||y+h<0||x>r.width||y>r.height)continue;checks++;if(!document.querySelector(`[data-node-id="screen-${s}"]`))missing++;}};
 for(let i=0;i<steps;i++){const d=kind==='sweep'?{deltaX:i%240<120?24:-24,deltaY:i%240<120?6:-6}:kind==='fling'?{deltaX:i%160<80?90:-90,deltaY:i%160<80?30:-30}:kind==='pan'?{deltaX:0,deltaY:i%60<30?12:-12}:kind==='out'?{ctrlKey:true,deltaY:6}:{ctrlKey:true,deltaY:i%60<30?-4:4};el.dispatchEvent(new WheelEvent('wheel',{...d,clientX:r.x+500,clientY:r.y+350,bubbles:true,cancelable:true}));if(i%4===3&&window.__checkBlank)blankCheck();await raf();const now=performance.now();frames.push(now-last);last=now;}
 const after=[];let at=performance.now();const end=at+1000;while(at<end){await raf();const now=performance.now();after.push(now-at);at=now;}
 frames.sort((a,b)=>a-b);const q=p=>Math.round(frames[Math.min(frames.length-1,Math.floor(frames.length*p))]);return {kind,p50:q(.5),p95:q(.95),max:Math.round(frames.at(-1)),over33:frames.filter(f=>f>33).length,settleWorst:Math.round(Math.max(...after)),settleOver33:after.filter(g=>g>33).length,camera:camera(),...(checks?{screensChecked:checks,screensMissing:missing}:{})};},{kind,steps});
const state=()=>page.evaluate(()=>{const el=document.querySelector('#forma-design-canvas');return {zoom:Number(/scale\(([^)]+)\)/.exec(document.querySelector('[data-camera]').getAttribute('transform'))[1]),layers:el.querySelectorAll('[data-node-id]').length,filters:el.querySelectorAll('[filter]').length,elements:el.querySelectorAll('*').length};});
console.log(engine,JSON.stringify(await state()));
for(const kind of ['pan','sweep','pan','zoom','fling','pan'])console.log(JSON.stringify(await gesture(kind)));
await page.evaluate(()=>{window.__checkBlank=true;});
for(const kind of ['sweep','fling','out'])console.log('checking blank',JSON.stringify(await gesture(kind)));
console.log(engine,JSON.stringify(await state()));await browser.close();
