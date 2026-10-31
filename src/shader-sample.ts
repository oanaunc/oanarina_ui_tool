import type {DesignNode} from './model';
import {descendants} from './model';
import {effectsFor} from './effects';
import {shaderEpochBump} from './shader-runtime';
/** Layer pixels for shaders. A layer is drawn once, without its effects, in its own unrotated axes, then handed to WebGL as a read-only texture. Nothing returns to the document. */
export const SAMPLE_LIMITS={edge:1024,entries:32} as const;
export interface SampleSource {key:string;image:TexImageSource;}
const ready=new Map<string,HTMLImageElement>(),pending=new Map<string,Promise<void>>();
type SampleExporter=(nodes:DesignNode[],viewport:{x:number;y:number;width:number;height:number},dimensions:{width:number;height:number})=>string;
let exporter:SampleExporter|undefined;
/** The editor supplies its SVG writer. The self-contained prototype player has none, so sampled effects pass through there. */
export const registerSampleExporter=(fn:SampleExporter)=>{exporter=fn;};
/** Plain painted content only: the layer and what it contains, with no effects, so the shader cannot read itself. */
export function sampleSubject(n:DesignNode,nodes:DesignNode[]){const ids=new Set(descendants(nodes,[n.id]));return nodes.filter(a=>a.id===n.id||ids.has(a.id)).map(a=>a.id===n.id?{...a,parentId:null,rotation:0,flipX:false,flipY:false,motionScaleX:undefined,motionScaleY:undefined,effects:[],shadow:false,blur:0,opacity:1,hyperlink:undefined}:a);}
export const sampleKey=(subject:DesignNode[],width:number,height:number)=>{let h=2166136261;const text=JSON.stringify(subject);for(let i=0;i<text.length;i++)h=Math.imul(h^text.charCodeAt(i),16777619);return [text.length,h>>>0,width,height].join(':');};
export function sampleImage(key:string):SampleSource|undefined{const image=ready.get(key);if(!image)return undefined;ready.delete(key);ready.set(key,image);return {key,image};}
/** Resolves when the pixels exist. Re-renders any waiting artwork through the shader epoch. */
export function loadSample(key:string,subject:DesignNode[],viewport:{x:number;y:number;width:number;height:number},dimensions:{width:number;height:number}):Promise<void>{if(ready.has(key))return Promise.resolve();const running=pending.get(key);if(running)return running;const draw=exporter;if(!draw)return Promise.resolve();const work=(async()=>{const url=URL.createObjectURL(new Blob([draw(subject,viewport,dimensions)],{type:'image/svg+xml'}));try{const image=new Image();await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('The layer could not be read for its shader.'));image.src=url;});await image.decode().catch(()=>{});ready.set(key,image);while(ready.size>SAMPLE_LIMITS.entries)ready.delete(ready.keys().next().value!);shaderEpochBump();}finally{URL.revokeObjectURL(url);pending.delete(key);}})();pending.set(key,work);work.catch(()=>{});return work;}
export const sampleSize=(width:number,height:number)=>{const fit=Math.min(2,SAMPLE_LIMITS.edge/Math.max(width,height,1));return {width:Math.max(1,Math.round(width*fit)),height:Math.max(1,Math.round(height*fit))};};
/** Export paths render synchronously, so anything sampled must be drawn first. */
export async function prepareShaderSamples(nodes:DesignNode[]){for(const n of nodes)for(const e of effectsFor(n))if(e.visible&&e.type==='shader'&&e.shaderMode==='sample'){const width=Math.max(1,n.width),height=Math.max(1,n.height),subject=sampleSubject(n,nodes),size=sampleSize(width,height);await loadSample(sampleKey(subject,size.width,size.height),subject,{x:n.x,y:n.y,width,height},size).catch(()=>{});}}
/** Layers whose pixels were not ready when an export wrote them. They appear unfiltered, so the export says so. */
export const unsampledLayers=(nodes:DesignNode[])=>nodes.filter(n=>n.visible&&effectsFor(n).some(e=>e.visible&&e.type==='shader'&&e.shaderMode==='sample')&&!sampleImage(sampleKey(sampleSubject(n,nodes),sampleSize(Math.max(1,n.width),Math.max(1,n.height)).width,sampleSize(Math.max(1,n.width),Math.max(1,n.height)).height))).length;
