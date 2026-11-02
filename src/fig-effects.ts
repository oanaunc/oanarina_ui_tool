import {backgroundBlurPlans,BACKGROUND_BLUR_LIMITS} from './background-blur';
import {createEffect} from './effects';
import type {Effect} from './effects';
import type {DesignDocument,DesignNode} from './model';
import {progressiveEffectRegion,PROGRESSIVE_BLUR_LIMITS} from './progressive-blur';
import {number,optional} from './fig-values';
import type {Raw} from './fig-values';
const MAX_RADIUS=128;
/** The source states a ramp as two points in the layer's unit box. Forma states a direction and how far along the box it starts and ends, so the points are projected onto that direction. */
export function figProgressiveBlur(e:Raw,width:number,height:number):Effect|undefined{
 const from=optional(e.startOffset),to=optional(e.endOffset),w=width>0?width:1,h=height>0?height:1,sx=number(from.x,.5)*w,sy=number(from.y,0)*h,ex=number(to.x,.5)*w,ey=number(to.y,1)*h,length=Math.hypot(ex-sx,ey-sy);if(!(length>1e-6))return;
 const ux=(ex-sx)/length,uy=(ey-sy)/length,span=Math.abs(ux)*w+Math.abs(uy)*h,along=(x:number,y:number)=>((x-w/2)*ux+(y-h/2)*uy)/span+.5,start=Math.max(0,Math.min(.99,along(sx,sy))),end=Math.min(1,Math.max(start+.01,along(ex,ey)));
 return {...createEffect('progressive-blur'),radius:Math.max(0,Math.min(MAX_RADIUS,number(e.radius,0))),progressive:{startRadius:Math.max(0,Math.min(MAX_RADIUS,number(e.startRadius,0))),angle:Math.atan2(uy,ux)*180/Math.PI,start,end}};
}
export const figBackgroundBlur=(radius:number):Effect=>({...createEffect('background-blur'),radius:Math.max(0,Math.min(MAX_RADIUS,radius))});
const uniform=(e:Effect):Effect=>{const {progressive:_,...rest}=e;return {...rest,type:'layer-blur'};};
/** Background blurs stay wherever the source has them, up to the file's limit and the size one filter can hold. Progressive blurs have their own budgets and fall back to a uniform blur. */
export function settleFigBlurs(doc:DesignDocument,issue:(code:string,message:string)=>void){
 let entries=0,pixels=0,progressive=0;const omitted=()=>issue('background-blur','A background blur on text or a group, past the file limit of 64, or over artwork too large for one filter was omitted.'),drop=(n:DesignNode)=>{n.effects=n.effects?.filter(e=>e.type!=='background-blur');};
 for(const page of doc.pages){
  const targets=page.nodes.filter(n=>n.effects?.some(e=>e.type==='background-blur')),held=new Map(targets.map(n=>[n,n.effects!]));targets.forEach(drop);
  for(const n of targets){if(entries>=BACKGROUND_BLUR_LIMITS.entries||held.get(n)!.filter(e=>e.type==='background-blur').length!==1){omitted();continue;}n.effects=held.get(n);try{backgroundBlurPlans(page.nodes);entries++;}catch{drop(n);omitted();}}
  for(const n of page.nodes)if(n.effects?.some(e=>e.type==='progressive-blur')){const own=n.effects.filter(e=>e.type==='progressive-blur').length;let fits=own<=PROGRESSIVE_BLUR_LIMITS.perStack&&progressive+own<=PROGRESSIVE_BLUR_LIMITS.count;if(fits)try{const region=progressiveEffectRegion(n,page.nodes),cost=region.width*region.height*own;fits=pixels+cost<=PROGRESSIVE_BLUR_LIMITS.totalPixels;if(fits)pixels+=cost;}catch{fits=false;}if(fits)progressive+=own;else{n.effects=n.effects.map(e=>e.type==='progressive-blur'?uniform(e):e);issue('effect-progressive','A progressive blur beyond what Forma can draw uses a uniform blur.');}}
 }
 for(const style of doc.styles??[]){const list=style.value.effects;if(!list?.length)continue;if(list.filter(e=>e.type==='progressive-blur').length>PROGRESSIVE_BLUR_LIMITS.perStack||list.some(e=>e.type==='progressive-blur')&&++progressive>PROGRESSIVE_BLUR_LIMITS.count)style.value.effects=list.map(e=>e.type==='progressive-blur'?uniform(e):e);if(list.some(e=>e.type==='background-blur')&&(++entries>BACKGROUND_BLUR_LIMITS.entries||list.filter(e=>e.type==='background-blur').length>1))style.value.effects=style.value.effects?.filter(e=>e.type!=='background-blur');}
}
