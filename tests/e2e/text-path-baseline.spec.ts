import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import fs from 'node:fs/promises';
import {blankDocument,node,parseDocument} from '../../src/model';
import {textPathCandidate} from '../../src/text-path-actions';

const text='AROUND THE CIRCLE';
function circle(){const d=blankDocument();d.fonts=[];d.pages[0].nodes=[node('ellipse',{id:'c',name:'Ring',x:200,y:160,width:240,height:240,text,fontSize:24,fill:'#ff0000',stroke:'',strokes:[]})];return d;}
function curve(){const d=blankDocument();d.fonts=[];d.pages[0].nodes=[textPathCandidate(node('path',{id:'c',name:'Ring',x:160,y:200,width:400,height:160,pathWidth:400,pathHeight:160,text:'FORMA CURVE',fontSize:30,fill:'#ff0000',stroke:'',strokes:[],contours:[{closed:false,points:[{x:0,y:120,out:{x:100,y:-140}},{x:400,y:120,in:{x:-100,y:-140}}]}]}))];return d;}
const errors=new WeakMap<Page,string[]>();test.beforeEach(({page})=>{const e:string[]=[];errors.set(page,e);page.on('pageerror',err=>e.push(err.message));});test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));
async function load(page:Page,d=circle()){await page.addInitScript(doc=>{if(!localStorage.getItem('oui-active'))localStorage.setItem('oui-active',JSON.stringify(doc));},d);await page.goto('/');await page.getByRole('treeitem',{name:'Ring',exact:true}).click();}
const state=(page:Page)=>page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p),s=useEditor.getState(),n=s.doc.pages[0].nodes[0];return {type:n.type,contours:n.contours,textPath:n.textPath,past:s.past.length};});
const glyph=(page:Page,index:number)=>page.locator('#forma-design-canvas text[data-text-path="c"]').first().evaluate((el,index)=>{const t=el as SVGTextElement,p=t.getStartPositionOfChar(index);return {x:p.x,y:p.y,count:t.getNumberOfChars()};},index);
const handle=(page:Page)=>page.getByRole('slider',{name:'Text path start',exact:true});
const center=async(page:Page)=>{const b=(await handle(page).boundingBox())!;return {x:b.x+b.width/2,y:b.y+b.height/2};};

test('an ellipse becomes text running around the circle, saves, and returns to a closed path',async({page})=>{
 await load(page);await page.getByRole('button',{name:'Convert path to editable text',exact:true}).click();await expect(page.locator('#forma-design-canvas text[data-text-path="c"]').first()).toHaveCount(1);const after=await state(page);expect(after).toMatchObject({type:'text',textPath:{startOffset:0}});expect(after.contours![0].closed).toBe(false);expect(after.contours![0].points).toHaveLength(5);const pts=await page.locator('#forma-design-canvas text[data-text-path="c"]').first().evaluate(el=>{const t=el as SVGTextElement,out:number[]=[];for(let i=0;i<t.getNumberOfChars();i++){const p=t.getStartPositionOfChar(i);out.push(Math.hypot(p.x-120,p.y-120));}return out;});expect(pts.length).toBe(text.length);for(const r of pts)expect(Math.abs(r-120)).toBeLessThan(2);
 const pending=page.waitForEvent('download');await page.keyboard.press('Meta+s');const saved=parseDocument(await fs.readFile((await(await pending).path())!,'utf8'));expect(saved.pages[0].nodes[0].contours).toEqual(after.contours);await page.getByRole('button',{name:'Return to baseline path',exact:true}).click();await expect.poll(async()=>(await state(page)).type).toBe('path');expect((await state(page)).contours![0].closed).toBe(true);
});
test('flip reverses reading direction with one Undo',async({page})=>{
 await load(page,curve());const before=await state(page),first=await glyph(page,0),last=await glyph(page,first.count-1);expect(last.x).toBeGreaterThan(first.x);await page.getByRole('button',{name:'Flip text direction',exact:true}).click();await expect.poll(async()=>(await state(page)).past).toBe(before.past+1);const after=await state(page);expect(after.textPath).toEqual({startOffset:100});await page.getByRole('spinbutton',{name:'Text path start offset (%)',exact:true}).fill('60');await page.getByRole('spinbutton',{name:'Text path start offset (%)',exact:true}).press('Enter');await expect.poll(async()=>(await state(page)).textPath?.startOffset).toBe(60);const a=await glyph(page,0),b=await glyph(page,1);expect(b.x).toBeLessThan(a.x);
});
test('dragging the handle moves real glyphs live and commits once on release',async({page})=>{
 await load(page,curve());const before=await state(page),start=await glyph(page,0),from=await center(page);await expect(handle(page)).toHaveAttribute('aria-valuenow','0');await page.mouse.move(from.x,from.y);await page.mouse.down();const box=(await page.locator('#forma-design-canvas').boundingBox())!;await page.mouse.move(from.x+90,from.y-40,{steps:4});await expect.poll(async()=>Number(await handle(page).getAttribute('aria-valuenow'))).toBeGreaterThan(5);const moving=await glyph(page,0);expect(moving.x).toBeGreaterThan(start.x+20);expect((await state(page)).past).toBe(before.past);expect((await state(page)).textPath).toEqual({startOffset:0});await page.mouse.up();await expect.poll(async()=>(await state(page)).past).toBe(before.past+1);const after=await state(page);expect(after.textPath!.startOffset).toBeGreaterThan(5);expect(after.textPath!.startOffset).toBeLessThan(60);expect(box.width).toBeGreaterThan(0);await page.locator('#forma-design-canvas').focus();await page.keyboard.press('Meta+z');await expect.poll(async()=>(await state(page)).textPath?.startOffset).toBe(0);
});
test('Escape cancels a handle drag without a document change',async({page})=>{
 await load(page,curve());const before=await state(page),from=await center(page);await page.mouse.move(from.x,from.y);await page.mouse.down();await page.mouse.move(from.x+90,from.y-40,{steps:3});await page.keyboard.press('Escape');await page.mouse.up();expect(await state(page)).toEqual(before);await expect(handle(page)).toHaveAttribute('aria-valuenow','0');
});
test('a click without movement adds no history',async({page})=>{
 await load(page,curve());const before=await state(page),from=await center(page);await page.mouse.click(from.x,from.y);expect(await state(page)).toEqual(before);
});
test('the handle only appears for a selected unlocked text path with Move active',async({page})=>{
 await load(page,curve());await expect(handle(page)).toHaveCount(1);await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().set({tool:'rectangle'});});await expect(handle(page)).toHaveCount(0);await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().set({tool:'move',selection:[]});});await expect(handle(page)).toHaveCount(0);
});
