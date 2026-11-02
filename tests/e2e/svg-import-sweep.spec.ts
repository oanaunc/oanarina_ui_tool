import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {writeFileSync} from 'node:fs';
import {SWEEP_CASES} from '../svg-sweep-cases';
/** Every sweep case: the browser's own render of the source against the imported layers exported back through the
 * same artwork the canvas draws. Both are served as standalone SVG documents, because SVG used as an image or as a
 * data URL document skips nested images in WebKit. A case that differs must have reported why. SVG_SWEEP_OUT writes the numbers. */
interface Imported {name:string;error?:string;width:number;height:number;issues:{code:string;message:string}[];nodes:number;back?:string;}
interface Result extends Imported {changed:number;total:number;source?:string;imported?:string;only?:string;}
/** A pixel counts as different only if no pixel beside it in the other image is close, which absorbs edge anti-aliasing. */
const TOLERANCE=40,ALLOWED=.0015,VIEW_URL='http://sweep.invalid/view.svg';let served='';
const importCase=(page:Page,sweep:{name:string;svg:string})=>page.evaluate(async c=>{
 const importer='/src/svg-import.ts',files='/src/files.tsx',store='/src/store.ts',{parseEditableSvg}=await import(importer),{exportSvg}=await import(files),{useEditor}=await import(store),result:Imported={name:c.name,width:0,height:0,issues:[],nodes:0};
 try{const imported=parseEditableSvg(c.svg,'Sweep',{x:0,y:0}),width=Math.ceil(imported.width),height=Math.ceil(imported.height);Object.assign(result,{width,height,issues:imported.issues,nodes:imported.nodes.length});useEditor.getState().edit((d:any)=>{const p=d.pages.find((p:any)=>p.id===useEditor.getState().pageId);p.nodes=imported.nodes;});result.back=exportSvg(useEditor.getState().doc.pages.find((p:any)=>p.id===useEditor.getState().pageId).nodes,{x:0,y:0,width,height});}catch(e){result.error=String((e as Error)?.message??e).slice(0,300);}return result;},sweep);
const shot=async(page:Page,svg:string,width:number,height:number)=>{await page.setViewportSize({width,height});served=svg;await page.goto(VIEW_URL);if(/<image\b/.test(svg))await page.waitForTimeout(350);return (await page.screenshot({clip:{x:0,y:0,width,height},animations:'disabled'})).toString('base64');};
const compare=(page:Page,a:string,b:string,width:number,height:number)=>page.evaluate(async({a,b,width,height,tolerance})=>{
 const load=async(data:string)=>{const image=new Image();image.src='data:image/png;base64,'+data;await image.decode();const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const g=canvas.getContext('2d',{willReadFrequently:true})!;g.drawImage(image,0,0,width,height);return g.getImageData(0,0,width,height).data;},first=await load(a),second=await load(b);
 const close=(i:number,j:number)=>Math.abs(first[i]-second[j])<=tolerance&&Math.abs(first[i+1]-second[j+1])<=tolerance&&Math.abs(first[i+2]-second[j+2])<=tolerance;let changed=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const i=(y*width+x)*4;if(close(i,i))continue;let near=false;for(let dy=-1;dy<=1&&!near;dy++)for(let dx=-1;dx<=1&&!near;dx++){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const j=(ny*width+nx)*4;near=close(i,j)||close(j,i);}if(!near)changed++;}
 return changed;},{a,b,width,height,tolerance:TOLERANCE});
test('each case matches the browser or reports why',async({page,browser,browserName})=>{test.setTimeout(540_000);
 const requests:string[]=[];page.on('request',r=>{if(!/^https?:\/\/(127\.0\.0\.1|localhost)[:/]/.test(r.url())&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))requests.push(r.url());});await page.goto('/');await page.getByRole('button',{name:'New design file',exact:true}).click();await expect(page.locator('svg.canvas')).toBeVisible();
 const context=await browser.newContext({deviceScaleFactor:1,colorScheme:'light',locale:'en-US'}),view=await context.newPage();await context.route(/^(https?|ftp|file):/,route=>route.request().url()===VIEW_URL?route.fulfill({contentType:'image/svg+xml',body:served}):route.abort());
 const results:Result[]=[];for(const sweep of SWEEP_CASES){const imported=await importCase(page,sweep),result:Result={...imported,changed:0,total:imported.width*imported.height,only:sweep.only};results.push(result);if(imported.error||!imported.back)continue;const a=await shot(view,sweep.svg,imported.width,imported.height),b=await shot(view,imported.back,imported.width,imported.height);result.changed=await compare(page,a,b,imported.width,imported.height);if(process.env.SVG_SWEEP_OUT){result.source='data:image/png;base64,'+a;result.imported='data:image/png;base64,'+b;}delete result.back;}
 await context.close();if(process.env.SVG_SWEEP_OUT)writeFileSync(process.env.SVG_SWEEP_OUT,JSON.stringify(results));expect(requests,'imports reach no network or file').toEqual([]);
 for(const sweep of SWEEP_CASES){const r=results.find(r=>r.name===sweep.name)!,differs=(!sweep.only||sweep.only===browserName)&&r.changed>r.total*(sweep.allowed??ALLOWED),codes=[...new Set(r.issues.map(i=>i.code))];expect.soft(r.error,`${sweep.name} refused`).toBeUndefined();for(const code of sweep.reduced??[])expect.soft(codes,`${sweep.name} must report ${code}`).toContain(code);if(differs)expect.soft((sweep.reduced??[]).length>0&&codes.length>0,`${sweep.name} differs in ${r.changed} of ${r.total} pixels with ${codes.join(', ')||'no report'}`).toBe(true);}
});
