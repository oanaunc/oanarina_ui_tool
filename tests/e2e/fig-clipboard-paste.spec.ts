import {test,expect} from '@playwright/test';
import {blankDocument,node} from '../../src/model';
import {encodeMessage,encodeSchema,figCanvas} from '../helpers/fig-fixture';
import {liveMessage,liveSchema} from '../helpers/fig-live-fixture';
/** Self-authored payload in the publicly researched shape. This proves Forma's path, not that a real copy from another app decodes. */
const html=()=>{const bytes=figCanvas({schema:encodeSchema(liveSchema),message:encodeMessage(liveMessage(),liveSchema)});return `<meta charset='utf-8'><div data-buffer="<!--(copy)${Buffer.from(bytes).toString('base64')}(/copy)-->"></div>`;};
async function open(browser:any,board:any){
 const context=await browser.newContext(),doc=blankDocument();doc.fonts=[];doc.pages[0].nodes=[node('rectangle',{name:'Keep me',width:80,height:60})];await context.exposeBinding('clipboardTestRead',()=>board);
 const page=await context.newPage();await page.addInitScript((raw:string)=>{let command:any;const w=window as any;w.desktop={bootstrap:async()=>({kind:'file',raw}),ready:async()=>true,reportDocument:async()=>true,onCommand:(fn:any)=>{command=fn;w.nativeCommand=(id:string)=>command(id);return()=>{};},onDocument:()=>()=>{},fonts:async()=>[],save:async()=>true,beginClipboard:()=>{},clipboardRead:()=>w.clipboardTestRead(),clipboardWrite:async()=>true};},JSON.stringify(doc));await page.goto('/');await expect(page.locator('.layer-row')).toHaveCount(1);return {context,page};
}
const names=(page:any)=>page.evaluate(async()=>{const p='/src/store.ts';const {useEditor}=await import(p);const s=useEditor.getState();return {past:s.past.length,selection:s.selection.length,types:s.doc.pages.flatMap((p:any)=>p.nodes).map((n:any)=>n.type)};});
test('Paste decodes a .fig HTML clipboard into live layers with one Undo',async({browser})=>{
 const {context,page}=await open(browser,{kind:'fig',data:html()}),before=await names(page);await page.locator('svg.canvas').focus();await page.keyboard.press('Meta+v');await expect(page.locator('.toast[role="status"]')).toContainText('Layers pasted from the design clipboard');
 const after=await names(page);expect(after.past).toBe(before.past+1);expect(after.selection).toBeGreaterThan(0);expect(after.types).toContain('instance');expect(after.types).toContain('component');await page.keyboard.press('Meta+z');await expect.poll(async()=>(await names(page)).types).toEqual(before.types);await context.close();
});
test('Cancel terminates the held conversion worker and pastes nothing',async({browser})=>{
 const {context,page}=await open(browser,{kind:'fig',data:html()}),before=await names(page);await page.evaluate(()=>{const Native=window.Worker;window.Worker=class extends Native{override postMessage(message:any,transfer?:any){if(message?.clipboard){(window as any).heldClipboard=true;return;}super.postMessage(message,transfer);}};});
 await page.locator('svg.canvas').focus();await page.keyboard.press('Meta+v');const panel=page.getByRole('region',{name:'File import',exact:true});await expect(panel).toBeVisible();await expect.poll(()=>page.evaluate(()=>(window as any).heldClipboard)).toBe(true);await panel.getByRole('button',{name:'Cancel'}).click();await expect(panel.getByRole('heading')).toHaveText('Import cancelled');expect(await names(page)).toEqual(before);await context.close();
});
test('damaged clipboard content is refused with no document change',async({browser})=>{
 const {context,page}=await open(browser,{kind:'fig',data:'<div>AAAAAAAAAAAAAAAAAAAAAAAA</div>'}),before=await names(page);await page.locator('svg.canvas').focus();await page.keyboard.press('Meta+v');await expect(page.locator('.toast[role="status"]')).toContainText('not supported');expect(await names(page)).toEqual(before);await context.close();
});
test('a file a Mac window opens for shows Cancel, and cancelling opens nothing',async({browser})=>{
 const context=await browser.newContext(),page=await context.newPage(),doc=blankDocument();doc.name='Held open';await page.addInitScript((raw:string)=>{const w=window as any,Native=window.Worker;window.Worker=class extends Native{override postMessage(message:any,transfer?:any){if(message?.kind==='project'){w.heldOpen=true;return;}super.postMessage(message,transfer);}};w.desktop={bootstrap:async()=>({kind:'file',raw}),ready:async()=>{w.readyCalled=true;return true;},reportDocument:async()=>true,onCommand:()=>()=>{},onDocument:()=>()=>{},fonts:async()=>[]};},JSON.stringify(doc));await page.goto('/');
 const panel=page.getByRole('region',{name:'File import',exact:true});await expect(panel).toBeVisible();await expect.poll(()=>page.evaluate(()=>(window as any).heldOpen)).toBe(true);await panel.getByRole('button',{name:'Cancel'}).click();await expect(page.getByRole('heading',{name:'Import cancelled'}).first()).toBeVisible();expect(await page.evaluate(()=>(window as any).readyCalled)).toBeFalsy();await context.close();
});
