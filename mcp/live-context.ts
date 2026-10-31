import {constants} from 'node:fs';
import fs from 'node:fs/promises';
import type {DesignDocument} from '../src/model';

export const LIVE_CONTEXT_LIMITS={bytes:24_000_000,selection:5000,identifier:512,name:4096,image:11_000_000} as const;
export interface LiveImage {mime:'image/png';width:number;height:number;data:string;scope?:'selection'|'page';}
export interface LiveContext {pid:number;documentId:string;documentName:string;pageId:string;pageName:string;selection:string[];dirty:boolean;savedRevision:string;capturedAt:string;viewport:{zoom:number;panX:number;panY:number};screenshot:LiveImage|null;artwork:LiveImage|null;}
/** Published only by Forma, only while its window opts in, and only beside this exact saved project. */
export const liveContextPath=(file:string)=>file+'.oanarina-live.json';
const off='Live editor context is off. In Forma, open this saved project and turn on Resources → Share Live Editor Context with MCP. Saved-file tools work without it.';
const pngSignature='89504e470d0a1a0a';
const bounded=(value:unknown,limit:number):value is string=>typeof value==='string'&&!!value&&Buffer.byteLength(value)<=limit;
function image(value:unknown,artwork:boolean):LiveImage|null{
 if(value===null)return null;const v=value as LiveImage;if(!v||typeof v!=='object'||v.mime!=='image/png'||![v.width,v.height].every(n=>Number.isSafeInteger(n)&&n>0&&n<=16384)||typeof v.data!=='string'||v.data.length>Math.ceil(LIVE_CONTEXT_LIMITS.image/3)*4||v.data.length%4||!/^[A-Za-z0-9+/]+={0,2}$/.test(v.data)||Buffer.from(v.data.slice(0,16),'base64').toString('hex',0,8)!==pngSignature||artwork&&!['selection','page'].includes(v.scope as string))throw Error('Invalid live image');return v;
}
/** The sidecar is a local file other programs could also write, so nothing in it is trusted without checking. */
export function parseLiveContext(raw:string):LiveContext{
 const v=JSON.parse(raw) as Record<string,unknown>,view=v.viewport as LiveContext['viewport'];
 if(!v||typeof v!=='object'||v.format!=='forma-live-context'||v.version!==1)throw Error('Unsupported live context');
 if(!Number.isSafeInteger(v.pid)||(v.pid as number)<=1||!bounded(v.documentId,LIVE_CONTEXT_LIMITS.identifier)||!bounded(v.pageId,LIVE_CONTEXT_LIMITS.identifier)||typeof v.documentName!=='string'||typeof v.pageName!=='string'||Buffer.byteLength(v.documentName)>LIVE_CONTEXT_LIMITS.name||Buffer.byteLength(v.pageName)>LIVE_CONTEXT_LIMITS.name||typeof v.dirty!=='boolean'||typeof v.savedRevision!=='string'||!/^[a-f0-9]{64}$/.test(v.savedRevision)||typeof v.capturedAt!=='string'||!Number.isFinite(Date.parse(v.capturedAt))||!Array.isArray(v.selection)||v.selection.length>LIVE_CONTEXT_LIMITS.selection||!v.selection.every(id=>bounded(id,LIVE_CONTEXT_LIMITS.identifier))||!view||![view.zoom,view.panX,view.panY].every(Number.isFinite))throw Error('Invalid live context');
 return {pid:v.pid as number,documentId:v.documentId,documentName:v.documentName,pageId:v.pageId,pageName:v.pageName,selection:v.selection as string[],dirty:v.dirty,savedRevision:v.savedRevision,capturedAt:v.capturedAt,viewport:{zoom:view.zoom,panX:view.panX,panY:view.panY},screenshot:image(v.screenshot??null,false),artwork:image(v.artwork??null,true)};
}
function running(pid:number,probe:(pid:number,signal:number)=>void=process.kill){try{probe(pid,0);return true;}catch(e){return (e as NodeJS.ErrnoException).code==='EPERM';}}
/** A crashed editor cannot remove its sidecar: a dead publisher reads the same as sharing being off. */
export async function readLiveContext(file:string,documentId:string,probe?:(pid:number,signal:number)=>void):Promise<LiveContext>{
 let handle:fs.FileHandle;try{handle=await fs.open(liveContextPath(file),constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK|constants.O_NOCTTY);}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw Error(off);throw Error('The live editor context file could not be read safely.');}
 let raw:string;try{const stat=await handle.stat();if(!stat.isFile()||stat.size>LIVE_CONTEXT_LIMITS.bytes)throw Error('The live editor context file is not a bounded regular file.');raw=await handle.readFile('utf8');}finally{await handle.close();}
 let context:LiveContext;try{context=parseLiveContext(raw);}catch{throw Error('The live editor context file is malformed. Turn sharing off and on in Forma to rewrite it.');}
 if(context.documentId!==documentId)throw Error('The live editor context belongs to a different document than this project. Reopen the project in Forma.');
 if(!running(context.pid,probe))throw Error(off);return context;
}
/** Selected IDs are resolved against the saved file; unsaved layers stay visible as such rather than disappearing. */
export function liveEditorSummary(context:LiveContext,document:DesignDocument,revision:string,now=Date.now()){
 const nodes=new Map(document.pages.flatMap(p=>p.nodes.map(n=>[n.id,{n,pageId:p.id}] as const))),current=context.savedRevision===revision&&!context.dirty;
 return {live:true,documentName:context.documentName,pageId:context.pageId,pageName:context.pageName,selectionCount:context.selection.length,selection:context.selection.slice(0,500).map(id=>{const found=nodes.get(id);return found?{id,name:found.n.name,type:found.n.type,inSavedFile:true}:{id,inSavedFile:false};}),dirty:context.dirty,matchesSavedFile:current,revision,capturedAt:context.capturedAt,ageSeconds:Math.max(0,Math.round((now-Date.parse(context.capturedAt))/1000)),viewport:context.viewport,
  notices:[...(context.dirty?['The editor has unsaved changes. Selection and screenshots show them; saved-file tools do not until Save.']:[]),...(!context.dirty&&context.savedRevision!==revision?['The saved file changed after this context was published. Forma reloads it within a few seconds when the window has no unsaved changes.']:[]),...(context.selection.length>500?['Selection shortened to the first 500 layers.']:[])]};
}
