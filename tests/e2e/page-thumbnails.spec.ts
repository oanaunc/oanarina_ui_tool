import {test,expect} from '@playwright/test';
import type {Page as BrowserPage} from '@playwright/test';
import {blankDocument,node} from '../../src/model';
import type {DesignDocument} from '../../src/model';

async function open(page:BrowserPage,doc:DesignDocument){
 const saved:string[]=[];await page.exposeFunction('thumbnailSave',(raw:string)=>{saved.push(raw);return true;});
 await page.addInitScript((raw:string)=>{const w=window as any;w.desktop={bootstrap:async()=>({kind:'file',raw}),ready:async()=>true,reportDocument:async()=>true,onCommand:()=>()=>{},onDocument:(fn:any)=>{w.thumbnailOpen=fn;return()=>{};},fonts:async()=>[],save:async(_name:string,raw:string)=>w.thumbnailSave(raw)};},JSON.stringify(doc));
 await page.goto('/');await expect(page.locator('.page-row')).toHaveCount(doc.pages.length);return saved;
}
function documentFixture(){const doc=blankDocument();doc.pages[0].name='Working';doc.pages[0].nodes=[node('rectangle',{name:'Working shape',x:100,y:90,width:100,height:60,fill:'#ff0000'})];doc.pages.push({id:'other',name:'Other artwork',nodes:[node('ellipse',{name:'Other ellipse',x:-100,y:50,width:100,height:100,fill:'#00ff00'})],comments:[]},{id:'empty',name:'Empty page',nodes:[],comments:[]});return doc;}
async function save(page:BrowserPage,saved:string[]){const n=saved.length;await page.locator('svg.canvas').focus();await page.keyboard.press('Meta+s');await expect.poll(()=>saved.length).toBe(n+1);return saved.at(-1)!;}
async function pixels(page:BrowserPage){return page.locator('.page-thumbnail-art svg').evaluate(async svg=>{const image=new Image(),data='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(svg))));image.src=data;await image.decode();const c=document.createElement('canvas');c.width=400;c.height=240;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,c.width,c.height);const bytes=ctx.getImageData(0,0,c.width,c.height).data;let red=0,blue=0,green=0,halfAlpha=0,clear=0;for(let i=0;i<bytes.length;i+=4){const a=bytes[i+3];if(a===0)clear++;if(a>0&&a<200)halfAlpha++;if(a>0&&bytes[i]>200&&bytes[i+1]<50)red++;if(a>0&&bytes[i+2]>200&&bytes[i]<50)blue++;if(a>0&&bytes[i+1]>200&&bytes[i]<50)green++;}return{red,green,blue,halfAlpha,clear};});}

test('off-page hover renders actual shapes, image alpha and mask pixels without selecting or changing the active canvas',async({page})=>{
 const blue=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=20;c.height=20;const ctx=c.getContext('2d')!;ctx.fillStyle='rgba(0,0,255,0.5)';ctx.fillRect(0,0,20,20);return c.toDataURL();}),doc=documentFixture(),mask=node('ellipse',{x:0,y:0,width:40,height:40,fill:'#000000',mask:{mode:'vector'}}),red=node('rectangle',{x:0,y:0,width:60,height:40,fill:'#ff0000'}),image=node('rectangle',{x:80,y:0,width:40,height:40,paints:[{id:'imagepaint',type:'image',visible:true,opacity:1,color:'#ffffff',angle:0,cx:.5,cy:.5,radius:.5,stops:[],image:blue,scaleMode:'fit'}]});doc.pages[1].nodes=[mask,red,image];
 // The next mask terminates the first sibling mask so the image remains independent.
 doc.pages[1].nodes.splice(2,0,node('rectangle',{x:80,y:0,width:40,height:40,fill:'#ffffff',mask:{mode:'vector'}}));
 const saved=await open(page,doc),before=await save(page,saved),canvas=await page.locator('svg.canvas').evaluate(e=>e.outerHTML);
 await page.locator('[data-page-id=other]').hover();await expect(page.getByRole('tooltip')).toBeVisible();await expect(page.locator('.page-row[aria-current=page]')).toHaveAttribute('data-page-id',doc.pages[0].id);await expect(page.getByRole('treeitem',{name:'Working shape',exact:true})).toBeVisible();
 const p=await pixels(page);expect(p.red).toBeGreaterThan(2000);expect(p.red).toBeLessThan(p.blue*.9);expect(p.blue).toBeGreaterThan(2000);expect(p.halfAlpha).toBeGreaterThan(2000);expect(p.clear).toBeGreaterThan(2000);
 expect(await page.locator('svg.canvas').evaluate(e=>e.outerHTML)).toBe(canvas);expect(await page.evaluate(()=>{const canvasIds=new Set([...document.querySelectorAll('svg.canvas [id]')].map(e=>e.id));return [...document.querySelectorAll('.page-thumbnail [id]')].some(e=>canvasIds.has(e.id));})).toBe(false);
 await page.mouse.move(600,20);await expect(page.getByRole('tooltip')).toHaveCount(0);expect(await save(page,saved)).toBe(before);await page.keyboard.press('Meta+z');expect(await save(page,saved)).toBe(before);
});

test('keyboard focus previews without selecting, Escape clears, and empty pages are honest',async({page})=>{
 const doc=documentFixture();await open(page,doc);const row=page.locator('[data-page-id=other]');await row.focus();await expect(page.getByRole('tooltip')).toContainText('Other artwork');await expect(row).toHaveAttribute('aria-describedby',await page.getByRole('tooltip').getAttribute('id') as string);await expect(page.locator('.page-row[aria-current=page]')).toHaveAttribute('data-page-id',doc.pages[0].id);await row.press('Escape');await expect(page.getByRole('tooltip')).toHaveCount(0);await expect(row).toBeFocused();
 await page.locator('[data-page-id=empty]').focus();await expect(page.getByRole('tooltip')).toContainText('No artwork on this page');await expect(page.locator('.page-thumbnail svg')).toHaveCount(0);await page.getByRole('searchbox',{name:'Search page names'}).focus();await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('previews refresh after edits and Undo and isolate SVG IDs when previewing the current page',async({page})=>{
 const doc=documentFixture();await open(page,doc);const row=page.locator(`[data-page-id="${doc.pages[0].id}"]`);await row.hover();await expect(page.getByRole('tooltip')).toBeVisible();expect((await pixels(page)).red).toBeGreaterThan(1000);const original=await page.locator('.page-thumbnail svg').getAttribute('viewBox');
 expect(await page.evaluate(()=>{const ids=[...document.querySelectorAll('svg.canvas [id],.page-thumbnail svg [id]')].map(e=>e.id);return new Set(ids).size===ids.length;})).toBe(true);
 await page.getByRole('treeitem',{name:'Working shape',exact:true}).click();await page.getByRole('spinbutton',{name:'W',exact:true}).fill('300');await page.getByRole('spinbutton',{name:'W',exact:true}).press('Enter');await row.hover();await expect(page.getByRole('tooltip')).toBeVisible();await expect(page.locator('.page-thumbnail svg')).not.toHaveAttribute('viewBox',original!);await page.locator('svg.canvas').focus();await page.keyboard.press('Meta+z');await expect(page.getByRole('tooltip')).toHaveCount(0);await page.mouse.move(600,20);await row.hover();await expect(page.locator('.page-thumbnail svg')).toHaveAttribute('viewBox',original!);
});

test('filter, context menu, drag, modal and project changes clear the one on-demand preview',async({page})=>{
 const doc=documentFixture();await open(page,doc);const row=page.locator('[data-page-id=other]'),tip=page.getByRole('tooltip');await row.hover();await expect(tip).toBeVisible();await page.getByRole('searchbox',{name:'Search page names'}).fill('empty');await expect(tip).toHaveCount(0);await page.getByRole('button',{name:'Clear page search'}).click();await row.hover();await expect(tip).toBeVisible();await row.click({button:'right'});await expect(page.getByRole('menu',{name:'Page actions'})).toBeVisible();await expect(tip).toHaveCount(0);await page.keyboard.press('Escape');
 await row.hover();await expect(tip).toBeVisible();await row.dispatchEvent('dragstart',{dataTransfer:await page.evaluateHandle(()=>new DataTransfer())});await expect(tip).toHaveCount(0);await row.dispatchEvent('dragend');
 await page.mouse.move(600,20);await row.hover();await expect(tip).toBeVisible();await page.keyboard.press('Meta+,');await expect(page.getByRole('dialog')).toBeVisible();await expect(tip).toHaveCount(0);await page.getByRole('button',{name:'Close dialog',exact:true}).click();
 await page.mouse.move(600,20);await row.hover();await expect(tip).toBeVisible();const other=blankDocument();other.pages[0].name='Another project';await page.evaluate(async raw=>(window as any).thumbnailOpen(raw),JSON.stringify(other));await expect(tip).toHaveCount(0);await expect(page.locator('.page-row')).toHaveCount(1);
});

test('scrolling cancels a pending preview timer before artwork mounts',async({page})=>{
 await open(page,documentFixture());await page.locator('[data-page-id=other]').hover();await page.locator('.pages-list').evaluate(e=>e.dispatchEvent(new Event('scroll')));await page.waitForTimeout(300);await expect(page.getByRole('tooltip')).toHaveCount(0);
 await page.locator('[data-page-id=empty]').focus();await page.locator('.pages-list').evaluate(e=>e.dispatchEvent(new Event('scroll')));await expect(page.getByRole('tooltip')).toContainText('Empty page');await page.locator('.pages-list').evaluate(e=>e.dispatchEvent(new Event('scroll')));await page.waitForTimeout(300);await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('preview placement fits narrow and short viewports and large page lists render at most one artwork preview',async({page})=>{
 const doc=documentFixture();for(let i=0;i<997;i++)doc.pages.push({id:'extra'+i,name:'Page '+i,nodes:[node('rectangle')],comments:[]});await open(page,doc);await expect(page.locator('.page-thumbnail svg')).toHaveCount(0);await page.locator('.page-row').first().focus();await page.keyboard.press('End');await expect(page.locator('[data-page-id=extra996]')).toBeFocused();await expect(page.getByRole('tooltip')).toContainText('Page 996');await page.keyboard.press('Home');await expect(page.locator('.page-row').first()).toBeFocused();await page.setViewportSize({width:390,height:844});await page.locator('[data-page-id=other]').hover();await expect(page.getByRole('tooltip')).toBeVisible();let box=await page.getByRole('tooltip').boundingBox();expect(box!.x).toBeGreaterThanOrEqual(8);expect(box!.x+box!.width).toBeLessThanOrEqual(382);expect(box!.y+box!.height).toBeLessThanOrEqual(836);await expect(page.locator('.page-thumbnail svg')).toHaveCount(1);
 await page.setViewportSize({width:390,height:220});await expect(page.getByRole('tooltip')).toHaveCount(0);await page.locator('[data-page-id=other]').focus();await expect(page.getByRole('tooltip')).toBeVisible();box=await page.getByRole('tooltip').boundingBox();expect(box!.y).toBeGreaterThanOrEqual(8);expect(box!.y+box!.height).toBeLessThanOrEqual(212);await expect(page.locator('.page-thumbnail svg')).toHaveCount(1);
});
