// Opens a project in a production build, zooms to 100%, then times real clicks, drags and typed edits.
// npx vite preview --port 5199, then: node scripts/bench/edit-lag.mjs <doc.oui> [webkit|chromium] [url]
import fs from 'node:fs';
import {webkit,chromium} from '@playwright/test';
const [file,engine='webkit',url='http://127.0.0.1:5199/']=process.argv.slice(2),buffer=fs.readFileSync(file);
const browser=await (engine==='chromium'?chromium:webkit).launch(),page=await browser.newPage({viewport:{width:1512,height:982},deviceScaleFactor:2});
page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
await page.goto(url);await page.waitForTimeout(800);
const blank=page.getByRole('button',{name:/New (design|file|project)|Blank/i}).first();if(await blank.isVisible().catch(()=>false))await blank.click();
await page.waitForSelector('#forma-design-canvas',{timeout:15000});
await page.getByRole('menuitem',{name:'File',exact:true}).click();
const choose=page.waitForEvent('filechooser');await page.getByRole('menuitem',{name:/^Open project…/}).click();await (await choose).setFiles({name:'bench.oui',mimeType:'application/json',buffer});
await page.waitForFunction(()=>document.querySelectorAll('#forma-design-canvas [data-node-id]').length>50,undefined,{timeout:120000});await page.waitForTimeout(3000);
await page.evaluate(()=>{const b=window.__edit={gaps:[],last:performance.now(),on:true};const tick=()=>{const now=performance.now();b.gaps.push(now-b.last);b.last=now;if(b.on)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
const measure=async(name,work)=>{await page.evaluate(()=>{window.__edit.gaps.length=0;});const at=Date.now();await work();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const wall=Date.now()-at,gaps=await page.evaluate(()=>window.__edit.gaps);gaps.sort((a,b)=>a-b);console.log(name.padEnd(26),'wall',String(wall).padStart(5),'worst frame',String(Math.round(gaps.at(-1)??0)).padStart(5),'p95',String(Math.round(gaps[Math.floor(gaps.length*.95)]??0)).padStart(4));};
const canvas=await page.locator('#forma-design-canvas').boundingBox(),at=(x,y)=>[canvas.x+x,canvas.y+y];
const hit=await page.evaluate(()=>{const el=[...document.querySelectorAll('#forma-design-canvas [data-node-id]')].map(e=>({id:e.getAttribute('data-node-id'),box:e.getBoundingClientRect()})).find(e=>/screen-11$/.test(e.id));return {x:el.box.x+el.box.width/2,y:el.box.y+el.box.height/2};});
await page.mouse.move(hit.x,hit.y);
await measure('click frame',async()=>{await page.mouse.down();await page.mouse.up();});
await measure('click empty canvas',async()=>{const [x,y]=at(60,40);await page.mouse.move(x,y);await page.mouse.down();await page.mouse.up();});
await page.mouse.move(hit.x,hit.y);await page.mouse.down();await page.mouse.up();await page.keyboard.press('Shift+Enter');
await measure('drag frame 40 steps',async()=>{await page.mouse.move(hit.x,hit.y);await page.mouse.down();for(let i=1;i<=40;i++)await page.mouse.move(hit.x+i*2,hit.y+i);await page.mouse.up();});
await measure('arrow nudge',async()=>{await page.keyboard.press('ArrowRight');});
await measure('undo',async()=>{await page.keyboard.press('Meta+z');});
await measure('hover 40 moves',async()=>{for(let i=0;i<40;i++)await page.mouse.move(hit.x+i*3,hit.y+i*2);});
await browser.close();
