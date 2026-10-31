import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';

/** Names come from the browser accessibility tree, so this checks what assistive technology receives. */
const NAMED_ROLES=new Set(['button','checkbox','combobox','link','listbox','menuitem','menuitemcheckbox','menuitemradio','option','radio','searchbox','slider','spinbutton','switch','tab','textbox','treeitem','ComboBoxSelect','ComboBoxMenuButton','PopUpButton','DisclosureTriangle','ColorWell']);
async function unnamedControls(page:Page){
 const cdp=await page.context().newCDPSession(page);await cdp.send('Accessibility.enable');
 const {nodes}=await cdp.send('Accessibility.getFullAXTree'),found:string[]=[];
 for(const n of nodes){if(n.ignored||!NAMED_ROLES.has(String(n.role?.value??''))||String(n.name?.value??'').trim()||n.backendDOMNodeId===undefined)continue;const {node}=await cdp.send('DOM.describeNode',{backendNodeId:n.backendDOMNodeId,depth:0});found.push(`${n.role?.value} <${node.localName} ${(node.attributes??[]).join(' ').slice(0,100)}>`);}
 await cdp.detach();return found;
}
const openEditor=async(page:Page)=>{await page.goto('/');await expect(page.getByRole('toolbar',{name:'Design tools'})).toBeVisible();};
const setModal=(page:Page,modal:string)=>page.evaluate(async m=>{const {useEditor}=await import('/src/store.ts' as string),s=useEditor.getState(),page=s.doc.pages.find((p:{id:string})=>p.id===s.pageId),first=page.nodes.find((n:{parent?:string})=>!n.parent);s.set({selection:[first.id],modal:m});},modal);
const currentModal=(page:Page)=>page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts' as string);return useEditor.getState().modal;});
const focusState=(page:Page)=>page.evaluate(()=>{const el=document.activeElement as HTMLElement,dialog=[...document.querySelectorAll('[role=dialog][aria-modal=true]')].at(-1),style=getComputedStyle(el);return {inside:!!dialog?.contains(el),tag:el.tagName+'.'+String(el.className).slice(0,40),outline:style.outlineStyle==='none'?0:parseFloat(style.outlineWidth),shadow:style.boxShadow!=='none'};});
const dialogs=['actions','preferences','export','shortcuts','fonts','components','variables','styles','asset-usage','mcp','roadmap','figma','colors','about','release-notes','file-info','snapshot','history','comments','icons','templates','document-outline','keyboard-insert','selection-box','move-to-page','slices','text-search','local-links','local-plugins','file-cover','learning','present','rename','rename-file','rename-page','text-link'];

test('the name audit detects a real unnamed control',async({page})=>{
 await openEditor(page);await page.evaluate(()=>{const button=document.createElement('button');button.id='audit-probe';document.body.append(button);const input=document.createElement('input');document.body.append(input);});
 const found=await unnamedControls(page);expect(found.some(line=>line.includes('audit-probe'))).toBe(true);expect(found.some(line=>line.startsWith('textbox'))).toBe(true);
});
test('inspector controls have names for each selected layer type',async({page})=>{
 await openEditor(page);for(const name of ['Mobile vase','Mobile headline','Mobile · Home','Button / Primary']){const row=page.getByRole('treeitem',{name,exact:true}).first();if(await row.count()){await row.click();expect(await unnamedControls(page),name).toEqual([]);}}
});
test('editor chrome exposes a computed name for every control',async({page})=>{
 await openEditor(page);expect(await unnamedControls(page)).toEqual([]);
 await page.getByRole('button',{name:'Prototype',exact:true}).click();expect(await unnamedControls(page)).toEqual([]);
 await page.getByRole('button',{name:'Inspect',exact:true}).click();expect(await unnamedControls(page)).toEqual([]);
 await page.getByRole('button',{name:'Assets',exact:true}).click();expect(await unnamedControls(page)).toEqual([]);
});
test('Slides and whiteboard workspaces expose a computed name for every control',async({page})=>{
 await openEditor(page);await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'New whiteboard'}).click();await expect(page.getByRole('menuitem',{name:'File',exact:true})).toBeVisible();await page.waitForTimeout(150);expect(await unnamedControls(page)).toEqual([]);
 await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'New presentation'}).click();await page.waitForTimeout(250);expect(await unnamedControls(page)).toEqual([]);
});
test('every focused control in the editor chrome shows a 2px focus ring in the theme color',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('oui-theme','light'));await openEditor(page);
 for(let i=0;i<40;i++){await page.keyboard.press('Tab');const state=await page.evaluate(()=>{const el=document.activeElement!,style=getComputedStyle(el);return {name:el.tagName+'.'+String(el.className),width:style.outlineStyle==='none'?0:parseFloat(style.outlineWidth),color:style.outlineColor,parent:getComputedStyle(el.parentElement!).borderColor};});if(!state.name.includes('INPUT')||state.width){expect(state.width,state.name).toBeGreaterThanOrEqual(2);expect(state.color,state.name).toBe('rgb(10, 120, 207)');}}
});
test('home exposes a computed name for every control',async({page})=>{
 await openEditor(page);await page.getByRole('button',{name:'Back to files'}).click();
 await expect(page.getByRole('navigation',{name:'Local files'})).toBeVisible();expect(await unnamedControls(page)).toEqual([]);
});
test('every top-level menu opens to named menu items',async({page})=>{
 await openEditor(page);
 for(const group of ['File','Edit','Object','Text','Arrange','Vector','View','Page','Resources','Help']){
  await page.getByRole('menuitem',{name:group,exact:true}).click();
  const items=page.getByRole('menu',{name:group}).locator('[role^=menuitem]');
  expect(await items.count()).toBeGreaterThan(0);
  expect(await unnamedControls(page)).toEqual([]);
  await page.keyboard.press('Escape');await expect(page.getByRole('menu',{name:group})).toHaveCount(0);
 }
});
for(const modal of dialogs)test(`${modal} dialog: names, focus trap, visible focus, Escape`,async({page})=>{
 await openEditor(page);await page.getByRole('button',{name:'Search actions'}).focus();await setModal(page,modal);
 const dialog=page.locator('[role=dialog][aria-modal=true]').last();await expect(dialog).toBeVisible();
 await expect.poll(async()=>(await focusState(page)).inside,{message:'initial focus moves into the dialog'}).toBe(true);
 expect(await unnamedControls(page)).toEqual([]);
 const seen=new Set<string>();
 for(let i=0;i<(modal==='preferences'||modal==='fonts'?60:24);i++){await page.keyboard.press('Tab');const state=await focusState(page);expect(state.inside,`Tab ${i} stayed in dialog at ${state.tag}`).toBe(true);expect(state.outline>=2||state.shadow,`visible focus at ${state.tag}`).toBe(true);seen.add(state.tag);}
 await page.keyboard.press('Shift+Tab');expect((await focusState(page)).inside).toBe(true);
 await page.keyboard.press('Escape');
 await expect.poll(()=>page.locator('[role=dialog][aria-modal=true]').count(),{message:'Escape closes the dialog'}).toBe(0);
 expect(await currentModal(page)).toBeNull();
 await expect.poll(()=>page.evaluate(()=>document.activeElement!==document.body),{message:'focus returns to the page'}).toBe(true);
});
