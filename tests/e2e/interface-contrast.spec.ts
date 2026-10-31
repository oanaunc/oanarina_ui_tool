import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';

/** Measures rendered text against its composited background. Artwork, disabled controls and decorative hidden text are exempt, as in WCAG 1.4.3. */
const audit=(page:Page)=>page.evaluate(()=>{
 const parse=(value:string)=>{const m=value.match(/rgba?\(([^)]+)\)/);if(!m)return null;const [r,g,b,a]=m[1].split(/[ ,/]+/).map(Number);return {r,g,b,a:a??1};};
 const over=(top:{r:number;g:number;b:number;a:number},under:{r:number;g:number;b:number})=>({r:top.r*top.a+under.r*(1-top.a),g:top.g*top.a+under.g*(1-top.a),b:top.b*top.a+under.b*(1-top.a)});
 const channel=(c:number)=>{const v=c/255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;},luminance=(c:{r:number;g:number;b:number})=>.2126*channel(c.r)+.7152*channel(c.g)+.0722*channel(c.b);
 const background=(el:Element|null):{r:number;g:number;b:number}|null=>{const stack:{r:number;g:number;b:number;a:number}[]=[];for(let node=el;node;node=node.parentElement){const style=getComputedStyle(node);if(style.backgroundImage!=='none')return null;const color=parse(style.backgroundColor);if(color&&color.a>0){stack.push(color);if(color.a===1)break;}}let base={r:255,g:255,b:255};for(const layer of stack.reverse())base=over(layer,base);return base;};
 const opacity=(el:Element)=>{let value=1;for(let node:Element|null=el;node;node=node.parentElement)value*=Number(getComputedStyle(node).opacity);return value;};
 const root=[...document.querySelectorAll('[role=dialog][aria-modal=true]')].at(-1)??document.querySelector('.app')!,walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),failures:string[]=[];let checked=0;
 for(let text=walker.nextNode();text;text=walker.nextNode()){
  const value=text.textContent?.trim(),el=text.parentElement;if(!value||!el||el.closest('.canvas-wrap,[aria-hidden=true],option,script,style,svg,kbd,[data-contrast-exempt]')||el.closest(':disabled,[aria-disabled=true]'))continue;
  const box=el.getBoundingClientRect(),style=getComputedStyle(el);if(!box.width||!box.height||style.visibility==='hidden'||box.bottom<0||box.top>innerHeight)continue;
  const fg=parse(style.color),bg=background(el);if(!fg||!bg)continue;const alpha=fg.a*opacity(el);if(opacity(el)<.2)continue;
  const color=over({...fg,a:alpha},bg),a=luminance(color),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05),size=parseFloat(style.fontSize),large=size>=24||size>=18.66&&Number(style.fontWeight)>=700;checked++;
  if(ratio<(large?3:4.5))failures.push(`${ratio.toFixed(2)} ${style.color} on rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}) .${String(el.className).slice(0,40)} "${value.slice(0,40)}"`);
 }
 return {checked,failures:[...new Set(failures)]};
});
const setup=async(page:Page,theme:string,contrast?:string)=>{await page.addInitScript(([t,c])=>{localStorage.setItem('oui-theme',t!);if(c)localStorage.setItem('oui-interface-contrast',c);},[theme,contrast]);await page.goto('/');await expect(page.getByRole('toolbar',{name:'Design tools'})).toBeVisible();await page.waitForTimeout(300);};
const modal=(page:Page,name:string)=>page.evaluate(async m=>{const {useEditor}=await import('/src/store.ts' as string);useEditor.getState().set({modal:m});},name);
for(const theme of ['dark','light'])for(const contrast of [undefined,'more'])test(`${theme}${contrast?' increased contrast':''}: rendered text meets 4.5:1`,async({page})=>{
 await setup(page,theme,contrast);
 const results=[await audit(page)];
 await page.getByRole('button',{name:'Prototype',exact:true}).click();results.push(await audit(page));
 await page.getByRole('button',{name:'Inspect',exact:true}).click();results.push(await audit(page));
 for(const name of ['preferences','actions','about','file-info']){await modal(page,name);await expect(page.locator('[role=dialog][aria-modal=true]').last()).toBeVisible();results.push(await audit(page));await modal(page,'');}
 await page.getByRole('menuitem',{name:'File',exact:true}).click();results.push(await audit(page));await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Back to files'}).click();await expect(page.getByRole('navigation',{name:'Local files'})).toBeVisible();await page.waitForTimeout(150);results.push(await audit(page));
 expect(results.reduce((sum,r)=>sum+r.checked,0)).toBeGreaterThan(200);
 expect([...new Set(results.flatMap(r=>r.failures))]).toEqual([]);
});
for(const theme of ['dark','light'])test(`${theme}: rendered text meets 4.5:1 across other dialogs and on hover`,async({page})=>{
 test.setTimeout(120_000);await setup(page,theme);const results=[];
 for(const name of ['export','history','storage','branches','keyboard-insert','shortcuts','icons','fonts','styles','variables','components','colors','templates','resource-library','mcp','local-plugins','release-notes','document-outline','selection-box','snapshot','slices']){await modal(page,name);await expect(page.locator('[role=dialog]').last()).toBeVisible();await page.waitForTimeout(120);const r=await audit(page);results.push({...r,failures:r.failures.map(f=>name+': '+f)});await modal(page,'');}
 await page.getByRole('menuitem',{name:'File',exact:true}).click();const items=page.locator('.menu [role^=menuitem]');for(let i=0;i<Math.min(8,await items.count());i++){await items.nth(i).hover();results.push(await audit(page));}await page.keyboard.press('Escape');
 for(const button of await page.getByRole('toolbar').first().getByRole('button').all()){await button.hover();results.push(await audit(page));if(results.length>42)break;}
 expect(results.reduce((sum,r)=>sum+r.checked,0)).toBeGreaterThan(300);
 expect([...new Set(results.flatMap(r=>r.failures))]).toEqual([]);
});
