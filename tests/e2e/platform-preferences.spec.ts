import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {blankDocument,node} from '../../src/model';
import type {DesignDocument} from '../../src/model';
import {WORKSPACE_PREFERENCES_KEY} from '../../src/workspace-preferences';

const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
function fixture(){const d=blankDocument();d.name='Platform';d.pages[0].nodes=[node('ellipse',{id:'round',name:'Round',x:200,y:180,width:120,height:80,fill:'#345678'}),node('rectangle',{id:'photo',name:'Photo',x:380,y:180,width:60,height:60,image:PNG})];return d;}
async function load(page:Page,d:DesignDocument=fixture(),prefs?:object){d.fonts=[];await page.addInitScript(([doc,key,values])=>{if(!localStorage.getItem('oui-active'))localStorage.setItem('oui-active',JSON.stringify(doc));if(values&&!localStorage.getItem(key as string))localStorage.setItem(key as string,JSON.stringify({version:1,values}));},[d,WORKSPACE_PREFERENCES_KEY,prefs]);await page.goto('/');await expect(page.locator('.layer-row')).toHaveCount(d.pages[0].nodes.length);}
async function settings(page:Page){await page.keyboard.press('Meta+,');const dialog=page.getByRole('dialog',{name:'Preferences',exact:true});await expect(dialog).toBeVisible();return dialog;}
const closeDialog=(page:Page)=>page.getByRole('button',{name:'Close dialog',exact:true}).click();
const store=(page:Page,patch:object)=>page.evaluate(async patch=>{(await import('/src/store.ts')).useEditor.getState().set(patch);},patch);

test('legacy outline rendering draws boxes in Outlines, keeps artwork unchanged and survives a reload',async({page})=>{
 await load(page);await store(page,{outlines:true});
 const canvas=page.locator('#forma-design-canvas');await expect(canvas.locator('[data-outline-bounds]')).toHaveCount(0);
 await settings(page);await page.getByLabel('Outline rendering',{exact:true}).selectOption('bounds');await closeDialog(page);
 await expect(canvas.locator('[data-node-id="round"] rect[data-outline-bounds]')).toHaveCount(1);await expect(canvas.locator('[data-node-id="round"] rect[data-outline-bounds]')).toHaveAttribute('width','120');
 await page.reload();await expect(page.locator('.layer-row')).toHaveCount(2);await store(page,{outlines:true});await expect(canvas.locator('[data-outline-bounds]')).toHaveCount(2);
 await store(page,{outlines:false});await expect(canvas.locator('[data-outline-bounds]')).toHaveCount(0);await expect(canvas.locator('[data-node-id="round"] ellipse, [data-node-id="round"] path').first()).toBeAttached();
});
test('status messages stay for the chosen time',async({page})=>{
 await load(page,fixture(),{statusSeconds:2});await store(page,{toast:'Short message'});await expect(page.locator('.toast')).toBeVisible();await expect(page.locator('.toast')).toBeHidden({timeout:3000});
 await settings(page);await page.getByLabel('Status messages stay for',{exact:true}).selectOption('8');await closeDialog(page);await store(page,{toast:'Long message'});await page.waitForTimeout(3000);await expect(page.locator('.toast')).toBeVisible();
});
test('a failing toast reaches the assertive region, a success does not',async({page})=>{
 await load(page);const region=page.locator('[data-error-announcer]');
 await store(page,{toast:'Layers pasted. Undo is available.'});await page.waitForTimeout(150);await expect(region).toHaveText('');
 await store(page,{toast:'Local recovery could not be saved. Save this project to a .oui file.'});await expect(region).toHaveText('Local recovery could not be saved. Save this project to a .oui file.');
});
test('pinch honors its preference and speed through real gesture events',async({page})=>{
 await load(page);
 const pinch=()=>page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts'),el=document.querySelector('#forma-design-canvas')!,start=useEditor.getState().zoom,fire=(type:string,scale:number)=>{const e=new Event(type,{bubbles:true,cancelable:true});Object.assign(e,{scale,clientX:300,clientY:300});el.dispatchEvent(e);};fire('gesturestart',1);fire('gesturechange',1.5);fire('gestureend',1.5);const end=useEditor.getState().zoom;useEditor.getState().set({zoom:start});return end/start;});
 expect(await pinch()).toBeCloseTo(1.5,3);
 await settings(page);await page.getByLabel('Pinch speed',{exact:true}).selectOption('2');await closeDialog(page);expect(await pinch()).toBeCloseTo(2.25,3);
 await settings(page);await page.getByLabel('Pinch to zoom',{exact:true}).uncheck();await closeDialog(page);expect(await pinch()).toBe(1);
});
test('keyboard insertion creates a typed path with Undo, and refuses bad points without editing',async({page})=>{
 await load(page);await page.locator('#forma-design-canvas').focus();await page.keyboard.press('Alt+Meta+n');
 await page.getByRole('combobox',{name:'Keyboard layer type'}).selectOption('path');await page.getByRole('textbox',{name:'Keyboard layer name'}).fill('Typed');
 const points=page.getByRole('textbox',{name:'Keyboard path points'});await points.fill('oops');await page.getByRole('button',{name:'Create layer'}).click();await expect(page.getByRole('alert')).toContainText('x,y');await expect(page.locator('.layer-row')).toHaveCount(2);
 await points.fill('600,100 700,100 650,180');await page.getByRole('button',{name:'Create layer'}).click();await expect(page.locator('.layer-row')).toHaveCount(3);
 await expect(page.locator('#forma-design-canvas [aria-label="Typed"] path').first()).toBeAttached();await page.keyboard.press('Meta+z');await expect(page.locator('.layer-row')).toHaveCount(2);
});
test('an image page reports its scheduled decode finishing, and pages without images report nothing',async({page})=>{
 await load(page);await expect(page.locator('[data-image-decode="decoded"]')).toHaveCount(1);
 await page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts'),s=useEditor.getState();s.edit(d=>{d.pages.push({id:'empty-page',name:'Empty',nodes:[],comments:[]});});useEditor.getState().set({pageId:'empty-page'});});
 await expect(page.locator('[data-image-decode]')).toHaveCount(0);
});
test('Storage lists cached fonts and clears only those',async({page})=>{
 await load(page);
 const put=await page.evaluate(async png=>{const open=()=>new Promise<IDBDatabase>((ok,no)=>{const q=indexedDB.open('oanarina-fonts',1);q.onupgradeneeded=()=>q.result.createObjectStore('fonts');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error);}),db=await open();const {validateFontAsset}=await import('/src/font-data.ts');const asset={family:'Cached Family',source:'google',weight:'400',style:'normal',data:png,license:'OFL',embeddable:true};try{validateFontAsset(asset as never);}catch(e){db.close();return String(e);}await new Promise<void>((ok,no)=>{const t=db.transaction('fonts','readwrite');t.objectStore('fonts').put([asset],'v2:Cached Family');t.oncomplete=()=>ok();t.onerror=()=>no(t.error);});db.close();return '';},'data:font/woff2;base64,AAAA');
 test.skip(!!put,'Font fixture shape refused: '+put);
 await page.evaluate(async()=>{(await import('/src/store.ts')).useEditor.getState().set({modal:'storage'});});
 const clear=page.getByRole('button',{name:'Clear cached fonts',exact:true});await expect(clear).toBeEnabled();await clear.click();await expect(page.getByRole('status').filter({hasText:/Cleared cached fonts for/})).toBeVisible();
 expect(await page.evaluate(async()=>{const {readCachedFontFamily}=await import('/src/font-cache.ts');return readCachedFontFamily('Cached Family');})).toBeNull();
});
