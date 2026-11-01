import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
import fs from 'node:fs/promises';
import {ro} from '../../src/i18n/ro';
import {parseDocument} from '../../src/model';

const commandRows=(page:Page)=>page.evaluate(async()=>{const {commands}=await import('/src/commands.ts' as string);return commands as readonly (readonly string[])[];});
const groups=['File','Edit','Object','Text','Arrange','Vector','View','Page','Resources','Help'];
const start=async(page:Page,language?:string)=>{if(language)await page.addInitScript(l=>{if(!sessionStorage.getItem('language-seeded')){localStorage.setItem('oui-language',l);sessionStorage.setItem('language-seeded','1');}},language);await page.goto('/');await expect(page.locator('.toolbar')).toBeVisible();};
const preferences=async(page:Page)=>{await page.keyboard.press('Meta+,');await expect(page.getByRole('dialog').first()).toBeVisible();};
const canvasBox=(page:Page)=>page.evaluate(()=>{const stage=document.querySelector('.canvas-wrap')!.getBoundingClientRect(),art=document.querySelector('.canvas-wrap [data-node-id],.canvas-wrap svg g')!.getBoundingClientRect();return {x:Math.round(art.left-stage.left),y:Math.round(art.top-stage.top),w:Math.round(art.width),h:Math.round(art.height)};});

test('English stays the default with unchanged menu text',async({page})=>{
 await start(page);const commands=await commandRows(page);await expect(page.locator('html')).toHaveAttribute('lang','en');await expect(page.locator('html')).toHaveAttribute('dir','ltr');
 expect(await page.evaluate(()=>localStorage.getItem('oui-language'))).toBeNull();
 for(const group of groups){await page.getByRole('menuitem',{name:group,exact:true}).click();const shown=await page.getByRole('menu',{name:group}).locator('[role^=menuitem] span').allInnerTexts(),expected=commands.filter(c=>c[2]===group).map(c=>c[1]);for(const label of expected)expect(shown).toContain(label);await page.keyboard.press('Escape');}
});
test('choosing Romanian translates every menu, persists, and leaves the project alone',async({page})=>{
 await start(page);const commands=await commandRows(page),before=await page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts' as string),s=useEditor.getState();return {updated:s.doc.updatedAt,past:s.past.length};});
 await preferences(page);const language=page.getByRole('combobox',{name:'Interface language'});await language.selectOption('ro');
 await expect(page.locator('html')).toHaveAttribute('lang','ro');await expect(page.getByRole('combobox',{name:'Limba interfeței'})).toHaveValue('ro');await expect(page.getByRole('heading',{name:'Preferințe'})).toBeVisible();await page.keyboard.press('Escape');
 const translations=new Set(Object.values(ro).filter((v):v is string=>typeof v==='string'));
 for(const group of groups){const name=ro[group as keyof typeof ro] as string;await page.getByRole('menuitem',{name,exact:true}).click();const shown=(await page.getByRole('menu',{name}).locator('[role^=menuitem]').allInnerTexts()).map(text=>text.split('\n')[0].trim());expect(shown.length).toBeGreaterThan(0);const english=commands.filter(c=>c[2]===group).map(c=>c[1]);expect(shown.filter(label=>english.includes(label)&&!translations.has(label)&&label!=='Paste over selection'),group).toEqual([]);await page.keyboard.press('Escape');}
 await expect(page.getByRole('toolbar',{name:'Instrumente de design'})).toBeVisible();await expect(page.getByRole('button',{name:'Instrumentul Dreptunghi',exact:true})).toBeVisible();
 const after=await page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts' as string),s=useEditor.getState();return {updated:s.doc.updatedAt,past:s.past.length};});expect(after).toEqual(before);
 const save=page.waitForEvent('download');await page.keyboard.press('Meta+s');const raw=await fs.readFile((await(await save).path())!,'utf8');expect(raw).not.toContain('oui-language');expect(parseDocument(raw).name).toBeTruthy();
 await page.reload();await expect(page.getByRole('menuitem',{name:'Fișier',exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang','ro');
});
test('claimed Romanian surfaces show no untranslated catalog string',async({page})=>{
 await start(page,'ro');const leftovers=(root:string)=>page.evaluate(([selector,catalog])=>{const el=[...document.querySelectorAll(selector)].at(-1)!,english=new Set(catalog),found=new Set<string>(),walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);for(let node=walker.nextNode();node;node=walker.nextNode()){const text=node.textContent?.trim();if(text&&english.has(text)&&node.parentElement?.getClientRects().length)found.add(text);}for(const item of el.querySelectorAll('[aria-label],[title],[placeholder]'))for(const name of ['aria-label','title','placeholder']){const text=item.getAttribute(name);if(text&&english.has(text))found.add(text);}return [...found];},[root,Object.entries(ro).filter(([key,value])=>key!==value&&typeof value==='string').map(([key])=>key)] as const);
 const open=(modal:string|null)=>page.evaluate(async m=>{const {useEditor}=await import('/src/store.ts' as string);useEditor.getState().set({modal:m});},modal);
 expect(await leftovers('.menubar')).toEqual([]);expect(await leftovers('.toolbar')).toEqual([]);expect(await leftovers('.topbar')).toEqual([]);
 for(const modal of ['preferences','actions','shortcuts','file-info','text-search','keyboard-insert','selection-box','about','colors','snapshot']){await open(modal);await expect(page.locator('[role=dialog][aria-modal=true]').last()).toBeVisible();expect(await leftovers('[role=dialog][aria-modal=true]'),modal).toEqual([]);await open(null);}
 await page.getByRole('button',{name:'Înapoi la fișiere'}).click();await expect(page.getByRole('heading',{name:'Ideile bune încep aici.'})).toBeVisible();expect(await leftovers('.home')).toEqual([]);
});
test('malformed stored language falls back to English',async({page})=>{await start(page,'klingon');await expect(page.getByRole('menuitem',{name:'File',exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang','en');});
test('follow system resolves the browser language',async({browser})=>{const context=await browser.newContext({locale:'ro-RO',viewport:{width:1512,height:982}}),page=await context.newPage();await start(page,'system');await expect(page.getByRole('menuitem',{name:'Fișier',exact:true})).toBeVisible();await context.close();});
test('a language change in another window applies here',async({page})=>{await start(page);await page.evaluate(()=>{localStorage.setItem('oui-language','ro');window.dispatchEvent(new StorageEvent('storage',{key:'oui-language'}));});await expect(page.getByRole('menuitem',{name:'Fișier',exact:true})).toBeVisible();});
test('reset preferences returns to English',async({page})=>{await start(page,'ro');await preferences(page);await page.getByRole('button',{name:'Resetează preferințele',exact:true}).click();await expect(page.getByRole('menuitem',{name:'File',exact:true})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang','en');expect(await page.evaluate(()=>localStorage.getItem('oui-language'))).toBeNull();});
test('Romanian formats dates, numbers and decimal input',async({page})=>{
 await start(page,'ro');await expect(page.getByRole('combobox',{name:'Zoom pe pânză'}).locator('option',{hasText:'100'}).first()).toHaveText('100 %');
 await page.getByRole('treeitem',{name:'Mobile vase',exact:true}).click();const width=page.getByRole('spinbutton',{name:'W',exact:true});await width.fill('134,5');await width.press('Enter');await expect(width).toHaveValue('134,5');
 expect(await page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts' as string),s=useEditor.getState();return s.doc.pages.find((p:{id:string})=>p.id===s.pageId).nodes.find((n:{id:string})=>n.id===s.selection[0]).width;})).toBe(134.5);
 
 await preferences(page);await expect(page.locator('[data-locale-sample]')).toContainText('1.234,5');await expect(page.locator('[data-locale-sample]')).toContainText(/\d+ (ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie) \d{4}/);await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Înapoi la fișiere'}).click();await expect(page.getByRole('heading',{name:'Ideile bune încep aici.'})).toBeVisible();await expect(page.getByRole('navigation',{name:'Fișiere locale'})).toBeVisible();const stamp=await page.locator('time').first().innerText();expect(stamp).toMatch(/^\d{1,2}\.\d{2}\.\d{4}, \d{1,2}:\d{2}/);
});
test('right-to-left mirrors the chrome and never the canvas',async({page})=>{
 await start(page);await page.waitForTimeout(300);const english=await canvasBox(page),leftBefore=await page.locator('.sidebar-slot-left').boundingBox();
 await page.evaluate(()=>{localStorage.setItem('oui-language','ar');window.dispatchEvent(new StorageEvent('storage',{key:'oui-language'}));});
 await expect(page.locator('html')).toHaveAttribute('dir','rtl');await expect(page.locator('html')).toHaveAttribute('lang','ar');await expect(page.getByRole('menuitem',{name:'ملف',exact:true})).toBeVisible();
 const left=await page.locator('.sidebar-slot-left').boundingBox(),right=await page.locator('.sidebar-slot-right').boundingBox(),viewport=page.viewportSize()!;expect(leftBefore!.x).toBeLessThan(10);expect(left!.x+left!.width).toBeGreaterThan(viewport.width-10);expect(right!.x).toBeLessThan(10);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.locator('.canvas-wrap').evaluate(el=>getComputedStyle(el).direction)).toBe('ltr');const mirrored=await canvasBox(page);expect(mirrored).toEqual(english);
 const file=page.getByRole('menuitem',{name:'ملف',exact:true});await file.click();const menu=await page.getByRole('menu',{name:'ملف'}).boundingBox();expect(menu!.x).toBeGreaterThanOrEqual(0);expect(menu!.x+menu!.width).toBeLessThanOrEqual(viewport.width);await page.keyboard.press('Escape');
 await file.focus();await page.keyboard.press('ArrowLeft');await expect(page.getByRole('menuitem',{name:'تحرير',exact:true})).toBeFocused();await page.keyboard.press('ArrowRight');await expect(file).toBeFocused();
 const move=page.getByRole('button',{name:'أداة النقل'});await move.focus();await page.keyboard.press('ArrowLeft');await expect(move).not.toBeFocused();const next=await page.evaluate(()=>(document.activeElement as HTMLElement).getBoundingClientRect().left),base=(await move.boundingBox())!.x;expect(next).toBeLessThan(base);
 const resize=page.getByRole('separator').first();await resize.focus();const width=(await page.locator('.sidebar-slot-left').boundingBox())!.width;await page.keyboard.press('ArrowLeft');await expect.poll(async()=>(await page.locator('.sidebar-slot-left').boundingBox())!.width).toBeGreaterThan(width);
 await page.evaluate(()=>{localStorage.removeItem('oui-language');window.dispatchEvent(new StorageEvent('storage',{key:'oui-language'}));});await expect(page.locator('html')).toHaveAttribute('dir','ltr');expect(await canvasBox(page)).toEqual(english);
});
