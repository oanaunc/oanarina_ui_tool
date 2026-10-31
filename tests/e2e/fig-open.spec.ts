import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import fs from 'node:fs/promises';
import {blankDocument,node} from '../../src/model';
import {syntheticSceneFig,sceneMessage,sceneFigFromMessage} from '../helpers/fig-scene-fixture';

async function choose(page:Page,name:string,bytes:Uint8Array){
 await page.getByRole('menuitem',{name:'File',exact:true}).click();const event=page.waitForEvent('filechooser');
 await page.getByRole('menuitem',{name:/^Open project/}).click();await(await event).setFiles({name,mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});
}
async function browserProject(page:Page){
 const doc=blankDocument();doc.name='Keep original project';doc.pages[0].nodes=[node('rectangle',{name:'Keep original rectangle',width:100})];
 await page.goto('/');await page.getByRole('button',{name:'New design file',exact:true}).click();
 await choose(page,'original.oui',new TextEncoder().encode(JSON.stringify(doc)));await expect(page.locator(`[data-layer-id="${doc.pages[0].nodes[0].id}"]`)).toBeVisible();return doc;
}
async function save(page:Page){const event=page.waitForEvent('download');await page.keyboard.press('Meta+s');return JSON.parse(await fs.readFile((await(await event).path())!,'utf8'));}
async function closeReport(page:Page){const dialog=page.getByRole('dialog',{name:'Design file import report',exact:true});await expect(dialog).toBeVisible();await dialog.getByRole('button',{name:'Continue editing',exact:true}).click();}
async function library(page:Page){return page.evaluate(async()=>{
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('oanarina-projects',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const tx=db.transaction(['documents','metadata']);const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const [active,documents]=await Promise.all([request(tx.objectStore('metadata').get('active')),request(tx.objectStore('documents').getAll())]);db.close();return{active,documents};
});}
async function holdWorkers(page:Page){await page.evaluate(()=>{
 const w=window as any,Original=window.Worker;w.figHeld=[];
 w.Worker=class extends Original{
  slot:any;constructor(url:string|URL,options?:WorkerOptions){super(url,options);if(String(url).includes('fig-import')){this.slot={terminated:false,release:null};w.figHeld.push(this.slot);}}
  override postMessage(data:any,transfer:any){if(!this.slot){super.postMessage(data,transfer);return;}this.slot.release=()=>{if(!this.slot.terminated)super.postMessage(data,transfer);};}
  override terminate(){if(this.slot)this.slot.terminated=true;super.terminate();}
 };
});}

test('File Open decodes a synthetic .fig into editable layers with undo and portable .oui save/reopen',async({page})=>{
 await browserProject(page);await choose(page,'Editable scene.fig',syntheticSceneFig());await closeReport(page);
 await expect(page.locator('.page-row')).toContainText('Imported page');const rectangle=page.locator('.layer-row').filter({hasText:'Editable imported rectangle'});await rectangle.click();
 const width=page.getByRole('spinbutton',{name:'W',exact:true});await expect(width).toHaveValue('300');await width.fill('360');await width.press('Enter');await page.locator('svg.canvas').focus();await page.keyboard.press('Meta+z');await rectangle.click();await expect(width).toHaveValue('300');await page.locator('svg.canvas').focus();await page.keyboard.press('Meta+Shift+z');await rectangle.click();await expect(width).toHaveValue('360');
 const saved=await save(page);expect(saved.name).toBe('Editable scene');expect(saved.pages[0].nodes.find((n:any)=>n.type==='rectangle')).toMatchObject({width:360,fill:'#3366cc'});expect(saved.pages[0].nodes.find((n:any)=>n.type==='text')).toMatchObject({text:'A synthetic local design',fontFamily:'Inter'});
 await choose(page,'portable.oui',new TextEncoder().encode(JSON.stringify(saved)));await expect(rectangle).toBeVisible();await rectangle.click();await expect(width).toHaveValue('360');const again=await save(page);expect(again.id).toBe(saved.id);expect(again.pages[0].nodes.map((n:any)=>n.id)).toEqual(saved.pages[0].nodes.map((n:any)=>n.id));
});
test('malformed .fig never changes current artwork or persisted active identity',async({page})=>{
 const original=await browserProject(page);await choose(page,'invalid.fig',new Uint8Array([80,75,3,4,1,2,3]));await expect(page.locator('.toast')).toContainText(/ZIP|fig|container/);
 const invalidScene=sceneMessage();invalidScene.nodeChanges[2].size!.x=-10;await choose(page,'invalid-scene.fig',sceneFigFromMessage(invalidScene));await expect(page.locator('.toast')).toContainText(/range|geometry|Invalid/);
 await expect(page.locator(`[data-layer-id="${original.pages[0].nodes[0].id}"]`)).toBeVisible();await expect(page.getByRole('dialog',{name:'Design file import report',exact:true})).toHaveCount(0);const saved=await save(page);expect(saved.id).toBe(original.id);expect((await library(page)).active).toBe(original.id);
});
test('user edits cancel a held worker; an obsolete result cannot replace current artwork or recovery',async({page})=>{
 const original=await browserProject(page);await page.locator(`[data-layer-id="${original.pages[0].nodes[0].id}"]`).click();await holdWorkers(page);
 await choose(page,'stale.fig',syntheticSceneFig());await expect.poll(()=>page.evaluate(()=>(window as any).figHeld.length)).toBe(1);
 const width=page.getByRole('spinbutton',{name:'W',exact:true});await width.fill('210');await width.press('Enter');await expect.poll(()=>page.evaluate(()=>(window as any).figHeld[0].terminated)).toBe(true);await page.evaluate(()=>(window as any).figHeld[0].release());
 await expect(page.getByRole('dialog',{name:'Design file import report',exact:true})).toHaveCount(0);const saved=await save(page);expect(saved.id).toBe(original.id);expect(saved.pages[0].nodes[0].width).toBe(210);expect((await library(page)).active).toBe(original.id);
});
test('a newer File Open terminates the prior worker and only its project reaches recovery',async({page})=>{
 await browserProject(page);await holdWorkers(page);await choose(page,'First.fig',syntheticSceneFig('First candidate'));await expect.poll(()=>page.evaluate(()=>(window as any).figHeld.length)).toBe(1);
 await choose(page,'Second.fig',syntheticSceneFig('Second candidate'));await expect.poll(()=>page.evaluate(()=>(window as any).figHeld.length)).toBe(2);expect(await page.evaluate(()=>(window as any).figHeld[0].terminated)).toBe(true);
 await page.evaluate(()=>(window as any).figHeld[1].release());await closeReport(page);await page.evaluate(()=>(window as any).figHeld[0].release());await expect(page.locator('.layer-row').filter({hasText:'Second candidate'})).toBeVisible();await expect(page.locator('.layer-row').filter({hasText:'First candidate'})).toHaveCount(0);
 const saved=await save(page),stored=await library(page);expect(saved.name).toBe('Second');expect(stored.active).toBe(saved.id);expect(stored.documents.some((d:any)=>d.name==='First')).toBe(false);
});
test('editing while import waits behind an IndexedDB transaction aborts its pending active-document write',async({page})=>{
 const original=await browserProject(page);await page.locator(`[data-layer-id="${original.pages[0].nodes[0].id}"]`).click();await save(page);await page.waitForTimeout(700);
 await page.evaluate(async()=>{
  const w=window as any,db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('oanarina-projects',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const tx=db.transaction(['documents','metadata'],'readwrite'),store=tx.objectStore('metadata');let holding=true;
  const loop=()=>{if(holding){const r=store.get('active');r.onsuccess=loop;}};loop();w.releaseFigDb=()=>{holding=false;};tx.oncomplete=()=>db.close();
  const previous=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(...args:any[]){const result=Reflect.apply(previous,this,args);if(args[1]==='readwrite'&&Array.from(args[0]).includes('documents'))w.figWaitingTransaction=true;return result;};
 });
 await choose(page,'Database candidate.fig',syntheticSceneFig());await expect.poll(()=>page.evaluate(()=>(window as any).figWaitingTransaction)).toBe(true);
 const width=page.getByRole('spinbutton',{name:'W',exact:true});await width.fill('245');await width.press('Enter');await page.evaluate(()=>(window as any).releaseFigDb());
 await expect(page.getByRole('dialog',{name:'Design file import report',exact:true})).toHaveCount(0);const saved=await save(page),stored=await library(page);expect(saved.id).toBe(original.id);expect(saved.pages[0].nodes[0].width).toBe(245);expect(stored.active).toBe(original.id);expect(stored.documents.some((d:any)=>d.name==='Database candidate')).toBe(false);
});

for(const format of ['oui','fig'] as const)test(`an immediate ${format} File Open flushes unsaved outgoing artwork before replacing it`,async({page})=>{
 const original=await browserProject(page);await page.locator(`[data-layer-id="${original.pages[0].nodes[0].id}"]`).click();
 // Suppress only the background recovery debounce: this assertion must exercise the explicit outgoing flush.
 await page.evaluate(()=>{const timeout=window.setTimeout;window.setTimeout=((fn:TimerHandler,delay?:number,...args:any[])=>timeout(fn,delay===600?60000:delay,...args)) as typeof window.setTimeout;});
 const width=page.getByRole('spinbutton',{name:'W',exact:true});await width.fill('210');
 const event=page.waitForEvent('filechooser');await page.evaluate(()=>{
  const input=document.querySelector('input[aria-label="W"]')!;input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  window.dispatchEvent(new CustomEvent('command',{detail:'open'}));
 });
 const next=blankDocument();next.name='Next project';const bytes=format==='fig'?syntheticSceneFig():new TextEncoder().encode(JSON.stringify(next));
 await(await event).setFiles({name:'Next project.'+format,mimeType:'application/octet-stream',buffer:Buffer.from(bytes)});
 if(format==='fig')await closeReport(page);else await expect(page.getByRole('button',{name:'Document title menu: Next project',exact:true})).toBeVisible();
 const stored=await library(page),outgoing=stored.documents.find((doc:any)=>doc.id===original.id);expect(outgoing.pages[0].nodes[0].width).toBe(210);expect(stored.active).not.toBe(original.id);
});

test('unretained outgoing edits require a .oui backup before a valid incoming fig can replace them',async({page})=>{
 const original=await browserProject(page);await page.locator(`[data-layer-id="${original.pages[0].nodes[0].id}"]`).click();
 await page.evaluate(()=>{const timeout=window.setTimeout;window.setTimeout=((fn:TimerHandler,delay?:number,...args:any[])=>timeout(fn,delay===600?60000:delay,...args)) as typeof window.setTimeout;const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value:any,key?:IDBValidKey){if(this.name==='documents')throw new DOMException('Local project storage is full.','QuotaExceededError');return key===undefined?put.call(this,value):put.call(this,value,key);};});
 const width=page.getByRole('spinbutton',{name:'W',exact:true});await width.fill('225');await width.press('Enter');await choose(page,'Unretained candidate.fig',syntheticSceneFig());
 await expect(page.locator('.toast')).toContainText('Save a .oui backup before opening another file.');await expect(page.getByRole('dialog',{name:'Design file import report',exact:true})).toHaveCount(0);await expect(width).toHaveValue('225');expect((await library(page)).active).toBe(original.id);
 const backup=await save(page);expect(backup.id).toBe(original.id);expect(backup.pages[0].nodes[0].width).toBe(225);
 await choose(page,'Backed up candidate.fig',syntheticSceneFig());await closeReport(page);await expect(page.locator('.toast')).toContainText('Opened in memory');
});

async function nativeFig(page:Page,bytes:Uint8Array,hold=false){await page.addInitScript(({data,hold})=>{
 const w=window as any;w.figNativeReports=[];w.figNativeReady=0;w.figNativeWrites=[];
 if(hold){const Original=window.Worker;w.Worker=class extends Original{override postMessage(data:any,transfer:any){if(data?.bytes)w.releaseNativeFig=()=>super.postMessage(data,transfer);else super.postMessage(data,transfer);}};}
 w.desktop={bootstrap:async()=>({kind:'fig',name:'Native synthetic scene',data}),ready:async()=>{w.figNativeReady++;w.figReadyState=w.figNativeReports.at(-1);return true;},reportDocument:async(state:any)=>{w.figNativeReports.push(state);return true;},onCommand:()=>()=>{},onDocument:()=>()=>{},onStateRequested:(fn:any)=>{w.figNativeState=fn;return()=>{};},onSaveRequested:(fn:any)=>{w.figNativeSave=fn;return()=>{};},fonts:async()=>[],save:async(name:string,raw:string)=>{w.figNativeWrites.push({name,document:JSON.parse(raw)});return true;}};
 },{data:Buffer.from(bytes).toString('base64'),hold});await page.goto('/');}
test('native fig bootstrap reports converted document dirty before ready and saves a new .oui',async({page})=>{
 await nativeFig(page,syntheticSceneFig(),true);await expect(page.getByRole('heading',{name:'Opening document…',exact:true})).toBeVisible();await page.keyboard.press('Meta+s');expect(await page.evaluate(()=>(window as any).figNativeWrites)).toEqual([]);expect(await page.evaluate(()=>(window as any).figNativeReady)).toBe(0);
 await expect.poll(()=>page.evaluate(()=>typeof(window as any).releaseNativeFig)).toBe('function');await page.evaluate(()=>(window as any).releaseNativeFig());await closeReport(page);
 expect(await page.evaluate(()=>(window as any).figReadyState)).toMatchObject({name:'Native synthetic scene',dirty:true});expect(await page.evaluate(()=>(window as any).figNativeReady)).toBe(1);
 expect(await page.evaluate(async()=>await(window as any).figNativeSave())).toBe(true);const writes=await page.evaluate(()=>(window as any).figNativeWrites);expect(writes).toHaveLength(1);expect(writes[0].name).toBe('Native synthetic scene.oui');expect(writes[0].document.pages[0].nodes).toHaveLength(2);expect(await page.evaluate(async()=>await(window as any).figNativeState())).toMatchObject({dirty:false});
});
test('invalid native fig bootstrap never acknowledges ready or exposes editable sample artwork',async({page})=>{
 await nativeFig(page,new Uint8Array([1,2,3]));await expect(page.getByRole('heading',{name:'The project could not be opened.',exact:true})).toBeVisible();await expect(page.locator('.app')).toHaveCount(0);await page.keyboard.press('Meta+s');expect(await page.evaluate(()=>(window as any).figNativeReady)).toBe(0);expect(await page.evaluate(()=>(window as any).figNativeWrites)).toEqual([]);
});
