import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import fs from 'node:fs/promises';

/** Repeatable local measurement, not an acceptance gate. Run with:
 * FORMA_BENCH=1 FORMA_BENCH_OUT=/path/out.json npx playwright test tests/e2e/performance-benchmark.spec.ts --workers=1
 * Numbers vary by machine; docs quote one recorded run with its environment. */
test.skip(!process.env.FORMA_BENCH,'Set FORMA_BENCH=1 to record performance measurements.');
test.setTimeout(240000);
interface Sample {name:string;layers:number;ms:number;longestTaskMs:number;blockedMs:number;firstFrameMs?:number;}
const median=(values:number[])=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
async function measure(page:Page,name:string,layers:number,runs:number,action:string,arg:unknown):Promise<Sample>{
 const samples:Omit<Sample,'name'|'layers'>[]=[];
 for(let i=0;i<runs;i++)samples.push(await page.evaluate(async({action,arg,i})=>{const w=window as any;const tasks:PerformanceEntry[]=[],observer=new PerformanceObserver(list=>tasks.push(...list.getEntries()));observer.observe({type:'longtask',buffered:false});const start=performance.now();let firstFrameMs:number|undefined;const frame=()=>new Promise<number>(r=>requestAnimationFrame(r));void frame().then(()=>{firstFrameMs=performance.now()-start;});await w.__bench[action](arg,i);const ms=performance.now()-start;await frame();await frame();await new Promise(r=>setTimeout(r,50));observer.disconnect();return {ms,firstFrameMs,longestTaskMs:Math.max(0,...tasks.map(t=>t.duration)),blockedMs:tasks.reduce((n,t)=>n+t.duration,0)};},{action,arg,i}));
 return {name,layers,ms:median(samples.map(s=>s.ms)),longestTaskMs:median(samples.map(s=>s.longestTaskMs)),blockedMs:median(samples.map(s=>s.blockedMs)),firstFrameMs:median(samples.map(s=>s.firstFrameMs??0))};
}
test('records load, page switch, persistence and merge timings',async({page})=>{
 await page.goto('/');await expect(page.locator('[data-canvas]').first()).toBeVisible();
 await page.evaluate(async()=>{const w=window as any,{useEditor}=await import('/src/store.ts'),{blankDocument,node}=await import('/src/model.ts'),{saveDocument,repositoryRead,storedValue}=await import('/src/repository.ts'),{mergeDocuments}=await import('/src/branch-merge.ts'),{EditHistoryEncoder,restoreHistory}=await import('/src/edit-history.ts');
  const make=(layers:number)=>{const doc=blankDocument();const page=(id:string,offset:number)=>({id,name:id,comments:[],nodes:Array.from({length:layers},(_,i)=>node('rectangle',{id:id+'-'+i,name:'Layer '+i,x:(i%200)*24+offset,y:Math.floor(i/200)*24,width:20,height:20,fill:'#'+(i%0xffffff).toString(16).padStart(6,'0')}))});doc.pages=[page('a',0),page('b',8)];return doc;};
  const images=(count:number)=>{const c=document.createElement('canvas');c.width=1600;c.height=1200;const x=c.getContext('2d')!;const p=x.createImageData(c.width,c.height);let seed=7;for(let i=0;i<p.data.length;i+=4){for(let k=0;k<3;k++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;p.data[i+k]=seed>>>24;}p.data[i+3]=255;}x.putImageData(p,0,0);const data=c.toDataURL('image/jpeg',.9),doc=blankDocument();doc.pages[0].nodes=Array.from({length:count},(_,i)=>node('image',{id:'img'+i,name:'Image '+i,image:data,x:(i%6)*180,y:Math.floor(i/6)*140,width:170,height:130}));return doc;};
  w.__bench={docs:{} as Record<string,any>,
   prepare(layers:number){this.docs[layers]=make(layers);},
   fresh(key:string|number){const doc=structuredClone(this.docs[key]);doc.id=crypto.randomUUID();return doc;},
   load(layers:number){useEditor.getState().load(this.fresh(layers));useEditor.getState().set({home:false,modal:null});return new Promise(r=>setTimeout(r));},
   switchPage(_:number,i:number){useEditor.getState().selectPage(i%2?'a':'b');return new Promise(r=>setTimeout(r));},
   async loadSettled(layers:number){useEditor.getState().load(this.fresh(layers));useEditor.getState().set({home:false,modal:null});for(let i=0;i<600;i++){await new Promise(r=>requestAnimationFrame(r));if(!document.querySelector('[data-progressive-page="loading"]'))return;}},
   prepareImages(count:number){this.docs['images'+count]=images(count);},
   loadImages(count:number){useEditor.getState().load(this.fresh('images'+count));useEditor.getState().set({home:false,modal:null});return new Promise(r=>setTimeout(r,300));},
   save(layers:number){return saveDocument(this.docs[layers]);},
   read(layers:number){const id=this.docs[layers].id;return repositoryRead((tx:IDBTransaction)=>storedValue(tx.objectStore('documents').get(id)));},
   merge(layers:number){const base=this.docs[layers],ours=structuredClone(base),theirs=structuredClone(base);ours.pages[0].nodes[10].x=1;theirs.pages[0].nodes[20].fill='#ff0000';return mergeDocuments(base,ours,theirs);},
   async history(layers:number){const a=this.docs[layers],b=structuredClone(a);b.pages[0].nodes[5].x=-5;b.updatedAt=new Date(Date.parse(a.updatedAt)+1000).toISOString();const record=new EditHistoryEncoder().record(b,[a],[]);this.bytes=JSON.stringify(record).length;await restoreHistory(record,b);},
  };});
 const results:Sample[]=[];
 const singlePass=async(enabled:boolean)=>page.evaluate(async enabled=>{const limits=(await import('/src/progressive-page.ts')).PROGRESSIVE_PAGE_LIMITS as {threshold:number};limits.threshold=enabled?1e9:3000;},enabled);
 for(const layers of [2000,20000]){await page.evaluate(l=>(window as any).__bench.prepare(l),layers);results.push(await measure(page,'load-commit',layers,5,'load',layers),await measure(page,'load-until-complete',layers,5,'loadSettled',layers),await measure(page,'page-switch',layers,6,'switchPage',layers),await singlePass(true) as never,await measure(page,'load-commit-single-pass',layers,5,'load',layers),await measure(page,'page-switch-single-pass',layers,6,'switchPage',layers),await singlePass(false) as never,await measure(page,'recovery-write',layers,5,'save',layers),await measure(page,'recovery-read',layers,5,'read',layers),await measure(page,'three-way-merge',layers,3,'merge',layers),await measure(page,'history-encode-restore',layers,3,'history',layers));}
 await page.evaluate(()=>(window as any).__bench.prepareImages(36));results.push(await measure(page,'open-36-images',36,5,'loadImages',36));
 const report={at:new Date().toISOString(),userAgent:await page.evaluate(()=>navigator.userAgent),results:results.filter(Boolean)};console.log(JSON.stringify(report,null,1));if(process.env.FORMA_BENCH_OUT)await fs.writeFile(process.env.FORMA_BENCH_OUT,JSON.stringify(report,null,1));
});
