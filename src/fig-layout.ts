import type {GridTrack} from './grid';
import type {DesignNode} from './model';
import {flag,guid,list,number,object,optional,string} from './fig-values';
import type {Raw} from './fig-values';
/** Source auto layout and child-behavior fields inherited by instances that omit them. */
export const FIG_LAYOUT_FIELDS=['stackMode','stackSpacing','stackCounterSpacing','stackHorizontalPadding','stackVerticalPadding','stackPaddingRight','stackPaddingBottom','stackPrimarySizing','stackCounterSizing','stackPrimaryAlignItems','stackCounterAlignItems','stackWrap','stackCounterAlignContent','stackReverseZIndex','bordersTakeSpace','gridRows','gridColumns','gridRowGap','gridColumnGap','gridColumnsSizing','gridRowsSizing'] as const;
const hug=(v:unknown)=>v==='RESIZE_TO_FIT'||v==='RESIZE_TO_FIT_WITH_IMPLICIT_SIZE';
/** An axis with no limit is stored as infinity, which means the same as no value here. */
const limit=(v:unknown)=>typeof v==='number'&&Math.abs(v)<1e9?v:undefined;
const size=(v:unknown)=>{const o=optional(v),inner=optional(o.value);return {x:limit(o.x??inner.x),y:limit(o.y??inner.y)};};
const MAX_TRACKS=4096;
/** Tracks are keyed by id, and their order comes from a separate position map. */
const trackOrder=(value:unknown)=>list(optional(value).entries,MAX_TRACKS).map(object).map(e=>({id:guid(e.id),position:string(e.position)})).sort((a,b)=>a.position<b.position?-1:a.position>b.position?1:0).map(e=>e.id);
export const figGridTracks=(raw:Raw)=>({columns:trackOrder(raw.gridColumns),rows:trackOrder(raw.gridRows)});
function figTracks(ids:string[],value:unknown,issue:(code:string,message:string)=>void):GridTrack[]{
 const sizes=new Map(list(optional(value).entries,MAX_TRACKS).map(object).map(e=>[guid(e.id),e.trackSize]));
 return ids.map(id=>{const size=sizes.get(id);if(size===undefined)return {sizing:'fr',value:1};const o=object(size),min=optional(o.minSizing),max=optional(o.maxSizing),low=Math.max(0,number(min.value,0)),high=Math.max(0,number(max.value,0)),kinds=string(min.type)+'|'+string(max.type);
  if(kinds==='FIXED|FIXED')return low===high?{sizing:'fixed',value:low}:{sizing:'hug',value:0,min:Math.min(low,high),max:Math.max(low,high)};if(kinds==='FLEX|FLEX'&&low>0&&low===high)return {sizing:'fr',value:low};if(kinds==='HUG|HUG')return {sizing:'hug',value:0};if(kinds==='FIXED|FLEX'&&high>0)return {sizing:'fr',value:high,min:low};if(kinds==='HUG|FLEX'&&high>0)return {sizing:'fr',value:high};
  issue('grid-track','A grid track with a size Forma cannot state became an equal share.');return {sizing:'fr',value:1};});
}
/** Live settings only. The stored child positions stay authoritative until the import settle check accepts them. */
export function figContainerLayout(raw:Raw,issue:(code:string,message:string)=>void=()=>{}):Partial<DesignNode>|undefined{
 const mode=string(raw.stackMode,'NONE');if(mode==='GRID'){const tracks=figGridTracks(raw),left=number(raw.stackHorizontalPadding,0),top=number(raw.stackVerticalPadding,0),right=number(raw.stackPaddingRight,left),bottom=number(raw.stackPaddingBottom,top);if(!tracks.columns.length||!tracks.rows.length||[left,top,right,bottom].some(v=>v<0))return;return {layout:'grid',columns:tracks.columns.length,gridRows:tracks.rows.length,gridColumns:figTracks(tracks.columns,raw.gridColumnsSizing,issue),gridRowTracks:figTracks(tracks.rows,raw.gridRowsSizing,issue),gap:number(raw.gridColumnGap,0),gapX:number(raw.gridColumnGap,0),gapY:number(raw.gridRowGap,0),padding:left,paddings:[top,right,bottom,left],sizingX:hug(raw.stackPrimarySizing)?'hug':'fixed',sizingY:hug(raw.stackCounterSizing)?'hug':'fixed',...(flag(raw.bordersTakeSpace,false)?{layoutIncludeStroke:true}:{})};}
 if(mode!=='HORIZONTAL'&&mode!=='VERTICAL')return;
 const horizontal=mode==='HORIZONTAL',left=number(raw.stackHorizontalPadding,0),top=number(raw.stackVerticalPadding,0),right=number(raw.stackPaddingRight,left),bottom=number(raw.stackPaddingBottom,top),gap=number(raw.stackSpacing,0),primary=string(raw.stackPrimaryAlignItems??raw.stackJustify,'MIN'),counter=string(raw.stackCounterAlignItems??raw.stackAlign,'MIN'),wrap=raw.stackWrap==='WRAP',counterGap=number(raw.stackCounterSpacing,gap),primaryHug=raw.stackPrimarySizing===undefined||hug(raw.stackPrimarySizing),counterHug=hug(raw.stackCounterSizing);
 if([left,top,right,bottom].some(v=>v<0))return;
 return {layout:horizontal?'horizontal':'vertical',gap,padding:left,paddings:[top,right,bottom,left],
  ...(wrap?(horizontal?{gapX:gap,gapY:counterGap}:{gapX:counterGap,gapY:gap}):{}),
  justifyContent:({CENTER:'center',MAX:'end',SPACE_BETWEEN:'space-between',SPACE_EVENLY:'space-between',SPACE_AROUND:'space-around',SPACE_EVENLY_CSS:'space-evenly'} as const)[primary as 'CENTER']??'start',
  alignItems:({CENTER:'center',MAX:'end',BASELINE:'baseline'} as const)[counter as 'CENTER']??'start',
  sizingX:(horizontal?primaryHug:counterHug)?'hug':'fixed',sizingY:(horizontal?counterHug:primaryHug)?'hug':'fixed',
  ...(wrap?{wrap:true,...(raw.stackCounterAlignContent==='SPACE_BETWEEN'?{wrapAlign:'space-between' as const}:{})}:{}),
  ...(flag(raw.stackReverseZIndex,false)?{layoutStacking:'first-on-top' as const}:{}),
  ...(flag(raw.bordersTakeSpace,false)?{layoutIncludeStroke:true}:{})};
}
/** A child's behavior inside an auto-layout parent. Grow and stretch resolve to the parent's axes. */
export function figChildLayout(raw:Raw,parent:Pick<DesignNode,'layout'>|undefined,tracks?:ReturnType<typeof figGridTracks>):Partial<DesignNode>{
 const out:Partial<DesignNode>={},min=size(raw.minSize),max=size(raw.maxSize);
 if(min.x!==undefined)out.minWidth=Math.max(0,number(min.x));if(min.y!==undefined)out.minHeight=Math.max(0,number(min.y));if(max.x!==undefined)out.maxWidth=Math.max(0,number(max.x));if(max.y!==undefined)out.maxHeight=Math.max(0,number(max.y));
 if(out.minWidth!==undefined&&out.maxWidth!==undefined&&out.minWidth>out.maxWidth)delete out.maxWidth;if(out.minHeight!==undefined&&out.maxHeight!==undefined&&out.minHeight>out.maxHeight)delete out.maxHeight;
 if(parent?.layout==='grid'){
  if(raw.stackPositioning==='ABSOLUTE'){out.ignoreLayout=true;return out;}const place=(value:unknown,ids:string[]|undefined)=>{if(value===undefined||!ids)return;const at=ids.indexOf(guid(value));return at<0?undefined:at+1;},span=(value:unknown)=>{const n=number(value,1);return Number.isInteger(n)&&n>1?Math.min(256,n):undefined;},align=(value:unknown)=>({MIN:'start',CENTER:'center',MAX:'end'} as const)[string(value) as 'MIN'],column=place(raw.gridColumnAnchor,tracks?.columns),row=place(raw.gridRowAnchor,tracks?.rows),columnSpan=span(raw.gridColumnSpan),rowSpan=span(raw.gridRowSpan),alignX=align(raw.gridChildHorizontalAlign),alignY=align(raw.gridChildVerticalAlign);
  if(column!==undefined)out.gridColumn=column;if(row!==undefined)out.gridRow=row;if(columnSpan)out.gridColumnSpan=columnSpan;if(rowSpan)out.gridRowSpan=rowSpan;if(alignX)out.gridAlignX=alignX;if(alignY)out.gridAlignY=alignY;if(number(raw.stackChildPrimaryGrow,0)>0)out.sizingX='fill';if(raw.stackChildAlignSelf==='STRETCH')out.sizingY='fill';return out;
 }
 if(parent?.layout!=='horizontal'&&parent?.layout!=='vertical')return out;
 if(raw.stackPositioning==='ABSOLUTE'){out.ignoreLayout=true;return out;}
 const horizontal=parent.layout==='horizontal',grow=number(raw.stackChildPrimaryGrow,0)>0,stretch=raw.stackChildAlignSelf==='STRETCH';
 if(grow)out[horizontal?'sizingX':'sizingY']='fill';if(stretch)out[horizontal?'sizingY':'sizingX']='fill';return out;
}
