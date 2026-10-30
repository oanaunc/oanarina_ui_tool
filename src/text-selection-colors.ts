import type {DesignNode} from './model';
import {safeTextRange,textSegments} from './rich-text';
import {fillsFor} from './paints';

export interface SelectionColor {kind:'layer'|'override';color:string;units:number;}
export interface SelectionFill {type:string;color?:string;opacity:number;}
/** Character style colors, not a composited screen-color estimate. Matches Artwork's inheritance test. */
export function textSelectionColors(n:DesignNode,start:number,end:number){
 if(n.type!=='text'||![start,end].every(Number.isInteger)||start<0||end<start||end>n.text.length)throw Error('Choose a valid text selection.');
 const range=safeTextRange(n.text,start,end),colors=new Map<string,SelectionColor>();
 const fills:SelectionFill[]=fillsFor(n).filter(p=>p.visible&&p.opacity>0).map(p=>({type:p.type,...(p.type==='solid'?{color:p.color.toUpperCase()}:{}),opacity:p.opacity}));
 for(const segment of textSegments(n,range.start,range.end)){
  const fill=segment.style.fill??n.fill,kind=fill===n.fill?'layer':'override',color=kind==='layer'?'':canonicalColor(fill),key=kind+':'+color,existing=colors.get(key);
  if(existing)existing.units+=segment.end-segment.start;else colors.set(key,{kind,color,units:segment.end-segment.start});
 }
 const rows=[...colors.values()];return {start:range.start,end:range.end,caret:range.start===range.end,rows:rows.slice(0,128),total:rows.length,fills};
}
function canonicalColor(color:string){if(color==='none')return color;let hex=color.slice(1);if(hex.length===3||hex.length===4)hex=[...hex].map(c=>c+c).join('');if(hex.length===8&&hex.slice(-2).toLowerCase()==='ff')hex=hex.slice(0,-2);return '#'+hex.toUpperCase();}
/** The existing native picker edits opaque RGB; the summary retains the actual alpha/none setting. */
export function textColorPickerValue(color:string|undefined){return color&&/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(color)?canonicalColor(color).slice(0,7):'#202027';}
