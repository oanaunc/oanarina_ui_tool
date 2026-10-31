import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';

const start=async(page:Page)=>{await page.goto('/');await expect(page.getByRole('toolbar',{name:'Design tools'})).toBeVisible();await page.waitForTimeout(150);};
const region=(page:Page)=>page.evaluate(()=>{const el=document.activeElement!;return el.closest('.menubar')?'menubar':el.closest('.sidebar-slot-left,.sidebar-resizer-left')?'left':el.closest('.toolbar')?'toolbar':el.closest('.canvas-wrap')?'canvas':el.closest('.sidebar-slot-right,.sidebar-resizer-right')?'right':el.closest('.topbar')?'topbar':el===document.body?'body':'other:'+el.className;});

test('F6 cycles editor regions in both directions and stays out of dialogs',async({page})=>{
 await start(page);const order=['menubar','left','canvas','toolbar','right'];const seen:string[]=[];
 for(let i=0;i<6;i++){await page.keyboard.press('F6');seen.push(await region(page));}
 expect(seen).toEqual([...order,'menubar']);
 await page.keyboard.press('Shift+F6');expect(await region(page)).toBe('right');await page.keyboard.press('Shift+F6');expect(await region(page)).toBe('toolbar');
 await page.keyboard.press('Meta+,');await expect(page.getByRole('dialog').first()).toBeVisible();await page.keyboard.press('F6');expect(await page.evaluate(()=>!!document.activeElement?.closest('[role=dialog]'))).toBe(true);
});
test('F6 reaches the Slides workspace',async({page})=>{
 await start(page);await page.getByRole('menuitem',{name:'File',exact:true}).click();await page.getByRole('menuitem',{name:'New presentation'}).click();await expect(page.getByRole('region',{name:'Slides workspace'})).toBeVisible();
 await page.keyboard.press('F6');await page.keyboard.press('F6');expect(await page.evaluate(()=>!!document.activeElement?.closest('.slides-workspace'))).toBe(true);await page.keyboard.press('F6');expect(await page.evaluate(()=>!!document.activeElement?.closest('.menubar'))).toBe(true);
});
test('F6 skips a collapsed sidebar',async({page})=>{
 await start(page);await page.getByRole('button',{name:'Hide layers sidebar'}).click();const seen:string[]=[];for(let i=0;i<4;i++){await page.keyboard.press('F6');seen.push(await region(page));}expect(seen).not.toContain('left');
});
test('the menu bar is one tab stop with arrow, Home, End and Escape keys',async({page})=>{
 await start(page);await page.keyboard.press('F6');const file=page.getByRole('menuitem',{name:'File',exact:true}),edit=page.getByRole('menuitem',{name:'Edit',exact:true}),help=page.getByRole('menuitem',{name:'Help',exact:true});await expect(file).toBeFocused();
 expect(await page.locator('[data-menu-group][tabindex="0"]').count()).toBe(1);
 await page.keyboard.press('ArrowRight');await expect(edit).toBeFocused();await page.keyboard.press('End');await expect(help).toBeFocused();await page.keyboard.press('ArrowRight');await expect(file).toBeFocused();await page.keyboard.press('ArrowLeft');await expect(help).toBeFocused();await page.keyboard.press('Home');await expect(file).toBeFocused();
 await page.keyboard.press('ArrowDown');const menu=page.getByRole('menu',{name:'File'});await expect(menu).toBeVisible();const items=menu.locator('[role^=menuitem]:not([disabled])');await expect(items.first()).toBeFocused();await page.keyboard.press('ArrowDown');await expect(items.nth(1)).toBeFocused();await page.keyboard.press('End');await expect(items.last()).toBeFocused();await page.keyboard.press('ArrowDown');await expect(items.first()).toBeFocused();await page.keyboard.press('ArrowUp');await expect(items.last()).toBeFocused();
 await page.keyboard.press('ArrowRight');await expect(page.getByRole('menu',{name:'Edit'})).toBeVisible();await expect(page.getByRole('menu',{name:'Edit'}).locator('[role^=menuitem]').first()).toBeFocused();
 await page.keyboard.press('Escape');await expect(page.getByRole('menu',{name:'Edit'})).toHaveCount(0);await expect(edit).toBeFocused();
 await page.keyboard.press('Enter');await expect(page.getByRole('menu',{name:'Edit'})).toBeVisible();await page.keyboard.press('ArrowDown');await page.keyboard.press('Tab');await expect(page.getByRole('menu',{name:'Edit'})).toHaveCount(0);
});
test('activating a menu item by keyboard runs its command',async({page})=>{
 await start(page);await page.keyboard.press('F6');await page.keyboard.press('ArrowDown');await page.keyboard.press('ArrowUp');await expect(page.getByRole('menuitem',{name:/^Preferences/})).toBeFocused();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Preferences'})).toBeVisible();
});
test('Tab order follows the screen, and F6 leaves the canvas where Tab selects siblings',async({page})=>{
 await start(page);const seen:string[]=[];
 for(let i=0;i<300;i++){await page.keyboard.press('Tab');const now=await region(page);if(seen.at(-1)!==now)seen.push(now);if(now==='canvas')break;}
 expect(seen).toEqual(['topbar','menubar','left','canvas']);
 await page.keyboard.press('Tab');expect(await region(page)).toBe('canvas');await page.keyboard.press('F6');expect(await region(page)).toBe('toolbar');await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:/^Help for/})).toBeFocused();await page.keyboard.press('Tab');expect(await region(page)).toBe('right');
 await page.keyboard.press('Shift+Tab');await page.keyboard.press('Shift+Tab');expect(await region(page)).toBe('toolbar');
});
test('focusing a titled control shows a described tooltip that Escape dismisses',async({page})=>{
 await start(page);await page.keyboard.press('F6');await page.keyboard.press('F6');await page.keyboard.press('F6');await page.keyboard.press('F6');
 const move=page.getByRole('button',{name:'Move tool',exact:true});await expect(move).toBeFocused();const tip=page.getByRole('tooltip');await expect(tip).toBeVisible();await expect(tip).toHaveText('Move · V');await expect(move).toHaveAccessibleDescription('Move · V');
 const box=await tip.boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual((await move.boundingBox())!.y);
 const before=await page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts' as string);return useEditor.getState().selection;});await page.keyboard.press('Escape');await expect(tip).toHaveCount(0);await expect(move).toBeFocused();expect(await page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts' as string);return useEditor.getState().selection;})).toEqual(before);await expect(move).not.toHaveAttribute('aria-describedby');
 await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');await expect(tip).toBeVisible();
 await page.mouse.click(700,300);await expect(tip).toHaveCount(0);await page.getByRole('button',{name:'Frame tool',exact:true}).hover();await page.getByRole('button',{name:'Frame tool',exact:true}).click();await expect(tip).toHaveCount(0);
});
test('a failed project open is announced assertively',async({page})=>{
 await start(page);await page.waitForTimeout(500);const chooser=page.waitForEvent('filechooser');await page.keyboard.press('Meta+o');await (await chooser).setFiles({name:'broken.oui',mimeType:'application/json',buffer:Buffer.from('{not json')});
 await expect.poll(()=>page.locator('[data-error-announcer]').textContent()).not.toBe('');await expect(page.locator('.toast')).toBeVisible();
});
test('keyboard alone edits layer properties with Undo',async({page})=>{
 await start(page);const layer=page.getByRole('treeitem',{name:'Mobile card',exact:true});await layer.focus();await page.keyboard.press('Enter');
 const state=()=>page.evaluate(async()=>{const {useEditor}=await import('/src/store.ts' as string),s=useEditor.getState(),n=s.doc.pages.find((p:{id:string})=>p.id===s.pageId).nodes.find((n:{name:string})=>n.name==='Mobile card');return s.selection.length?{x:n.x,width:n.width,fill:n.fill}:{x:n.x,width:n.width,fill:n.fill};});
 await expect.poll(state).not.toBeNull();const before=await state();
 const x=page.getByRole('spinbutton',{name:'X',exact:true});await x.focus();await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');await expect.poll(async()=>(await state())!.x).toBe(before!.x+1);
 const width=page.getByRole('spinbutton',{name:'W',exact:true});await width.focus();await page.keyboard.press('ControlOrMeta+a');await page.keyboard.type('140*2');await page.keyboard.press('Enter');await expect.poll(async()=>(await state())!.width).toBe(280);
 const hex=page.getByRole('textbox',{name:'Fill 1 color value'});await hex.focus();await page.keyboard.press('ControlOrMeta+a');await page.keyboard.type('#123456');await page.keyboard.press('Enter');await expect.poll(async()=>(await state())!.fill).toBe('#123456');
 await page.getByRole('slider',{name:/Fill 1 saturation and brightness/}).focus();await page.keyboard.press('ArrowRight');await expect.poll(async()=>(await state())!.fill).not.toBe('#123456');
 await page.keyboard.press('Meta+z');await expect.poll(async()=>(await state())?.fill).toBe('#123456');
});
test('keyboard alone exports through the dialog',async({page})=>{
 await start(page);await page.keyboard.press('Meta+Shift+e');const dialog=page.getByRole('dialog').first();await expect(dialog).toBeVisible();const download=page.waitForEvent('download');let pressed=false;
 for(let i=0;i<60&&!pressed;i++){await page.keyboard.press('Tab');const label=await page.evaluate(()=>document.activeElement?.textContent?.trim()??'');if(/^Export( |$)/.test(label)){await page.keyboard.press('Enter');pressed=true;}}
 expect(pressed).toBe(true);expect((await download).suggestedFilename()).toMatch(/\.(svg|png|jpg|zip)$/);
});
test('selection and active states do not rely on color alone',async({page})=>{
 await start(page);const shape=(selector:string)=>page.locator(selector).first().evaluate(el=>{const s=getComputedStyle(el),a=getComputedStyle(el,'::after');return [s.boxShadow,a.content!=='none'&&a.content!=='normal'?a.height:'',s.textDecorationLine,s.outlineStyle].join('|');});
 expect(await shape('.toolbar [aria-pressed=true]')).not.toBe(await shape('.toolbar [aria-pressed=false]'));
 await page.getByRole('treeitem',{name:'Mobile vase',exact:true}).click();expect(await shape('.layer-row.selected')).not.toBe(await shape('.layer-row:not(.selected)'));
 expect(await shape('.page-row.active')).not.toBe(await shape('.page-row:not(.active)'));
 await page.getByRole('menuitem',{name:'File',exact:true}).click();expect(await shape('.menu-container>button.active')).not.toBe(await shape('.menu-container>button:not(.active)'));await page.keyboard.press('Escape');
 await expect(page.getByRole('button',{name:'Design',exact:true})).toHaveAttribute('aria-current','true');await expect(page.getByRole('button',{name:'File',exact:true})).toHaveAttribute('aria-current','true');
});
test('accent and contrast preferences persist and restyle the chrome only',async({page})=>{
 await start(page);await page.keyboard.press('Meta+,');const accent=page.getByRole('combobox',{name:'Accent color'}),contrast=page.getByRole('combobox',{name:'Interface contrast'});await accent.selectOption('green');await expect(page.locator('html')).toHaveAttribute('data-accent','green');await contrast.selectOption('more');await expect(page.locator('html')).toHaveAttribute('data-contrast','more');
 expect(await page.locator('.app').evaluate(el=>getComputedStyle(el).getPropertyValue('--focus-ring').trim())).toBe('#fff');await page.keyboard.press('Escape');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-accent','green');await expect(page.locator('html')).toHaveAttribute('data-contrast','more');
 expect(await page.locator('.toolbar .active').first().evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(230, 212, 255)');
 await page.keyboard.press('Meta+,');await page.getByRole('combobox',{name:'Interface contrast'}).selectOption('standard');await expect(page.locator('html')).not.toHaveAttribute('data-contrast','more');expect(await page.locator('.toolbar .active').first().evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(127, 217, 155)');
 await page.getByRole('button',{name:'Reset preferences'}).click();await expect(page.locator('html')).not.toHaveAttribute('data-accent','green');expect(await page.evaluate(()=>[localStorage.getItem('oui-interface-accent'),localStorage.getItem('oui-interface-contrast')])).toEqual([null,null]);
});
test('system increased contrast applies until overridden',async({browser})=>{
 const context=await browser.newContext({contrast:'more'} as never),page=await context.newPage();await start(page);await expect(page.locator('html')).toHaveAttribute('data-contrast','more');await page.evaluate(()=>{localStorage.setItem('oui-interface-contrast','standard');window.dispatchEvent(new StorageEvent('storage',{key:'oui-interface-contrast'}));});await expect(page.locator('html')).not.toHaveAttribute('data-contrast','more');await context.close();
});
