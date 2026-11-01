import type {DesignNode} from './model';
import {flag,number,optional,string} from './fig-values';
import type {Raw} from './fig-values';
/** Source auto layout and child-behavior fields inherited by instances that omit them. */
export const FIG_LAYOUT_FIELDS=['stackMode','stackSpacing','stackCounterSpacing','stackHorizontalPadding','stackVerticalPadding','stackPaddingRight','stackPaddingBottom','stackPrimarySizing','stackCounterSizing','stackPrimaryAlignItems','stackCounterAlignItems','stackWrap','stackCounterAlignContent','stackReverseZIndex','bordersTakeSpace'] as const;
const hug=(v:unknown)=>v==='RESIZE_TO_FIT'||v==='RESIZE_TO_FIT_WITH_IMPLICIT_SIZE';
/** An axis with no limit is stored as infinity, which means the same as no value here. */
const limit=(v:unknown)=>typeof v==='number'&&Math.abs(v)<1e9?v:undefined;
const size=(v:unknown)=>{const o=optional(v),inner=optional(o.value);return {x:limit(o.x??inner.x),y:limit(o.y??inner.y)};};
/** Live settings only. The stored child positions stay authoritative until the import settle check accepts them. */
export function figContainerLayout(raw:Raw):Partial<DesignNode>|undefined{
 const mode=string(raw.stackMode,'NONE');if(mode!=='HORIZONTAL'&&mode!=='VERTICAL')return;
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
export function figChildLayout(raw:Raw,parent:Pick<DesignNode,'layout'>|undefined):Partial<DesignNode>{
 const out:Partial<DesignNode>={},min=size(raw.minSize),max=size(raw.maxSize);
 if(min.x!==undefined)out.minWidth=Math.max(0,number(min.x));if(min.y!==undefined)out.minHeight=Math.max(0,number(min.y));if(max.x!==undefined)out.maxWidth=Math.max(0,number(max.x));if(max.y!==undefined)out.maxHeight=Math.max(0,number(max.y));
 if(out.minWidth!==undefined&&out.maxWidth!==undefined&&out.minWidth>out.maxWidth)delete out.maxWidth;if(out.minHeight!==undefined&&out.maxHeight!==undefined&&out.minHeight>out.maxHeight)delete out.maxHeight;
 if(parent?.layout!=='horizontal'&&parent?.layout!=='vertical')return out;
 if(raw.stackPositioning==='ABSOLUTE'){out.ignoreLayout=true;return out;}
 const horizontal=parent.layout==='horizontal',grow=number(raw.stackChildPrimaryGrow,0)>0,stretch=raw.stackChildAlignSelf==='STRETCH';
 if(grow)out[horizontal?'sizingX':'sizingY']='fill';if(stretch)out[horizontal?'sizingY':'sizingX']='fill';return out;
}
