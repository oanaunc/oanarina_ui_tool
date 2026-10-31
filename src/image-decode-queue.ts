import type {DesignNode} from './model';

/** Page images decode a few at a time, nearest the view first, so opening an image-heavy page spreads the work across frames.
 * Only embedded raster data is read, nothing is fetched, and the artwork is never changed. See docs/PERFORMANCE-BENCHMARK.md. */
export const IMAGE_DECODE_LIMITS={concurrency:2,images:256} as const;
type Camera={zoom:number;pan:{x:number;y:number}};
type Size={width:number;height:number};
const raster=(value:unknown):value is string=>typeof value==='string'&&value.startsWith('data:image/')&&!value.startsWith('data:image/svg');
export function decodeOrder(nodes:readonly DesignNode[],camera:Camera,size:Size):string[]{
 const cx=(size.width/2-camera.pan.x)/camera.zoom,cy=(size.height/2-camera.pan.y)/camera.zoom,near=new Map<string,number>();
 for(const n of nodes){
  if(n.visible===false)continue;
  const distance=Math.hypot(n.x+n.width/2-cx,n.y+n.height/2-cy),add=(src:unknown)=>{if(raster(src)&&(near.get(src)??Infinity)>distance)near.set(src,distance);};
  add(n.image);for(const paint of n.paints??[])if(paint.visible!==false&&paint.type==='image')add(paint.image);
 }
 return [...near].sort((a,b)=>a[1]-b[1]).slice(0,IMAGE_DECODE_LIMITS.images).map(entry=>entry[0]);
}
export interface DecodeRun {pending:()=>number;cancel:()=>void}
/** A failed decode is skipped: the painted layer shows its usual broken-image state. Cancel lets running decodes finish and starts no more. */
export function runDecodeQueue(urls:readonly string[],decode:(src:string)=>Promise<unknown>,onIdle?:()=>void,concurrency:number=IMAGE_DECODE_LIMITS.concurrency):DecodeRun{
 let next=0,active=0,cancelled=false;
 const pump=()=>{while(!cancelled&&active<concurrency&&next<urls.length){const src=urls[next++];active++;void decode(src).catch(()=>undefined).then(()=>{active--;pump();});}if(!cancelled&&!active&&next>=urls.length)onIdle?.();};
 pump();
 return {pending:()=>cancelled?0:urls.length-next+active,cancel:()=>{cancelled=true;}};
}
/** Holding the element keeps its decoded pixels available to the canvas until the page changes. */
export function decodeImage(src:string,held:HTMLImageElement[]){const image=new Image();image.decoding='async';image.src=src;held.push(image);return image.decode();}
