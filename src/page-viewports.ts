export const PAGE_VIEWPORT_KEY='oui-page-viewports';
export const MAX_PAGE_VIEWS=1000;
export interface PageCamera {zoom:number;pan:{x:number;y:number};}
interface CameraRecord extends PageCamera {documentId:string;pageId:string;updatedAt:number;}
interface PageChoice {documentId:string;pageId:string;updatedAt:number;}
export interface PageViewportData {version:1;views:CameraRecord[];lastPages:PageChoice[];}
interface StorageLike {getItem(key:string):string|null;setItem(key:string,value:string):void;}
export const defaultPageCamera=():PageCamera=>({zoom:.7,pan:{x:12,y:16}});
const key=(documentId:string,pageId:string)=>JSON.stringify([documentId,pageId]);
const safeId=(id:unknown):id is string=>typeof id==='string'&&!!id.trim()&&id.length<=256&&!/[\u0000-\u001f\u007f]/.test(id);
export function validPageCamera(value:unknown):value is PageCamera {const v=value as PageCamera;return !!v&&typeof v==='object'&&Number.isFinite(v.zoom)&&v.zoom>=.05&&v.zoom<=8&&!!v.pan&&Number.isFinite(v.pan.x)&&Number.isFinite(v.pan.y)&&Math.abs(v.pan.x)<=1e7&&Math.abs(v.pan.y)<=1e7;}
const latest=<T extends {updatedAt:number}>(values:T[])=>values.sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,MAX_PAGE_VIEWS);
const empty=():PageViewportData=>({version:1,views:[],lastPages:[]});
/** Only camera primitives and bounded identifiers survive decoding. */
export function parsePageViewports(raw:string|null,now=Date.now()):PageViewportData {
 if(!raw||raw.length>1_500_000)return empty();
 try{const v=JSON.parse(raw);if(v?.version!==1||!Array.isArray(v.views)||!Array.isArray(v.lastPages)||v.views.length>5000||v.lastPages.length>5000)return empty();
  const valid=(r:any):r is PageChoice=>r&&safeId(r.documentId)&&safeId(r.pageId)&&Number.isSafeInteger(r.updatedAt)&&r.updatedAt>=0&&r.updatedAt<=now+60_000;
  const views=new Map<string,CameraRecord>(),choices=new Map<string,PageChoice>();
  for(const r of v.views)if(valid(r)&&validPageCamera(r)){const id=key(r.documentId,r.pageId),previous=views.get(id);if(!previous||previous.updatedAt<=r.updatedAt)views.set(id,{documentId:r.documentId,pageId:r.pageId,zoom:r.zoom,pan:{x:r.pan.x,y:r.pan.y},updatedAt:r.updatedAt});}
  for(const r of v.lastPages)if(valid(r)){const previous=choices.get(r.documentId);if(!previous||previous.updatedAt<=r.updatedAt)choices.set(r.documentId,{documentId:r.documentId,pageId:r.pageId,updatedAt:r.updatedAt});}
  return {version:1,views:latest([...views.values()]),lastPages:latest([...choices.values()])};
 }catch{return empty();}
}
const browserStorage=():StorageLike|undefined=>typeof window==='undefined'?undefined:window.localStorage;

/** One cache per renderer. Pending local changes merge with durable records at
 * flush; windows do not continuously synchronize their active cameras. */
export class PageViewportCache {
 private views=new Map<string,CameraRecord>();private choices=new Map<string,PageChoice>();
 private dirtyViews=new Map<string,CameraRecord>();private dirtyChoices=new Map<string,PageChoice>();
 private timer:ReturnType<typeof setTimeout>|undefined;
 constructor(private storage:()=>StorageLike|undefined=browserStorage,private now:()=>number=Date.now,private delay=250){}
 private durable(){try{return parsePageViewports(this.storage()?.getItem(PAGE_VIEWPORT_KEY)??null,this.now());}catch{return empty();}}
 private merge(data:PageViewportData){
  for(const r of data.views){const id=key(r.documentId,r.pageId),old=this.views.get(id);if(!old||old.updatedAt<r.updatedAt)this.views.set(id,r);}
  for(const r of data.lastPages){const old=this.choices.get(r.documentId);if(!old||old.updatedAt<r.updatedAt)this.choices.set(r.documentId,r);}
  this.trim();
 }
 private trim(){this.views=new Map(latest([...this.views.values()]).map(r=>[key(r.documentId,r.pageId),r]));this.choices=new Map(latest([...this.choices.values()]).map(r=>[r.documentId,r]));this.dirtyViews=new Map(latest([...this.dirtyViews.values()]).map(r=>[key(r.documentId,r.pageId),r]));this.dirtyChoices=new Map(latest([...this.dirtyChoices.values()]).map(r=>[r.documentId,r]));}
 private schedule(){if(this.timer!==undefined)clearTimeout(this.timer);this.timer=setTimeout(()=>{this.timer=undefined;this.flush();},this.delay);}
 camera(documentId:string,pageId:string):PageCamera|undefined {this.merge(this.durable());const r=this.views.get(key(documentId,pageId));return r?{zoom:r.zoom,pan:{...r.pan}}:undefined;}
 lastPage(documentId:string):string|undefined {this.merge(this.durable());return this.choices.get(documentId)?.pageId;}
 rememberPage(documentId:string,pageId:string,refresh=false){
  if(!safeId(documentId)||!safeId(pageId))return;
  const previous=this.choices.get(documentId);if(!refresh&&previous?.pageId===pageId)return;
  const r={documentId,pageId,updatedAt:this.now()};this.choices.set(documentId,r);this.dirtyChoices.set(documentId,r);this.trim();this.schedule();
 }
 rememberCamera(documentId:string,pageId:string,camera:PageCamera){
  if(!safeId(documentId)||!safeId(pageId)||!validPageCamera(camera))return;
  const r={documentId,pageId,zoom:camera.zoom,pan:{...camera.pan},updatedAt:this.now()};this.views.set(key(documentId,pageId),r);this.dirtyViews.set(key(documentId,pageId),r);this.rememberPage(documentId,pageId,true);this.trim();this.schedule();
 }
 flush(){
  if(this.timer!==undefined){clearTimeout(this.timer);this.timer=undefined;}
  if(!this.dirtyViews.size&&!this.dirtyChoices.size)return;
  // Include other windows' latest records; pending changes in this renderer win ties.
  const data=this.durable(),views=new Map(data.views.map(r=>[key(r.documentId,r.pageId),r])),choices=new Map(data.lastPages.map(r=>[r.documentId,r]));
  for(const [id,r] of this.dirtyViews)if((views.get(id)?.updatedAt??-1)<=r.updatedAt)views.set(id,r);
  for(const [id,r] of this.dirtyChoices)if((choices.get(id)?.updatedAt??-1)<=r.updatedAt)choices.set(id,r);
  const next:PageViewportData={version:1,views:latest([...views.values()]),lastPages:latest([...choices.values()])};
  try{const storage=this.storage();if(!storage)return;storage.setItem(PAGE_VIEWPORT_KEY,JSON.stringify(next));this.dirtyViews.clear();this.dirtyChoices.clear();this.merge(next);}catch{/* Editing remains available with an ephemeral in-memory camera. */}
 }
 attach(target:Window){const flush=()=>this.flush(),hidden=()=>{if(target.document.visibilityState==='hidden')flush();};target.addEventListener('pagehide',flush);target.document.addEventListener('visibilitychange',hidden);return()=>{target.removeEventListener('pagehide',flush);target.document.removeEventListener('visibilitychange',hidden);this.flush();};}
}
