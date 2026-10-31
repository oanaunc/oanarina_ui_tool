import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import {blankDocument,node,parseDocument} from '../../src/model';
const save=async(page:any)=>{const wait=page.waitForEvent('download');await page.keyboard.press('Meta+s');return parseDocument(await fs.readFile((await(await wait).path())!,'utf8'));};
const load=async(page:any,nodes:any[])=>{const doc=blankDocument();doc.pages[0].nodes=nodes;await page.addInitScript(d=>{if(!localStorage.getItem('oui-active'))localStorage.setItem('oui-active',JSON.stringify(d));},doc);await page.goto('/');await expect(page.locator('.layer-row')).toHaveCount(nodes.length);};
const open=async(page:any,id:string)=>{await page.locator(`[data-layer-id="${id}"]`).click();await page.getByRole('button',{name:'Edit vector points',exact:true}).click();};
const round=async(page:any,radius:string)=>{await page.getByRole('spinbutton',{name:'Vector corner radius',exact:true}).fill(radius);await page.getByRole('button',{name:'Round selected corners',exact:true}).click();};
const curved=()=>node('path',{name:'Curved corner',x:160,y:140,width:200,height:100,pathWidth:200,pathHeight:100,contours:[{closed:false,points:[{x:0,y:0},{x:100,y:0},{x:200,y:100,in:{x:-20,y:-80}}]}]});
test('rounds a corner between a line and a curve through the real control, with Undo, save and reload',async({page})=>{
 const n=curved();await load(page,[n]);await open(page,n.id);await page.locator('[data-vector-key="0:1"]').click();await round(page,'20');await expect(page.locator('[data-vector-key="0:3"]')).toBeVisible();
 let d=await save(page);const points=d.pages[0].nodes[0].contours![0].points;expect(points.length).toBeGreaterThanOrEqual(4);expect(points[1].out).toBeDefined();expect(points.at(-2)!.in).toBeDefined();
 await page.keyboard.press('Meta+z');await expect(page.locator('[data-vector-key="0:3"]')).toHaveCount(0);d=await save(page);expect(d.pages[0].nodes[0].contours![0].points).toHaveLength(3);
 await page.keyboard.press('Meta+Shift+z');await expect(page.locator('[data-vector-key="0:3"]')).toBeVisible();await page.waitForTimeout(850);await page.reload();await open(page,n.id);await expect(page.locator('[data-vector-key="0:3"]')).toBeVisible();d=await save(page);expect(d.pages[0].nodes[0].contours![0].points).toEqual(points);
});
test('exports the rounded curve through the shared SVG renderer',async({page})=>{
 const n=curved(),exported=async()=>{await page.getByRole('button',{name:'Export',exact:true}).click();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Export SVG',exact:true}).click();const raw=await fs.readFile((await(await pending).path())!,'utf8');await page.keyboard.press('Escape');return raw;},cubics=(raw:string)=>[...raw.matchAll(/\sd="([^"]+)"/g)].reduce((sum,m)=>sum+(m[1].match(/[Cc]/g)?.length??0),0);
 await load(page,[n]);await page.locator(`[data-layer-id="${n.id}"]`).click();const before=cubics(await exported());await page.getByRole('button',{name:'Edit vector points',exact:true}).click();await page.locator('[data-vector-key="0:1"]').click();await round(page,'20');await page.getByRole('button',{name:'Finish editing points',exact:true}).click();const after=cubics(await exported());expect(before).toBeGreaterThan(0);expect(after).toBeGreaterThan(before);
});
test('refuses a smooth anchor with a visible message and no document change',async({page})=>{
 const n=node('path',{name:'Smooth',x:160,y:140,width:200,height:100,pathWidth:200,pathHeight:100,contours:[{closed:false,points:[{x:0,y:100,out:{x:10,y:-40}},{x:100,y:50,in:{x:-30,y:0},out:{x:30,y:0}},{x:200,y:100,in:{x:-10,y:-40}}]}]});await load(page,[n]);await open(page,n.id);await page.locator('[data-vector-key="0:1"]').click();await round(page,'20');await expect(page.getByRole('status').getByText('Select a corner with a nonzero angle.',{exact:true})).toBeVisible();await expect(page.locator('[data-vector-key]')).toHaveCount(3);const d=await save(page);expect(d.pages[0].nodes[0].contours![0].points).toHaveLength(3);
});
