import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {blankDocument,node} from '../../src/model';
import {PANEL_LAYOUT_KEY} from '../../src/panel-layout';
import {PAGE_VIEWPORT_KEY} from '../../src/page-viewports';

async function open(page:Page,options:{cache?:string;denyRead?:boolean;denyWrite?:boolean}={}){
 const doc=blankDocument();doc.name='Sidebar fixture';doc.fonts=[];doc.pages[0].nodes=[node('rectangle',{name:'Unchanged artwork',x:100,y:100,width:200,height:160})];
 const saves:string[]=[];await page.exposeFunction('sidebarSave',(raw:string)=>{saves.push(raw);return true;});
 await page.addInitScript(({doc,key,cameraKey,options})=>{
  const w=window as any;if(options.cache!==undefined)localStorage.setItem(key,options.cache);
  localStorage.setItem(cameraKey,JSON.stringify({version:1,views:[{documentId:doc.id,pageId:doc.pages[0].id,zoom:.7,pan:{x:12,y:16},updatedAt:Date.now()}],lastPages:[{documentId:doc.id,pageId:doc.pages[0].id,updatedAt:Date.now()}]}));
  const read=Storage.prototype.getItem,write=Storage.prototype.setItem;w.sidebarWrites=0;
  Storage.prototype.getItem=function(name){if(name===key&&options.denyRead)throw Error('Denied');return read.call(this,name);};
  Storage.prototype.setItem=function(name,value){if(name===key){w.sidebarWrites++;if(options.denyWrite)throw Error('Denied');}return write.call(this,name,value);};
  w.sidebarReports=[];w.desktop={bootstrap:async()=>({kind:'file',raw:JSON.stringify(doc)}),ready:async()=>true,fonts:async()=>[],reportDocument:async(value:any)=>{w.sidebarReports.push(value);return true;},onCommand:(fn:any)=>{w.sidebarCommand=fn;return()=>{};},onDocument:(fn:any)=>{w.sidebarOpen=fn;return()=>{};},save:async(_name:string,raw:string)=>w.sidebarSave(raw)};
 },{doc,key:PANEL_LAYOUT_KEY,cameraKey:PAGE_VIEWPORT_KEY,options});
 await page.goto('/');await expect(page.getByRole('treeitem',{name:'Unchanged artwork',exact:true})).toBeVisible();return{doc,saves};
}
const layers=(page:Page)=>page.getByRole('separator',{name:'Resize layers sidebar',exact:true});
const properties=(page:Page)=>page.getByRole('separator',{name:'Resize properties sidebar',exact:true});
async function width(page:Page,side:'left'|'right'){return page.locator('.sidebar-slot-'+side).evaluate(element=>Math.round(element.getBoundingClientRect().width));}
async function command(page:Page,id:string){await page.evaluate(id=>(window as any).sidebarCommand(id),id);}
async function save(page:Page,saves:string[]){const before=saves.length;await command(page,'save');await expect.poll(()=>saves.length).toBe(before+1);return JSON.parse(saves.at(-1)!);}
async function drag(page:Page,side:'left'|'right',dx:number){const box=await(side==='left'?layers(page):properties(page)).boundingBox();await page.mouse.move(box!.x+box!.width/2,box!.y+100);await page.mouse.down();await page.mouse.move(box!.x+box!.width/2+dx,box!.y+100);}

test('keyboard resize, collapse and reset persist locally without project/history/camera changes',async({page})=>{
 const {doc,saves}=await open(page);const camera=await page.locator('svg.canvas > g[transform]').getAttribute('transform');
 expect(await width(page,'left')).toBe(232);expect(await width(page,'right')).toBe(251);
 await layers(page).focus();await page.keyboard.press('ArrowRight');expect(await width(page,'left')).toBe(240);await page.keyboard.press('Shift+ArrowRight');expect(await width(page,'left')).toBe(272);await page.keyboard.press('Home');expect(await width(page,'left')).toBe(160);await page.keyboard.press('End');expect(await width(page,'left')).toBe(480);
 const savedCount=saves.length;await page.keyboard.press('Meta+s');await expect.poll(()=>saves.length).toBe(savedCount+1);await properties(page).focus();await page.keyboard.press('ArrowLeft');expect(await width(page,'right')).toBe(259);await page.keyboard.press('ArrowRight');expect(await width(page,'right')).toBe(251);
 await page.getByRole('button',{name:'Hide layers sidebar',exact:true}).click();await expect(page.getByRole('button',{name:'Show layers sidebar',exact:true})).toBeFocused();await expect(page.locator('.left-panel')).toBeHidden();await page.keyboard.press('Enter');expect(await width(page,'left')).toBe(480);
 await page.getByRole('button',{name:'Hide properties sidebar',exact:true}).click();await expect(page.locator('.right-panel')).toBeHidden();await page.reload();await expect(page.getByRole('button',{name:'Show properties sidebar',exact:true})).toBeVisible();expect(await width(page,'left')).toBe(480);await page.getByRole('button',{name:'Show properties sidebar',exact:true}).click();
 expect(await page.locator('svg.canvas > g[transform]').getAttribute('transform')).toBe(camera);expect(await save(page,saves)).toEqual(doc);await command(page,'undo');expect(await save(page,saves)).toEqual(doc);expect(await page.evaluate(()=>(window as any).sidebarReports.at(-1).dirty)).toBe(false);
 await page.getByRole('menuitem',{name:'View',exact:true}).click();await page.getByRole('menuitem',{name:'Reset sidebar layout',exact:true}).click();expect(await width(page,'left')).toBe(232);expect(await width(page,'right')).toBe(251);
});

test('pointer resizing commits once and Escape, pointercancel, blur and document context changes cancel',async({page})=>{
 await open(page);expect(await page.evaluate(()=>(window as any).sidebarWrites)).toBe(0);
 await drag(page,'left',90);expect(await width(page,'left')).toBe(322);expect(await page.evaluate(()=>(window as any).sidebarWrites)).toBe(0);await page.keyboard.press('Escape');await page.mouse.up();expect(await width(page,'left')).toBe(232);
 await drag(page,'left',70);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.mouse.up();expect(await width(page,'left')).toBe(232);
 await drag(page,'left',80);await layers(page).dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();expect(await width(page,'left')).toBe(232);
 await drag(page,'right',-60);expect(await width(page,'right')).toBe(311);await page.mouse.up();expect(await page.evaluate(()=>(window as any).sidebarWrites)).toBe(1);
 await drag(page,'left',100);await command(page,'page');await page.mouse.up();expect(await width(page,'left')).toBe(232);expect(await page.evaluate(()=>(window as any).sidebarWrites)).toBe(1);
 await drag(page,'left',100);await command(page,'preferences');await page.mouse.up();expect(await width(page,'left')).toBe(232);await page.keyboard.press('Escape');
});

test('desired widths survive viewport clamping; mobile overlay and hidden UI stay reachable',async({page})=>{
 await open(page);await layers(page).focus();await page.keyboard.press('End');await properties(page).focus();await page.keyboard.press('End');
 await page.setViewportSize({width:730,height:800});await expect.poll(()=>width(page,'left')).toBeLessThan(480);const canvas=await page.locator('svg.canvas').boundingBox();expect(canvas!.width).toBeGreaterThanOrEqual(239);await page.setViewportSize({width:1512,height:982});await expect.poll(()=>width(page,'left')).toBe(480);expect(await width(page,'right')).toBe(480);
 await command(page,'toggle-right-sidebar');await page.setViewportSize({width:390,height:844});await expect(layers(page)).toHaveCount(0);await expect(page.locator('.right-panel')).toBeHidden();await page.getByRole('button',{name:'Toggle properties',exact:true}).click();await expect(page.locator('.right-panel')).toBeVisible();const bounds=await page.locator('.sidebar-slot-right').boundingBox();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(390);await page.getByRole('button',{name:'Hide properties sidebar',exact:true}).click();await expect(page.getByRole('button',{name:'Toggle properties',exact:true})).toBeFocused();
 await command(page,'toggle-right-sidebar');await expect(page.locator('.right-panel')).toBeVisible();await command(page,'toggle-right-sidebar');await expect(page.locator('.right-panel')).toBeHidden();await page.getByRole('button',{name:'Hide layers sidebar',exact:true}).click();await page.getByRole('button',{name:'Show layers sidebar',exact:true}).click();
 await command(page,'toggle-ui');await expect(page.locator('.sidebar-slot-left')).toBeHidden();await expect(page.locator('.sidebar-resizer')).toHaveCount(0);await page.getByRole('button',{name:'Show UI',exact:true}).click();await expect(page.locator('.left-panel')).toBeVisible();
 await page.setViewportSize({width:1512,height:982});await expect(page.getByRole('button',{name:'Show properties sidebar',exact:true})).toBeVisible();expect(await width(page,'left')).toBe(480);
});

test('corrupt or denied local layout storage leaves editing usable and states the persistence limit',async({page})=>{
 await open(page,{cache:'{bad',denyWrite:true});await expect(page.getByRole('status').filter({hasText:'Saved sidebar settings could not be read'})).toBeVisible();await page.getByRole('button',{name:'Dismiss sidebar settings warning',exact:true}).click();await layers(page).focus();await page.keyboard.press('ArrowRight');expect(await width(page,'left')).toBe(240);await expect(page.getByRole('status').filter({hasText:'could not be saved on this device'})).toBeVisible();await page.getByRole('button',{name:'Hide layers sidebar',exact:true}).click();await page.getByRole('button',{name:'Show layers sidebar',exact:true}).click();await expect(page.getByRole('treeitem',{name:'Unchanged artwork',exact:true})).toBeVisible();
});

test('sidebar actions do not occupy artwork undo history or change selected artwork or its camera',async({page})=>{
 const {doc,saves}=await open(page);await page.getByRole('treeitem',{name:'Unchanged artwork',exact:true}).click();await command(page,'rotate-right');const changed=await save(page,saves);expect(changed.pages[0].nodes[0].rotation).toBe(90);const camera=await page.locator('svg.canvas > g[transform]').getAttribute('transform');
 await layers(page).focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Tab');await page.getByRole('button',{name:'Hide properties sidebar',exact:true}).click();await page.getByRole('button',{name:'Show properties sidebar',exact:true}).click();expect(await save(page,saves)).toEqual(changed);expect(await page.locator('svg.canvas > g[transform]').getAttribute('transform')).toBe(camera);await command(page,'undo');expect(await save(page,saves)).toEqual(doc);await command(page,'redo');expect(await save(page,saves)).toEqual(changed);
});

test('denied reads and writes use an ephemeral layout without preventing editing',async({page})=>{
 await open(page,{denyRead:true,denyWrite:true});await expect(page.getByRole('status').filter({hasText:'Saved sidebar settings could not be read'})).toBeVisible();await layers(page).focus();await page.keyboard.press('End');expect(await width(page,'left')).toBe(480);await expect(page.getByRole('status').filter({hasText:'could not be saved on this device'})).toBeVisible();await command(page,'toggle-left-sidebar');await expect(page.locator('.left-panel')).toBeHidden();await command(page,'toggle-left-sidebar');await expect(page.getByRole('treeitem',{name:'Unchanged artwork',exact:true})).toBeVisible();
});

test('Home and Slides keep their own layouts and unsupported sidebar actions are explicit',async({page})=>{
 await open(page);await page.getByRole('button',{name:'Open files',exact:true}).click();await expect(page.locator('.sidebar-slot')).toHaveCount(0);await command(page,'toggle-left-sidebar');await expect(page.getByRole('status').filter({hasText:'available in Design and Whiteboard'})).toBeVisible();await command(page,'new-slides');await expect(page.locator('.sidebar-slot')).toHaveCount(0);await expect(page.locator('button.present-button[aria-label="Present slides"]')).toBeVisible();await command(page,'reset-sidebar-layout');await expect(page.getByRole('status').filter({hasText:'available in Design and Whiteboard'})).toBeVisible();
});
