import type {DesignDocument} from './model';
import type {DesignStyle} from './design-systems';
import {createPaint,fillsFor,validatePaint} from './paints';
import type {Paint} from './paints';
import type {DesignNode} from './model';
/** A color style is a paint style. Layers link to it by id, so changing it changes every layer that uses it. */
export const styleFills=(style:Pick<DesignStyle,'value'>):Paint[]=>fillsFor({fill:style.value.fill??'none',...style.value} as DesignNode);
export const stylePaint=(style:Pick<DesignStyle,'value'>):{color:string;opacity:number}=>{const first=styleFills(style)[0];return {color:first?.color??'#000000',opacity:first?.opacity??1};};
export const styleIsSolid=(style:Pick<DesignStyle,'value'>)=>{const fills=styleFills(style);return fills.length===1&&fills[0].type==='solid'&&!fills[0].surface;};
/** A stroke takes one paint, so a style holding several gives it the top one that shows. */
export const styleStrokePaint=(style:Pick<DesignStyle,'value'>)=>{const fills=styleFills(style);return fills.find(p=>p.visible)??fills[0]??createPaint('#000000');};
const gradientTypes:Paint['type'][]=['linear','radial','angular','diamond'];
export const isGradientPaint=(p:Paint)=>!p.surface&&gradientTypes.includes(p.type);
/** One solid or gradient paint can be edited in the color panel. Anything else stays in Manage styles. */
export const styleEditable=(style:Pick<DesignStyle,'value'>)=>{const fills=styleFills(style);return fills.length===1&&(fills[0].type==='solid'&&!fills[0].surface||isGradientPaint(fills[0]));};
export const paintBackground=(p:Paint)=>{if(!isGradientPaint(p)||!p.stops?.length)return p.color;const stops=[...p.stops].sort((a,b)=>a.position-b.position).map(s=>`${s.color} ${s.position*100}%`).join(',');return p.type==='angular'?`conic-gradient(${stops})`:p.type==='linear'?`linear-gradient(135deg,${stops})`:`radial-gradient(circle,${stops})`;};
export function swatchBackground(style:Pick<DesignStyle,'value'>){const p=styleFills(style)[0];if(!p)return 'transparent';if(p.type==='solid'||isGradientPaint(p))return paintBackground(p);return '#8f8f8f';}
const find=(d:DesignDocument,id:string)=>{const style=d.styles?.find(s=>s.id===id&&s.type==='paint');if(!style)throw Error('This color style no longer exists.');return style;};
/** The paint keeps its id, so a fill row that shows this style stays where it is while the color changes. */
export function setStyleColor(d:DesignDocument,id:string,color:string,opacity:number){const style=find(d,id),paint=createPaint(color);paint.opacity=opacity;paint.id=style.value.paints?.[0]?.id??paint.id;style.value={fill:color,paints:[paint],gradient:false};}
/** Changes a style's single paint in place, as a gradient edit or a switch between solid and gradient. */
export function setStylePaint(d:DesignDocument,id:string,patch:Partial<Paint>){const style=find(d,id),current=styleFills(style)[0],paint={...current,...patch,id:style.value.paints?.[0]?.id??current.id};validatePaint(paint);style.value={fill:paint.color,paints:[paint],gradient:false};}
export function renameStyle(d:DesignDocument,id:string,name:string,description?:string){const clean=name.trim();if(!clean)throw Error('Give the style a name.');if(clean.length>512)throw Error('Use a shorter style name.');const style=find(d,id);style.name=clean;if(description!==undefined)style.description=description.slice(0,4096);}
/** Layers keep the color they had and simply stop following the style. */
export function deleteStyle(d:DesignDocument,id:string){find(d,id);d.styles=d.styles!.filter(s=>s.id!==id);for(const n of d.pages.flatMap(p=>p.nodes)){if(n.styleIds?.paint===id)delete n.styleIds.paint;if(n.styleIds?.strokePaint===id)delete n.styleIds.strokePaint;}}
/** Survives the fill row rebuilding underneath the panel when a layer first takes on a style's paint. Closing the panel clears it. */
export const styleEditing={id:''};
export const nextStyleName=(styles:readonly {name:string}[]=[])=>{for(let i=1;;i++){const name='Color '+i;if(!styles.some(s=>s.name===name))return name;}};
/** A slash in a name makes a folder, as in the style manager. */
export const styleFolder=(name:string)=>{const at=name.lastIndexOf('/');return at<0?{folder:'',label:name}:{folder:name.slice(0,at).trim(),label:name.slice(at+1).trim()||name};};
