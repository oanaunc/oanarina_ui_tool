import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
/** A page big and shadowy enough that the camera moves it on the compositor, with the grid known so a test can say which screens the view needs. */
const load=(page:Page,zoom=.7)=>page.evaluate(async zoom=>{const {useEditor}=await import('/src/store.ts'),{blankDocument,node}=await import('/src/model.ts'),{createEffect}=await import('/src/effects.ts'),{createPaint}=await import('/src/paints.ts'),doc=blankDocument(),nodes=[];const solid=(fill:string)=>({fill,paints:[createPaint(fill)]});for(let s=0;s<80;s++){const frame='screen-'+s,x=(s%10)*435,y=Math.floor(s/10)*872;nodes.push(node('frame',{id:frame,name:'Screen '+s,x,y,width:375,height:812,clip:true,...solid('#ffffff')}));for(let r=0;r<14;r++){const at=y+110+r*48;nodes.push(node('rectangle',{id:`${frame}-${r}`,parentId:frame,name:'Card',x:x+16,y:at,width:343,height:44,radius:10,effects:[{...createEffect('drop-shadow'),id:`${frame}-${r}-e`,y:2,radius:8}],...solid('#f7f7f8')}));nodes.push(node('text',{id:`${frame}-${r}-t`,parentId:frame,name:'Name',x:x+60,y:at+6,width:220,height:16,text:'A list item',fontFamily:'Inter',fontSize:13,fontWeight:600,...solid('#1e1e1e')}));for(let i=0;i<3;i++)nodes.push(node('ellipse',{id:`${frame}-${r}-${i}`,parentId:frame,name:'Dot',x:x+24+i*8,y:at+8,width:6,height:6,...solid('#6ca0ff')}));}}doc.pages[0].nodes=nodes;useEditor.getState().load(doc);useEditor.getState().set({zoom,pan:{x:12,y:16}});},zoom);
const camera=(page:Page)=>page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts'),{zoom,pan}=useEditor.getState();return {zoom,pan};});
const idle=(page:Page)=>expect.poll(()=>page.evaluate(()=>({loading:document.querySelector('[data-progressive-page="loading"]')!==null,held:document.querySelectorAll('[data-node-id][style*="filter"]').length,transform:document.querySelector<SVGElement>('#forma-design-canvas')!.style.transform})),{timeout:20000}).toEqual({loading:false,held:0,transform:''});
const proxies=(page:Page)=>expect.poll(()=>page.locator('[data-shadow-proxy]').count(),{timeout:20000}).toBeGreaterThan(30);
const wheel=(page:Page,deltaX:number,deltaY:number)=>page.evaluate(([deltaX,deltaY])=>{const el=document.querySelector('#forma-design-canvas')!,r=el.getBoundingClientRect();el.dispatchEvent(new WheelEvent('wheel',{deltaX,deltaY,clientX:r.x+200,clientY:r.y+200,bubbles:true,cancelable:true}));return new Promise(done=>requestAnimationFrame(done));},[deltaX,deltaY]);
const scene=(page:Page)=>page.locator('[data-canvas]').first();
test.beforeEach(async({page})=>{await page.goto('/');await expect(page.locator('[data-canvas]').first()).toBeVisible();});
test('a pan moves the retained layer, not the scene, and lands in the store',async({page})=>{
 test.setTimeout(90000);await load(page);await idle(page);const before=await camera(page),transform=await page.locator('[data-camera]').getAttribute('transform');
 for(let i=0;i<4;i++)await wheel(page,30,10);
 await expect(page.locator('[data-camera]')).toHaveAttribute('transform',transform!);expect(await page.locator('#forma-design-canvas').evaluate(e=>(e as SVGElement).style.transform)).toMatch(/^translate\(-\d/);
 await expect.poll(()=>page.locator('[data-camera]').getAttribute('transform'),{timeout:5000}).not.toBe(transform);await idle(page);expect(await camera(page)).toEqual({zoom:before.zoom,pan:{x:before.pan.x-120,y:before.pan.y-40}});
});
test('a long pan never shows a screen that has not been drawn',async({page})=>{
 test.setTimeout(90000);await load(page);await idle(page);const missing=await page.evaluate(async()=>{const el=document.querySelector('#forma-design-canvas')!,box=el.getBoundingClientRect(),raf=()=>new Promise(r=>requestAnimationFrame(r)),lost:string[]=[];let x=12,y=16;for(let i=0;i<140;i++){const dx=i<70?60:-60,dy=i<70?24:-24;el.dispatchEvent(new WheelEvent('wheel',{deltaX:dx,deltaY:dy,clientX:box.x+100,clientY:box.y+100,bubbles:true,cancelable:true}));x-=dx;y-=dy;await raf();await raf();for(let s=0;s<80;s++){const left=(s%10)*435*.7+x,top=Math.floor(s/10)*872*.7+y;if(left+262<0||top+568<0||left>box.width||top>box.height)continue;if(!document.querySelector(`[data-node-id="screen-${s}"]`))lost.push(`${i}:${s}`);}}return lost;});
 expect(missing).toEqual([]);await idle(page);
});
test('what rests on the canvas after a gesture is exactly what was there',async({page})=>{
 test.setTimeout(120000);await load(page);await idle(page);await proxies(page);await page.mouse.move(2,2);const canvas=scene(page),before=await canvas.screenshot({animations:'disabled'});
 const stoodIn=page.evaluate(()=>new Promise<number>(done=>{let peak=0;const end=performance.now()+2500,tick=()=>{peak=Math.max(peak,document.querySelectorAll('[data-node-id][style*="filter"]').length);if(performance.now()<end)requestAnimationFrame(tick);else done(peak);};tick();}));
 for(let i=0;i<6;i++)await wheel(page,40,20);for(let i=0;i<6;i++)await wheel(page,-40,-20);
 expect(await stoodIn).toBeGreaterThan(20);await idle(page);
 /* A partial repaint can differ by a few levels at an edge it cuts through, so the scene is compared after painting all of it. */await page.evaluate(()=>{const e=document.querySelector<SVGElement>('#forma-design-canvas')!;e.style.display='none';void e.getBoundingClientRect();e.style.display='';});await expect.poll(async()=>(await canvas.screenshot({animations:'disabled'})).equals(before),{timeout:10000}).toBe(true);
 expect(await page.evaluate(()=>[...document.querySelectorAll<SVGElement>('[data-shadow-proxy]')].every(i=>i.style.display==='none'))).toBe(true);
});
test('a shadow that changed mid-flight keeps its real filter and its new look',async({page})=>{
 test.setTimeout(90000);await load(page);await idle(page);await proxies(page);const id=await page.evaluate(()=>document.querySelector('[data-shadow-proxy]')!.parentElement!.getAttribute('data-node-id')!);
 await page.evaluate(async id=>{const {useEditor}=await import('/src/store.ts');const n=useEditor.getState().doc.pages[0].nodes.find((n:{id:string})=>n.id===id);useEditor.getState().patch([id],{effects:[{...n.effects[0],y:30}]});},id);
 for(let i=0;i<3;i++)await wheel(page,20,0);await idle(page);
 expect(await page.evaluate(id=>{const g=document.querySelector(`[data-node-id="${id}"]`)!;return {filter:g.getAttribute('filter'),style:(g as SVGElement).style.filter,offset:document.getElementById('fx'+id)!.querySelector('feOffset')!.getAttribute('dy')};},id)).toEqual({filter:`url(#fx${id})`,style:'',offset:'30'});
});
test('exports never carry a stand-in',async({page})=>{
 test.setTimeout(90000);await load(page);await idle(page);await proxies(page);for(let i=0;i<3;i++)await wheel(page,20,0);
 const svg=await page.evaluate(async()=>{const {exportSvg}=await import('/src/files.tsx'),{useEditor}=await import('/src/store.ts');return exportSvg(useEditor.getState().doc.pages[0].nodes.slice(0,86));});
 expect(svg).toContain('<filter');expect(svg).toContain('feGaussianBlur');expect(svg).not.toContain('data-shadow-proxy');expect(svg).not.toContain('<image');
});
test('a click leaves the artwork alone and a nudge touches only its own layers',async({page})=>{
 test.setTimeout(90000);await load(page);await idle(page);await page.evaluate(()=>{const w=window as unknown as {changes:{id:string|null|undefined}[];watch:MutationObserver};w.changes=[];w.watch=new MutationObserver(list=>{for(const m of list){const at=m.target instanceof Element?m.target:m.target.parentElement;if(m.type==='attributes'&&m.attributeName==='data-progressive-page')continue;if(m.type==='childList'&&[...m.addedNodes,...m.removedNodes].every(n=>(n as Element).hasAttribute?.('data-shadow-proxy')))continue;if(at?.closest('[data-shadow-proxy]')||(m.attributeName==='style'&&(m.target as SVGElement).style.filter!==undefined&&m.target instanceof SVGElement&&m.target.hasAttribute('filter')))continue;w.changes.push({id:at?.closest('[data-node-id]')?.getAttribute('data-node-id')});}});w.watch.observe(document.querySelector('[data-viewport-culling]')!,{subtree:true,childList:true,attributes:true,characterData:true});});
 const hit=await page.evaluate(()=>{const b=document.querySelector('[data-node-id="screen-1"]')!.getBoundingClientRect();return {x:b.x+100,y:b.y+30};});await page.mouse.click(hit.x,hit.y);
 await expect.poll(()=>page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts');return useEditor.getState().selection;})).toEqual(['screen-1']);
 expect(await page.evaluate(()=>(window as unknown as {changes:unknown[]}).changes)).toEqual([]);
 await page.keyboard.press('ArrowRight');await expect(page.locator('[data-node-id="screen-1"]')).toHaveAttribute('transform','translate(436 0)');
 const touched=await page.evaluate(()=>[...new Set((window as unknown as {changes:{id:string}[]}).changes.map(c=>c.id))]);const layers=touched.filter(Boolean);expect(layers.length).toBeGreaterThan(0);expect(layers.every(id=>/^screen-1(-|$)/.test(id))).toBe(true);
});
test('dragging a frame on a page of batches commits, undoes and redoes',async({page})=>{
 test.setTimeout(90000);await load(page);await idle(page);const box=await page.evaluate(()=>{const b=document.querySelector('[data-node-id="screen-0"]')!.getBoundingClientRect();return {x:b.x+100,y:b.y+30};});
 const at=async()=>page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts'),s=useEditor.getState(),n=s.doc.pages[0].nodes;return {frame:n.find((a:{id:string})=>a.id==='screen-0').x,child:n.find((a:{id:string})=>a.id==='screen-0-0').x,history:s.past.length};});
 await page.mouse.move(box.x,box.y);await page.mouse.down();await page.mouse.up();const start=await at();await page.mouse.move(box.x,box.y);await page.mouse.down();for(let i=1;i<=10;i++)await page.mouse.move(box.x+i*7,box.y);await page.mouse.up();
 await expect.poll(async()=>(await at()).frame).toBeGreaterThan(start.frame+60);const moved=await at();expect(moved.child-moved.frame).toBe(16);await expect(page.locator('[data-node-id="screen-0"]')).toHaveAttribute('transform',`translate(${moved.frame} 0)`);
 await page.keyboard.press('Meta+z');await expect.poll(async()=>(await at()).frame).toBe(start.frame);await expect(page.locator('[data-node-id="screen-0"]')).toHaveAttribute('transform',`translate(${start.frame} 0)`);
 await page.keyboard.press('Meta+Shift+z');await expect.poll(async()=>(await at()).frame).toBe(moved.frame);
});
test('zooming out on a big page shows every screen and comes back to full detail',async({page})=>{
 test.setTimeout(120000);await load(page,.5);await idle(page);await page.evaluate(async()=>{const el=document.querySelector('#forma-design-canvas')!,box=el.getBoundingClientRect();for(let i=0;i<40;i++){el.dispatchEvent(new WheelEvent('wheel',{ctrlKey:true,deltaY:5,clientX:box.x+300,clientY:box.y+300,bubbles:true,cancelable:true}));await new Promise(r=>requestAnimationFrame(r));}});
 await idle(page);const zoomed=await camera(page);expect(zoomed.zoom).toBeLessThan(.3);await expect(page.locator('[data-node-id^="screen-"]:not([data-node-id*="-"][data-node-id$="t"])').first()).toBeVisible();
 await page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts');useEditor.getState().set({zoom:.8,pan:{x:0,y:0}});});await idle(page);await expect(page.locator('[data-node-id="screen-0-0-t"] text').first()).toBeVisible();await expect(page.locator('[data-node-id="screen-0-0-t"] [data-text-bars]')).toHaveCount(0);await expect(page.locator('[data-node-id="screen-0-0"]')).toHaveAttribute('filter','url(#fxscreen-0-0)');
});
