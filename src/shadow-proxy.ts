import type {DesignNode} from './model';
import {displayColor} from './color-profile';
import type {DocumentColorProfile} from './color-profile';
import {effectPadding,effectsFor} from './effects';
import type {Effect} from './effects';
import {scaledLocalPath} from './geometry';
import {fillsFor,strokesFor} from './paints';
/** Moving an SVG group makes the browser run every filter inside it again on the CPU, and a card shadow is a filter. So while the camera lands, a shadow can stand in as a bitmap of its own filter, shared by every layer with the same shape and effect. It lasts a few frames: the real filters come back as soon as the camera has landed, so what rests on the canvas is exactly what it always was. Exports never see any of this. */
export const SHADOW_LIMITS={path:4000,side:2048,bitmaps:256,buildsPerPass:4,restoredPerFrame:10} as const;
export interface ShadowRecipe {key:string;d:string;effects:Effect[];colors:string[];x:number;y:number;width:number;height:number;}
const recipes=new WeakMap<DesignNode,ShadowRecipe|null>();
const opaque=(n:DesignNode)=>fillsFor(n).some(p=>p.type==='solid'&&p.visible&&p.opacity>=1&&!/^#[\da-f]{6}(?!ff)[\da-f]{2}$/i.test(p.color));
/** Only layers whose outline is known without drawing them. A shadow reads the alpha of everything in the layer, so anything else in there, or anything see-through, needs the real filter. */
export function shadowRecipe(n:DesignNode,profile?:DocumentColorProfile,hasChildren=false):ShadowRecipe|null{
 const known=recipes.get(n);if(known!==undefined)return known;const made=build(n,profile,hasChildren);recipes.set(n,made);return made;
}
function build(n:DesignNode,profile:DocumentColorProfile|undefined,hasChildren:boolean):ShadowRecipe|null{
 const effects=effectsFor(n).filter(e=>e.visible&&e.type!=='background-blur');
 if(!effects.length||effects.some(e=>e.type!=='drop-shadow')||n.type==='text'||n.type==='spec'||n.booleanOp||n.mask||n.vectorNetwork||n.media||n.liveRepeat||n.flipX||n.flipY||n.motionScaleX!==undefined||n.motionScaleY!==undefined||hasChildren&&!n.clip||!opaque(n)||strokesFor(n).some(s=>s.visible))return null;
 const d=scaledLocalPath(n);if(!d||d.length>SHADOW_LIMITS.path)return null;const padding=Math.max(1,effectPadding(effects)),colors=effects.map(e=>displayColor(e.color,profile));
 return {key:JSON.stringify([d,n.width,n.height,n.fillRule??(n.type==='ellipse'?'evenodd':'nonzero'),effects.map((e,i)=>[colors[i],e.opacity,e.x,e.y,e.radius,e.spread])]),d,effects,colors,x:-padding,y:-padding,width:n.width+padding*2,height:n.height+padding*2};
}
const number=(v:number)=>String(Number(v.toFixed(6)));
/** The same primitives as the live filter, with the layer itself left out. */
function shadowFilter(r:ShadowRecipe){let previous='',out='';[...r.effects].reverse().forEach((e,i)=>{const p='e'+i,color=r.colors[r.effects.indexOf(e)].replace(/[<>&"]/g,''),source=e.spread!==0?p+'s':'SourceAlpha';if(e.spread!==0)out+=`<feMorphology in="SourceAlpha" operator="${e.spread>=0?'dilate':'erode'}" radius="${number(Math.abs(e.spread))}" result="${source}"/>`;out+=`<feGaussianBlur in="${source}" stdDeviation="${number(e.radius/2)}" result="${p}b"/><feOffset in="${p}b" dx="${number(e.x)}" dy="${number(e.y)}" result="${p}o"/><feFlood flood-color="${color}" flood-opacity="${number(e.opacity)}" result="${p}c"/><feComposite in="${p}c" in2="${p}o" operator="in" result="${p}"/>`;if(previous)out+=`<feMerge result="${p}"><feMergeNode in="${p}"/><feMergeNode in="${previous}"/></feMerge>`;previous=p;});return out;}
export function shadowSvg(r:ShadowRecipe,scale:number){return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(r.width*scale)}" height="${Math.ceil(r.height*scale)}" viewBox="${number(r.x)} ${number(r.y)} ${number(r.width)} ${number(r.height)}"><defs><filter id="s" filterUnits="userSpaceOnUse" x="${number(r.x)}" y="${number(r.y)}" width="${number(r.width)}" height="${number(r.height)}" color-interpolation-filters="sRGB">${shadowFilter(r)}</filter></defs><path d="${r.d}" fill="#000" filter="url(#s)"/></svg>`;}
/** Sharp enough for the zoom it's made at, and no bigger than a shadow can use. */
export function shadowScale(r:Pick<ShadowRecipe,'width'|'height'>,zoom:number,density:number){const wanted=2**Math.ceil(Math.log2(Math.max(1,zoom*density)));return Math.min(wanted,4,SHADOW_LIMITS.side/Math.max(r.width,r.height));}
interface Bitmap {url:string;image:HTMLImageElement;}
const bitmaps=new Map<string,Bitmap|'pending'|'failed'>();
async function makeBitmap(r:ShadowRecipe,scale:number,id:string){
 bitmaps.set(id,'pending');
 try{const source=new Image();source.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(shadowSvg(r,scale));await source.decode();const canvas=document.createElement('canvas');canvas.width=source.naturalWidth;canvas.height=source.naturalHeight;canvas.getContext('2d')!.drawImage(source,0,0);const blob=await new Promise<Blob|null>(done=>canvas.toBlob(done));if(!blob)throw Error('No bitmap');const url=URL.createObjectURL(blob),image=new Image();image.src=url;await image.decode();if(bitmaps.size>SHADOW_LIMITS.bitmaps){for(const [key,old] of bitmaps)if(typeof old==='object'){bitmaps.delete(key);URL.revokeObjectURL(old.url);break;}}bitmaps.set(id,{url,image});latest.set(r.key,id);}
 catch{bitmaps.set(id,'failed');}
}
const SVG_NS='http://www.w3.org/2000/svg',PROXY='data-shadow-proxy',held=new Set<SVGGraphicsElement>(),latest=new Map<string,string>();
const layerOf=(g:Element,byId:ReadonlyMap<string,DesignNode>)=>{const id=g.getAttribute('data-node-id');return id?byId.get(id):undefined;};
const proxyIn=(g:Element)=>{const first=g.firstElementChild;return first?.hasAttribute(PROXY)?first as SVGImageElement:null;};
function placeProxy(g:Element,recipe:ShadowRecipe,id:string,url:string){const image=document.createElementNS(SVG_NS,'image');image.setAttribute(PROXY,id);image.setAttribute('href',url);image.setAttribute('x',String(recipe.x));image.setAttribute('y',String(recipe.y));image.setAttribute('width',String(recipe.width));image.setAttribute('height',String(recipe.height));image.setAttribute('preserveAspectRatio','none');image.setAttribute('pointer-events','none');image.setAttribute('decoding','sync');image.setAttribute('aria-hidden','true');image.style.display='none';g.insertBefore(image,g.firstChild);return image;}
export interface ShadowContext {nodes:readonly DesignNode[];zoom:number;density:number;profile?:DocumentColorProfile;}
/** Places each bitmap, hidden, under its layer, so it has loaded by the time it shows. With build set, which is for an idle canvas, it also makes the bitmaps this view lacks. A layer mounted during a gesture borrows whatever bitmap its shadow has. */
export function prepareShadows(canvas:Element,{nodes,zoom,density,profile}:ShadowContext,build=true){
 const byId=new Map(nodes.map(n=>[n.id,n])),parents=new Set(nodes.map(n=>n.parentId));let builds=0,wanting=false;
 for(const g of canvas.querySelectorAll('[data-node-id][filter]')){const n=layerOf(g,byId);if(!n)continue;const recipe=shadowRecipe(n,profile,parents.has(n.id));if(!recipe)continue;const scale=shadowScale(recipe,zoom,density),id=scale+'|'+recipe.key,exact=bitmaps.get(id);
  if(exact==='failed')continue;if(build&&typeof exact!=='object'){wanting=true;if(exact===undefined&&builds<SHADOW_LIMITS.buildsPerPass){builds++;void makeBitmap(recipe,scale,id);}}
  const old=proxyIn(g),use=typeof exact==='object'?id:old?undefined:latest.get(recipe.key),bitmap=use===undefined?undefined:bitmaps.get(use);if(typeof bitmap!=='object'||old?.getAttribute(PROXY)===use)continue;old?.remove();placeProxy(g,recipe,use!,bitmap.url);}
 return wanting;
}
/** Swaps every placed shadow for its bitmap, in the same frame as the camera move that would have run the filters again. A layer that changed since keeps its filter. */
export function holdShadows(canvas:Element,{nodes,profile}:Pick<ShadowContext,'nodes'|'profile'>){
 const byId=new Map(nodes.map(n=>[n.id,n])),parents=new Set(nodes.map(n=>n.parentId));
 for(const image of canvas.querySelectorAll<SVGImageElement>(`[${PROXY}]`)){const g=image.parentElement as unknown as SVGGraphicsElement|null,n=g&&layerOf(g,byId),recipe=n?shadowRecipe(n,profile,parents.has(n.id)):null;if(!g||!recipe||!image.getAttribute(PROXY)!.endsWith('|'+recipe.key)||!g.hasAttribute('filter')){image.remove();continue;}g.style.filter='none';image.style.display='';held.add(g);}
}
/** Gives a few layers their real filter back. The caller repeats this each frame until it returns false. */
export function releaseShadows(count:number=SHADOW_LIMITS.restoredPerFrame){let left=count;for(const g of held){held.delete(g);if(!g.isConnected)continue;g.style.removeProperty('filter');const image=proxyIn(g);if(image)image.style.display='none';if(--left<=0)break;}return held.size>0;}
export const shadowsHeld=()=>held.size;
