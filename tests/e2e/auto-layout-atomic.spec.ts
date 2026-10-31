import {expect,test,type Page} from '@playwright/test';
import fs from 'node:fs/promises';
import {autoLayoutFixture} from '../helpers/auto-layout-fixture';

async function load(page:Page,kind:Parameters<typeof autoLayoutFixture>[0],nested=false,native=false){
 const d=autoLayoutFixture(kind,nested);
 await page.addInitScript(({d,native})=>{
  localStorage.setItem('oui-active',JSON.stringify(d));
  // Exercise the existing App onCommand adapter without claiming an AppKit run.
  if(native)(window as any).desktop={onDocument:()=>()=>{},onCommand:(callback:(id:string)=>void)=>{(window as any).testNativeCommand=callback;return()=>{};}};
 },{d,native});
 await page.goto('/');await expect(page.getByRole('menubar')).toBeVisible();
 await expect.poll(()=>page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts');return useEditor.getState().fontRevision;})).toBeGreaterThan(0);
}
async function select(page:Page,ids:string[]){for(const [i,id] of ids.entries())await page.locator(`[data-layer-id="${id}"]`).click({modifiers:i?['Shift']:[]});await page.locator('#forma-design-canvas').focus();}
async function snapshot(page:Page){return page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts'),s=useEditor.getState();return {doc:s.doc,selection:s.selection,past:s.past.length,future:s.future.length};});}
async function invoke(page:Page,route:'keyboard'|'additional'|'native-menu-adapter'){
 if(route==='native-menu-adapter')await page.evaluate(()=>(window as any).testNativeCommand('auto-layout'));
 else{if(route==='additional')await page.evaluate(async()=>{const {updateKeyboardPreferences}=await import('/src/keyboard-preferences.ts'),{commands}=await import('/src/commands.ts');updateKeyboardPreferences({additional:{'auto-layout':'⌥⇧⌘Y'}},commands);});await page.keyboard.press(route==='keyboard'?'Shift+a':'Meta+Alt+Shift+y');}
}
for(const kind of ['nib','text-path'] as const)for(const route of ['keyboard','additional','native-menu-adapter'] as const)test(`${kind} refuses ${route} auto layout without a partial wrapper or Undo entry`,async({page})=>{
 const nested=route==='native-menu-adapter';await load(page,kind,nested,nested);await select(page,route==='keyboard'?['special']:[nested?'container':'special','other']);const before=await snapshot(page);await invoke(page,route);await expect(page.getByRole('status').filter({hasText:'automatic layout'})).toBeVisible();expect(await snapshot(page)).toEqual(before);
});
test('ordinary Shift+A lays out the real children, saves one complete frame and undoes in one step',async({page})=>{
 await load(page,'ordinary');await select(page,['special','other']);const before=await snapshot(page);await invoke(page,'keyboard');const after=await snapshot(page);expect(after.past).toBe(before.past+1);const parent=after.doc.pages[0].nodes.find(n=>n.id===after.selection[0])!,a=after.doc.pages[0].nodes.find(n=>n.id==='special')!,b=after.doc.pages[0].nodes.find(n=>n.id==='other')!;expect(parent.layout).toBe('horizontal');expect(a.parentId).toBe(parent.id);expect(b.parentId).toBe(parent.id);expect(b.x-a.x-a.width).toBe(parent.gap);expect(a.y).toBe(b.y);const wait=page.waitForEvent('download');await page.keyboard.press('Meta+s');const raw=await fs.readFile((await(await wait).path())!,'utf8');expect(JSON.parse(raw).pages).toEqual(after.doc.pages);await page.keyboard.press('Meta+z');const undone=await snapshot(page);expect(undone.doc).toEqual(before.doc);expect(undone.past).toBe(before.past);await page.keyboard.press('Meta+Shift+z');expect((await snapshot(page)).doc).toEqual(after.doc);
});
test('ordinary grouping stays separate from auto layout, and menu adapter layout is a single transaction',async({page})=>{
 await load(page,'ordinary',false,true);await select(page,['special','other']);const before=await snapshot(page);await page.keyboard.press('Meta+g');let after=await snapshot(page);expect(after.doc.pages[0].nodes.find(n=>n.id===after.selection[0])!.layout).toBe('none');expect(after.past).toBe(before.past+1);await page.keyboard.press('Meta+z');expect((await snapshot(page)).doc).toEqual(before.doc);await select(page,['special','other']);await invoke(page,'native-menu-adapter');after=await snapshot(page);expect(after.past).toBe(before.past+1);expect(after.doc.pages[0].nodes.find(n=>n.id===after.selection[0])!.layout).toBe('horizontal');await page.keyboard.press('Meta+z');expect((await snapshot(page)).doc).toEqual(before.doc);
});
