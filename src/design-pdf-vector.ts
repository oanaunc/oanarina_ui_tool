import {arrowStyle} from './arrowheads';
import {effectiveStrokeWidth} from './edge-strokes';
import {effectsFor} from './effects';
import {cubicContours,scaledLocalPath} from './geometry';
import type {PathContour} from './geometry';
import type {DesignNode} from './model';
import {fillsFor,strokesFor} from './paints';
import type {Paint} from './paints';
import {textLines} from './text-layout';
import {exportSelection,multiply,point,visualBounds,worldMatrix} from './transforms';
import {embeddedImageInfo,imageHasAdjustments} from './image-paint';
import {planPdfImage} from './design-pdf-image';
import type {PdfImagePlan} from './design-pdf-image';
import type {PdfTextPlan} from './design-pdf-text';
import type {Matrix} from './transforms';
export const PDF_RASTER_AREA_LIMIT=64;
const PDF_SEGMENT_LIMIT=200_000,PDF_LINK_LIMIT=1000,PDF_TEXT_LIMIT=5000;
const SHAPES=new Set(['rectangle','ellipse','frame','component','instance','section','group','path','line','polygon','star']);
type Box={x:number;y:number;width:number;height:number};
export interface PdfClip {contours:PathContour[];matrix:Matrix;evenOdd:boolean;}
interface PdfPaintBase {contours:PathContour[];matrix:Matrix;clips:PdfClip[];color:string;opacity:number;box:Box;}
export interface PdfFillOp extends PdfPaintBase {kind:'fill';evenOdd:boolean;}
export interface PdfStrokeOp extends PdfPaintBase {kind:'stroke';width:number;dash:number[];dashOffset:number;cap:'butt'|'round'|'square';join:'miter'|'round'|'bevel';miterLimit:number;}
export interface PdfRasterOp {kind:'raster';ids:string[];clips:PdfClip[];box:Box;}
export interface PdfTextOp extends PdfTextPlan {kind:'text';matrix:Matrix;clips:PdfClip[];box:Box;}
export interface PdfImageOp extends PdfImagePlan {kind:'image';contours:PathContour[];matrix:Matrix;clips:PdfClip[];evenOdd:boolean;opacity:number;box:Box;}
export interface PdfVectorResolvers {text?:(n:DesignNode)=>PdfTextPlan|undefined;images?:boolean;}
export type PdfOp=PdfFillOp|PdfStrokeOp|PdfRasterOp|PdfTextOp|PdfImageOp;
export interface PdfLink {url:string;quad:{x:number;y:number}[];}
export interface PdfSelectableText {text:string;x:number;y:number;size:number;rotation:number;}
export interface PdfVectorPage {ops:PdfOp[];}
export interface PdfPageExtras {links:PdfLink[];texts:PdfSelectableText[];}
const hex=/^#[0-9a-f]{6}$/i;
const overlaps=(a:Box,b:Box)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
const union=(a:Box,b:Box):Box=>{const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);return {x,y,width:Math.max(a.x+a.width,b.x+b.width)-x,height:Math.max(a.y+a.height,b.y+b.height)-y};};
const quadBox=(quad:{x:number;y:number}[]):Box=>{const x=Math.min(...quad.map(p=>p.x)),y=Math.min(...quad.map(p=>p.y));return {x,y,width:Math.max(...quad.map(p=>p.x))-x,height:Math.max(...quad.map(p=>p.y))-y};};
const quadOf=(m:Matrix,n:DesignNode)=>[[0,0],[n.width,0],[n.width,n.height],[0,n.height]].map(([x,y])=>point(m,x,y));
function selfContained(n:DesignNode){return !n.liveRepeat&&!n.code&&!n.widget&&!n.media&&!n.textPath&&!n.image&&!n.vectorNetwork&&!n.booleanOp&&!n.mask&&!n.derivedLayers&&!n.linkCard&&!n.slidePoll&&!n.slidePrototypeEmbed&&!n.shadow&&!n.blur&&!effectsFor(n).some(e=>e.visible)&&(!n.blendMode||n.blendMode==='normal')&&!n.isolate&&arrowStyle(n,'start')==='none'&&arrowStyle(n,'end')==='none';}
const solid=(paint:{type:string;visible:boolean;opacity:number;color?:unknown})=>paint.type==='solid'&&typeof paint.color==='string'&&hex.test(paint.color);
/** An image paint that maps to one placed picture: original PNG or JPEG bytes, untiled and unadjusted. */
const imagePaintable=(p:Paint)=>{if(p.type!=='image'||!p.image||p.surface||imageHasAdjustments(p)||p.scaleMode==='tile')return false;try{return ['image/png','image/jpeg'].includes(embeddedImageInfo(p.image).mime);}catch{return false;}};
/** Whether one layer's own paint maps exactly to PDF path operators. */
function paintable(n:DesignNode,hasChildren:boolean,images=false){if(!SHAPES.has(n.type)||!selfContained(n))return false;const fills=fillsFor(n).filter(p=>p.visible&&p.opacity>0),strokes=strokesFor(n).filter(s=>s.visible&&effectiveStrokeWidth(s,n)>0&&s.paint.visible);if(fills.some(p=>!solid(p)&&!(images&&imagePaintable(p)))||strokes.some(s=>!solid(s.paint)||s.edgeWidths||s.variableWidth||s.dynamic||s.calligraphic||!Number.isFinite(s.width)))return false;if(n.opacity<1&&(hasChildren||fills.length+strokes.length>1))return false;return true;}
/** A pure page plan: exact path operators where a layer allows them, and raster areas in paint order everywhere else. */
export function planVectorPage(nodes:DesignNode[],transform?:Matrix,resolvers:PdfVectorResolvers={}):PdfVectorPage|undefined{
 const ids=new Set(nodes.map(n=>n.id)),children=new Map<string|null,DesignNode[]>();for(const n of nodes){const parent=n.parentId&&ids.has(n.parentId)?n.parentId:null;const list=children.get(parent)??[];list.push(n);children.set(parent,list);}
 const root=transform??([1,0,0,1,0,0] as Matrix),ops:PdfOp[]=[];let segments=0;
 const parse=(d:string)=>{const contours=cubicContours(d);segments+=contours.reduce((sum,c)=>sum+c.curves.length,0);return contours;};
 const raster=(n:DesignNode,clips:PdfClip[])=>{let world:Box;try{const picked=exportSelection(nodes,[n.id]),b=visualBounds(picked);world=quadBox([point(root,b.x,b.y),point(root,b.x+b.width,b.y),point(root,b.x+b.width,b.y+b.height),point(root,b.x,b.y+b.height)]);}catch{return false;}if(!(world.width>0&&world.height>0))return true;
  // A raster area joins an earlier one when nothing painted between them touches it.
  for(let i=ops.length-1;i>=0;i--){const op=ops[i];if(op.kind==='raster'&&JSON.stringify(op.clips)===JSON.stringify(clips)){op.ids.push(n.id);op.box=union(op.box,world);return true;}if(overlaps(op.box,world))break;}ops.push({kind:'raster',ids:[n.id],clips,box:world});return true;};
 const visit=(n:DesignNode,clips:PdfClip[]):boolean=>{if(!n.visible||n.type==='slice')return true;const kids=children.get(n.id)??[];if(n.exportGhost){for(const c of ordered(kids,n))if(!visit(c,clips))return false;return true;}
  if(n.type==='text'){const text=resolvers.text?.(n);if(!text)return raster(n,clips);const m=multiply(root,worldMatrix(n,nodes)),base=quadBox(quadOf(m,n)),pad=n.fontSize*Math.max(Math.hypot(m[0],m[1]),Math.hypot(m[2],m[3]))*.5;ops.push({kind:'text',...text,matrix:m,clips,box:{x:base.x-pad,y:base.y-pad,width:base.width+2*pad,height:base.height+2*pad}});return true;}if(!paintable(n,kids.length>0,resolvers.images)||kids.some(c=>c.mask))return raster(n,clips);
  const m=multiply(root,worldMatrix(n,nodes)),fills=fillsFor(n).filter(p=>p.visible&&p.opacity>0),strokes=strokesFor(n).filter(s=>s.visible&&effectiveStrokeWidth(s,n)>0&&s.paint.visible),d=fills.length||strokes.length||n.clip?scaledLocalPath(n):'';let contours:PathContour[]=[];if(d)contours=parse(d);const box=quadBox(quadOf(m,n)),evenOdd=n.fillRule==='evenodd',alpha=n.opacity;
  for(const p of [...fills].reverse())if(p.type==='image')ops.push({kind:'image',...planPdfImage(p,n),contours,matrix:m,clips,evenOdd,opacity:p.opacity*alpha,box});else ops.push({kind:'fill',contours,matrix:m,clips,color:p.color as string,opacity:p.opacity*alpha,evenOdd,box});
  for(const s of [...strokes].reverse()){const width=effectiveStrokeWidth(s,n),outset=width*(s.align==='center'?.5:s.align==='outside'?1:0),closed=contours.length===1&&contours[0].closed,local:PdfClip|undefined=s.align==='inside'?{contours,matrix:m,evenOdd}:s.align==='outside'?{contours:[...parse('M-100000 -100000H100000V100000H-100000Z'),...contours],matrix:m,evenOdd:true}:undefined;if(s.align!=='center'&&!closed)return raster(n,clips);const scale=Math.max(Math.hypot(m[0],m[1]),Math.hypot(m[2],m[3]));ops.push({kind:'stroke',contours,matrix:m,clips:local?[...clips,local]:clips,color:s.paint.color as string,opacity:s.paint.opacity*alpha,width:s.align==='center'?width:width*2,dash:s.dash??[],dashOffset:s.dashOffset??0,cap:s.cap==='round'||s.cap==='square'?s.cap:'butt',join:s.join==='round'||s.join==='bevel'?s.join:'miter',miterLimit:s.miterLimit??4,box:{x:box.x-outset*scale,y:box.y-outset*scale,width:box.width+2*outset*scale,height:box.height+2*outset*scale}});}
  const inner=n.clip&&contours.length?[...clips,{contours,matrix:m,evenOdd}]:clips;for(const c of ordered(kids,n))if(!visit(c,inner))return false;return true;};
 const ordered=(list:DesignNode[],parent?:DesignNode)=>parent?.layout!=='none'&&parent?.layoutStacking==='first-on-top'?[...list].reverse():list;
 const top=children.get(null)??[];if(top.some(n=>n.mask))return undefined;for(const n of top)if(!visit(n,[]))return undefined;
 if(segments>PDF_SEGMENT_LIMIT||ops.filter(o=>o.kind==='raster').length>PDF_RASTER_AREA_LIMIT)return undefined;return {ops};
}
const safeLink=(url:string)=>/^(https?:\/\/|mailto:)/i.test(url)&&url.length<=2048&&!/[\u0000-\u001f]/.test(url);
/** Live links and an invisible text layer, independent of how the artwork itself is drawn. */
export function planPageExtras(nodes:DesignNode[],transform?:Matrix,live:ReadonlySet<string>=new Set()):PdfPageExtras{const root=transform??([1,0,0,1,0,0] as Matrix),links:PdfLink[]=[],texts:PdfSelectableText[]=[],byId=new Map(nodes.map(n=>[n.id,n]));for(const n of nodes){let parent:DesignNode|undefined=n,visible=true;const seen=new Set<string>();while(parent&&!seen.has(parent.id)){seen.add(parent.id);if(!parent.visible||parent.exportGhost&&parent.id===n.id){visible=false;break;}parent=byId.get(parent.parentId??'');}if(!visible||n.opacity<=0)continue;const m=multiply(root,worldMatrix(n,nodes));if(n.hyperlink&&safeLink(n.hyperlink)&&links.length<PDF_LINK_LIMIT)links.push({url:n.hyperlink,quad:quadOf(m,n)});if(n.type==='text'&&!n.textPath&&!live.has(n.id)&&texts.length<PDF_TEXT_LIMIT){const det=m[0]*m[3]-m[1]*m[2],scale=Math.hypot(m[0],m[1]);if(det<=0||Math.abs(Math.hypot(m[2],m[3])-scale)>1e-6*scale)continue;const rotation=Math.atan2(m[1],m[0])*180/Math.PI;for(const line of textLines(n)){const text=line.text.trim();if(!text)continue;const at=point(m,line.x,line.y);texts.push({text,x:at.x,y:at.y,size:line.fontSize*scale,rotation});if(texts.length>=PDF_TEXT_LIMIT)break;}}}return {links,texts};}
