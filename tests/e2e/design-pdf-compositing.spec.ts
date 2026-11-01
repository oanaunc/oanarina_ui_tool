import {test,expect} from '@playwright/test';
import type {Download,Page} from '@playwright/test';
import fs from 'node:fs/promises';
import {PDFDocument} from 'pdf-lib';
import {blankDocument,node} from '../../src/model';
import type {DesignDocument} from '../../src/model';
async function load(page:Page,d:DesignDocument){d.fonts=[];await page.addInitScript(d=>localStorage.setItem('oui-active',JSON.stringify(d)),d);await page.goto('/');await expect(page.locator('.layer-row')).toHaveCount(d.pages[0].nodes.length);}
async function open(page:Page){await page.getByRole('button',{name:'Export',exact:true}).click();return page.getByRole('region',{name:'Design PDF export',exact:true});}
async function exported(page:Page,section:ReturnType<Page['getByRole']>){let file:Download|undefined;await expect(async()=>{const event=page.waitForEvent('download',{timeout:3000});await section.getByRole('button',{name:'Export PDF',exact:true}).click();file=await event;}).toPass({timeout:20000});return new Uint8Array(await fs.readFile((await file!.path())!));}
async function pixels(page:Page,data:Uint8Array,points:number[][]){return page.evaluate(async ([bytes,points])=>{const pdfjs=await import('/node_modules/pdfjs-dist/build/pdf.mjs' as string);pdfjs.GlobalWorkerOptions.workerSrc='/node_modules/pdfjs-dist/build/pdf.worker.min.mjs';const doc=await pdfjs.getDocument({data:new Uint8Array(bytes as number[])}).promise,p=await doc.getPage(1),viewport=p.getViewport({scale:96/72}),canvas=document.createElement('canvas');canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);const context=canvas.getContext('2d',{willReadFrequently:true})!;await p.render({canvasContext:context,viewport}).promise;return (points as number[][]).map(([x,y])=>[...context.getImageData(x,y,1,1).data].slice(0,3));},[[...data],points]);}
const near=(a:number[],b:number[],t=12)=>a.every((v,i)=>Math.abs(v-b[i])<=t);
const stops=(rows:[string,number][])=>rows.map(([color,opacity],i)=>({id:'s'+i,position:i/(rows.length-1),color,opacity}));
const gradient=(type:string,rows:[string,number][],extra:object={})=>({id:type+rows.length,type,visible:true,opacity:1,color:rows[0][0],angle:0,cx:.5,cy:.5,radius:1,stops:stops(rows),...extra}) as never;
async function compare(page:Page,d:DesignDocument,points:number[][],expected:number[][]){await load(page,d);await page.getByRole('treeitem',{name:'Page',exact:true}).click();const section=await open(page);await section.getByLabel('Keep shapes as vectors',{exact:true}).check();const data=await exported(page,section),shown=await pixels(page,data,points);expected.forEach((want,i)=>expect(near(shown[i],want),`pixel ${points[i]} was ${shown[i]}, wanted ${want}`).toBe(true));return PDFDocument.load(data);}
const base=()=>{const d=blankDocument();d.name='Compositing';d.pages[0].nodes=[node('frame',{id:'a',name:'Page',x:0,y:0,width:300,height:200,fill:'#ffffff',clip:true})];return d;};
test('blends, group opacity and masks stay real PDF transparency',async({page})=>{const d=base();d.pages[0].nodes.push(
 node('rectangle',{id:'under',parentId:'a',x:0,y:0,width:100,height:100,fill:'#ffff00'}),
 node('rectangle',{id:'multiply',parentId:'a',x:0,y:0,width:50,height:50,fill:'#00ffff',blendMode:'multiply'}),
 node('frame',{id:'g',parentId:'a',x:100,y:0,width:100,height:100,fill:'#000000',opacity:.5,clip:false}),
 node('rectangle',{id:'inside',parentId:'g',x:100,y:0,width:50,height:100,fill:'#ff0000'}),
 node('group',{id:'mg',parentId:'a',x:200,y:0,width:100,height:100,fill:'none',stroke:''}),
 node('ellipse',{id:'source',parentId:'mg',x:200,y:0,width:100,height:100,fill:'#000000',mask:{mode:'alpha'} as never}),
 node('rectangle',{id:'covered',parentId:'mg',x:200,y:0,width:100,height:100,fill:'#00ff00'}),
 node('group',{id:'lg',parentId:'a',x:0,y:100,width:100,height:100,fill:'none',stroke:''}),
 node('rectangle',{id:'lum',parentId:'lg',x:0,y:100,width:100,height:100,fill:'#808080',mask:{mode:'luminance'} as never}),
 node('rectangle',{id:'lc',parentId:'lg',x:0,y:100,width:100,height:100,fill:'#ff0000'}));
 await compare(page,d,[[20,20],[70,70],[125,50],[175,50],[250,50],[205,5],[50,150]],[[0,255,0],[255,255,0],[255,128,128],[128,128,128],[0,255,0],[255,255,255],[255,128,128]]);});
test('transparent stops and angular and diamond paints are shadings that match the canvas',async({page})=>{const d=base();d.pages[0].nodes.push(
 node('rectangle',{id:'band',parentId:'a',x:0,y:0,width:100,height:100,fill:'#000000'}),
 node('rectangle',{id:'fade',parentId:'a',x:0,y:0,width:100,height:100,paints:[gradient('linear',[['#ffffff',0],['#ffffff',1]],{linearStart:{x:0,y:0},linearEnd:{x:1,y:0}})]}),
 node('rectangle',{id:'angular',parentId:'a',x:100,y:0,width:100,height:100,paints:[gradient('angular',[['#ff0000',1],['#00ff00',1],['#ff0000',1]])]}),
 node('rectangle',{id:'diamond',parentId:'a',x:200,y:0,width:100,height:100,paints:[gradient('diamond',[['#ffffff',1],['#000000',1]])]}));
 await load(page,d);const canvas=await page.evaluate(()=>{const svg=document.querySelector('#forma-design-canvas');return !!svg;});expect(canvas).toBe(true);await page.getByRole('treeitem',{name:'Page',exact:true}).click();const section=await open(page);await section.getByLabel('Keep shapes as vectors',{exact:true}).check();const data=await exported(page,section),shown=await pixels(page,data,[[2,50],[50,50],[97,50],[190,50],[110,50],[150,90],[250,50],[297,50]]);
 expect(near(shown[0],[5,5,5],14),String(shown[0])).toBe(true);expect(near(shown[1],[128,128,128],14),String(shown[1])).toBe(true);expect(near(shown[2],[248,248,248],14),String(shown[2])).toBe(true);
 expect(shown[3][0],String(shown[3])).toBeGreaterThan(220);expect(shown[4][1],String(shown[4])).toBeGreaterThan(220);expect(near(shown[5],[128,128,0],36),String(shown[5])).toBe(true);
 expect(near(shown[6],[255,255,255],14),String(shown[6])).toBe(true);expect(near(shown[7],[120,120,120],24),String(shown[7])).toBe(true);});
