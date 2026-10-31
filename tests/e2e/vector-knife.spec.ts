import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import fs from 'node:fs/promises';
import {blankDocument,node,parseDocument} from '../../src/model';

function fixture(){const d=blankDocument();d.fonts=[];d.pages[0].nodes=[node('ellipse',{id:'shape',name:'Shape',x:160,y:140,width:240,height:160,fill:'#ff0000',stroke:'',strokes:[]})];return d;}
const errors=new WeakMap<Page,string[]>();test.beforeEach(({page})=>{const e:string[]=[];errors.set(page,e);page.on('pageerror',err=>e.push(err.message));});test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));
async function load(page:Page,d=fixture()){await page.addInitScript(doc=>{if(!localStorage.getItem('oui-active'))localStorage.setItem('oui-active',JSON.stringify(doc));},d);await page.goto('/');await page.getByRole('treeitem',{name:'Shape',exact:true}).click();await page.getByRole('toolbar',{name:'Design tools',exact:true}).getByRole('radio',{name:'Draw tools',exact:true}).click();}
const toolbar=(page:Page)=>page.getByRole('toolbar',{name:'Design tools',exact:true});
async function knife(page:Page){await toolbar(page).getByRole('button',{name:'Illustration tools',exact:true}).click();await toolbar(page).getByRole('menuitem',{name:'Knife',exact:true}).click();}
const state=(page:Page)=>page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p),s=useEditor.getState();return {nodes:s.doc.pages[0].nodes,past:s.past.length,tool:s.tool};});
const screen=(page:Page,x:number,y:number)=>page.evaluate(({x,y})=>{const g=document.querySelector('#forma-design-canvas > g') as SVGGraphicsElement,q=new DOMPoint(x,y).matrixTransform(g.getScreenCTM()!);return {x:q.x,y:q.y};},{x,y});
async function slice(page:Page,from:{x:number;y:number},to:{x:number;y:number}){const a=await screen(page,from.x,from.y),b=await screen(page,to.x,to.y);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:4});await page.mouse.up();}
const rgba=(page:Page,nodes:unknown,points:{x:number;y:number}[])=>page.evaluate(async({nodes,points})=>{const p='/src/files.tsx',{exportSvg}=await import(p),svg=exportSvg(nodes),xml=new DOMParser().parseFromString(svg,'image/svg+xml'),b=xml.documentElement.getAttribute('viewBox')!.split(' ').map(Number),image=new Image();await new Promise<void>((res,rej)=>{image.onload=()=>res();image.onerror=rej;image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);});const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return points.map(q=>[...ctx.getImageData(Math.round(q.x-b[0]),Math.round(q.y-b[1]),1,1).data]);},{nodes,points});

test('dragging a line splits a shape into two paths that render where it was, with one Undo and save',async({page})=>{
 await load(page);const before=await state(page);await knife(page);await expect(page.locator('[data-vector-knife="shape"]')).toHaveCount(1);await slice(page,{x:280,y:100},{x:280,y:340});await expect.poll(async()=>(await state(page)).nodes.length).toBe(3);const after=await state(page);expect(after.past).toBe(before.past+1);expect(after.nodes.map(n=>n.type)).toEqual(['group','path','path']);await expect(page.locator('[data-vector-knife]')).toHaveCount(0);const left=await rgba(page,after.nodes,[{x:220,y:220},{x:340,y:220},{x:170,y:145}]);expect(left[0]).toEqual([255,0,0,255]);expect(left[1]).toEqual([255,0,0,255]);expect(left[2][3]).toBe(0);
 const pending=page.waitForEvent('download');await page.keyboard.press('Meta+s');const saved=parseDocument(await fs.readFile((await(await pending).path())!,'utf8'));expect(saved.pages[0].nodes.map(n=>n.id)).toEqual(after.nodes.map(n=>n.id));await page.locator('#forma-design-canvas').focus();await page.keyboard.press('Meta+z');await expect.poll(async()=>(await state(page)).nodes.map(n=>n.type)).toEqual(['ellipse']);
});
test('Escape leaves the knife with nothing changed',async({page})=>{
 await load(page);const before=await state(page);await knife(page);await expect(page.locator('[data-vector-knife]')).toHaveCount(1);const a=await screen(page,280,100),b=await screen(page,280,340);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:2});await page.keyboard.press('Escape');await page.mouse.up();await expect(page.locator('[data-vector-knife]')).toHaveCount(0);const after=await state(page);expect(after.nodes).toEqual(before.nodes);expect(after.past).toBe(before.past);
});
test('a line that misses reports it, keeps the tool open and changes nothing',async({page})=>{
 await load(page);const before=await state(page);await knife(page);await slice(page,{x:420,y:150},{x:420,y:280});await expect(page.getByRole('status').getByText('The line does not cross this shape.',{exact:true})).toBeVisible();expect((await state(page)).nodes).toEqual(before.nodes);await expect(page.locator('[data-vector-knife]')).toHaveCount(1);await slice(page,{x:170,y:220},{x:390,y:220});await expect.poll(async()=>(await state(page)).nodes.length).toBe(3);
});
test('an ineligible shape refuses from the menu and keeps the current tool',async({page})=>{
 const d=fixture();d.pages[0].nodes[0].fill='none';d.pages[0].nodes[0].paints=[];await load(page,d);const before=await state(page);await knife(page);await expect(page.getByRole('status').getByText('Add a visible solid fill before slicing.',{exact:true})).toBeVisible();await expect(page.locator('[data-vector-knife]')).toHaveCount(0);expect((await state(page)).tool).toBe(before.tool);
});
test('the knife takes the drag at high zoom too',async({page})=>{
 await load(page);await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().set({zoom:8,pan:{x:-1800,y:-1200}});});await knife(page);await slice(page,{x:280,y:200},{x:280,y:240});await expect.poll(async()=>(await state(page)).nodes.length).toBe(3);
});

