import {hasArrowheads} from './arrowheads';
import {linearGradientPoints} from './linear-gradient';
import {effectiveStrokeWidth} from './edge-strokes';
import {effectsFor} from './effects';
import {cubicContours,scaledLocalPath} from './geometry';
import type {PathContour} from './geometry';
import type {DesignNode} from './model';
import {fillsFor,strokesFor} from './paints';
import type {Paint} from './paints';
import {maskRuns} from './masks';
import {backgroundBlurActive,backgroundBlurPlans} from './background-blur';
import {settlePassThroughOpacity} from './pass-through';
import {conicMesh} from './conic-paints';
import type {MeshVertex} from './conic-paints';
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
export interface PdfVectorResolvers {text?:(n:DesignNode)=>PdfTextPlan|PdfTextPlan[]|undefined;images?:boolean;}
/** Coordinates stay in the paint's 0-1 space, as in SVG object bounding box units, so a stretched layer keeps an elliptical radial. */
export interface PdfGradientOp {kind:'gradient';contours:PathContour[];matrix:Matrix;clips:PdfClip[];evenOdd:boolean;opacity:number;box:Box;form:'linear'|'radial'|'angular'|'diamond';coords:number[];stops:{position:number;color:string;alpha?:number}[];size:{width:number;height:number};mesh?:MeshVertex[];}
/** A PDF transparency group: its ops composite together, then land once with this opacity, blend or soft mask. */
export interface PdfGroupOp {kind:'group';ops:PdfOp[];opacity:number;blend?:string;mask?:{mode:'alpha'|'luminance';ops:PdfOp[]};box:Box;}
export type PdfOp=PdfFillOp|PdfStrokeOp|PdfRasterOp|PdfTextOp|PdfImageOp|PdfGradientOp|PdfGroupOp;
/** PDF's own blend names. Everything Forma offers has an exact one. */
export const PDF_BLENDS:Record<string,string>={multiply:'Multiply',screen:'Screen',overlay:'Overlay',darken:'Darken',lighten:'Lighten','color-dodge':'ColorDodge','color-burn':'ColorBurn','hard-light':'HardLight','soft-light':'SoftLight',difference:'Difference',exclusion:'Exclusion',hue:'Hue',saturation:'Saturation',color:'Color',luminosity:'Luminosity'};
/** Every op that draws, including those inside groups and mask sources. */
export function flatPdfOps(ops:readonly PdfOp[]):PdfOp[]{return ops.flatMap(op=>op.kind==='group'?[...flatPdfOps(op.mask?.ops??[]),...flatPdfOps(op.ops)]:[op]);}
export interface PdfLink {url:string;quad:{x:number;y:number}[];}
export interface PdfSelectableText {text:string;x:number;y:number;size:number;rotation:number;}
export interface PdfVectorPage {ops:PdfOp[];}
export interface PdfPageExtras {links:PdfLink[];texts:PdfSelectableText[];}
const hex=/^#[0-9a-f]{6}$/i;
const overlaps=(a:Box,b:Box)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
const union=(a:Box,b:Box):Box=>{const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y);return {x,y,width:Math.max(a.x+a.width,b.x+b.width)-x,height:Math.max(a.y+a.height,b.y+b.height)-y};};
const quadBox=(quad:{x:number;y:number}[]):Box=>{const x=Math.min(...quad.map(p=>p.x)),y=Math.min(...quad.map(p=>p.y));return {x,y,width:Math.max(...quad.map(p=>p.x))-x,height:Math.max(...quad.map(p=>p.y))-y};};
const quadOf=(m:Matrix,n:DesignNode)=>[[0,0],[n.width,0],[n.width,n.height],[0,n.height]].map(([x,y])=>point(m,x,y));
const pdfBlend=(n:DesignNode)=>n.blendMode&&Object.hasOwn(PDF_BLENDS,n.blendMode)?PDF_BLENDS[n.blendMode]:undefined;
function selfContained(n:DesignNode){return !n.liveRepeat&&!n.code&&!n.widget&&!n.media&&!n.textPath&&!n.image&&!n.vectorNetwork&&!n.derivedLayers&&!n.linkCard&&!n.slidePoll&&!n.slidePrototypeEmbed&&!n.shadow&&!n.blur&&!effectsFor(n).some(e=>e.visible)&&(!n.blendMode||['normal','pass-through'].includes(n.blendMode)||!!pdfBlend(n))&&!hasArrowheads(n);}
const solid=(paint:{type:string;visible:boolean;opacity:number;color?:unknown})=>paint.type==='solid'&&typeof paint.color==='string'&&hex.test(paint.color);
/** An image paint that maps to one placed picture: original PNG or JPEG bytes, untiled and unadjusted. */
const imagePaintable=(p:Paint)=>{if(p.type!=='image'||!p.image||p.surface||imageHasAdjustments(p)||p.scaleMode==='tile')return false;try{return ['image/png','image/jpeg'].includes(embeddedImageInfo(p.image).mime);}catch{return false;}};
/** Every gradient kind maps to a PDF shading, and transparent stops become a soft mask drawn from the same stops. */
const gradientPaintable=(p:Paint)=>['linear','radial','angular','diamond'].includes(p.type)&&!p.surface&&p.stops.length>=1&&p.stops.length<=256&&p.stops.every(s=>s.opacity>=0&&s.opacity<=1&&hex.test(s.color)&&s.position>=0&&s.position<=1);
const gradientStops=(p:Paint)=>[...p.stops].sort((x,y)=>x.position-y.position).map(s=>({position:s.position,color:s.color,...(s.opacity<1?{alpha:s.opacity}:{})}));
/** Whether one layer's own paint maps exactly to PDF path operators. */
function paintable(n:DesignNode,images=false){if(!SHAPES.has(n.type)||!selfContained(n))return false;const fills=fillsFor(n).filter(p=>p.visible&&p.opacity>0),strokes=strokesFor(n).filter(s=>s.visible&&effectiveStrokeWidth(s,n)>0&&s.paint.visible);if(n.width<=0||n.height<=0)return false;if(fills.some(p=>!solid(p)&&!gradientPaintable(p)&&!(images&&imagePaintable(p)))||strokes.some(s=>!solid(s.paint)||s.edgeWidths||s.variableWidth||s.dynamic||s.calligraphic||!Number.isFinite(s.width)))return false;return true;}
/** Vector masks use painted regions, not their color or transparency. */
const solidMask=(ops:PdfOp[]):PdfOp[]=>ops.map(op=>op.kind==='group'?{...op,opacity:1,blend:undefined,ops:solidMask(op.ops)}:op.kind==='gradient'||op.kind==='image'?{kind:'fill',contours:op.contours,matrix:op.matrix,clips:op.clips,color:'#ffffff',opacity:1,evenOdd:op.evenOdd,box:op.box}:op.kind==='raster'?op:{...op,opacity:1});
/** A pure page plan: exact path operators where a layer allows them, and raster areas in paint order everywhere else. */
export function planVectorPage(source:DesignNode[],transform?:Matrix,resolvers:PdfVectorResolvers={}):PdfVectorPage|undefined{
 const nodes=settlePassThroughOpacity(source),blurRoots=new Set<string>();let pageBlur=false;try{for(const plan of backgroundBlurPlans(nodes).values())if(backgroundBlurActive(plan)){if(plan.scope.rootId)blurRoots.add(plan.scope.rootId);else pageBlur=true;}}catch{return undefined;}if(pageBlur)return undefined;
 /* PDF has no backdrop filter, so a blur stays a picture with everything it reads. */
 const ids=new Set(nodes.map(n=>n.id)),children=new Map<string|null,DesignNode[]>();for(const n of nodes){const parent=n.parentId&&ids.has(n.parentId)?n.parentId:null;const list=children.get(parent)??[];list.push(n);children.set(parent,list);}
 const root=transform??([1,0,0,1,0,0] as Matrix);let ops:PdfOp[]=[],segments=0;
 const parse=(d:string)=>{const contours=cubicContours(d);segments+=contours.reduce((sum,c)=>sum+c.curves.length,0);return contours;};
 const raster=(n:DesignNode,clips:PdfClip[])=>{let world:Box;try{const picked=exportSelection(nodes,[n.id]),b=visualBounds(picked);world=quadBox([point(root,b.x,b.y),point(root,b.x+b.width,b.y),point(root,b.x+b.width,b.y+b.height),point(root,b.x,b.y+b.height)]);}catch{return false;}if(!(world.width>0&&world.height>0))return true;
  // A raster area joins an earlier one when nothing painted between them touches it.
  for(let i=ops.length-1;i>=0;i--){const op=ops[i];if(op.kind==='raster'&&JSON.stringify(op.clips)===JSON.stringify(clips)){op.ids.push(n.id);op.box=union(op.box,world);return true;}if(overlaps(op.box,world))break;}ops.push({kind:'raster',ids:[n.id],clips,box:world});return true;};
 /** Runs a body with its ops gathered aside. */
 const collect=(body:()=>boolean)=>{const outer=ops;ops=[];const done=body(),inner=ops;ops=outer;return done?inner:undefined;},boxOf=(list:PdfOp[])=>list.map(o=>o.box).reduce(union);
 const scope=(needed:boolean,opacity:number,blend:string|undefined,body:()=>boolean)=>{if(!needed)return body();const inner=collect(body);if(!inner)return false;if(inner.length)ops.push({kind:'group',ops:inner,opacity,...(blend?{blend}:{}),box:boxOf(inner)});return true;};
 const visit=(n:DesignNode,clips:PdfClip[]):boolean=>{if(!n.visible||n.type==='slice')return true;const kids=n.booleanOp?[]:children.get(n.id)??[],blend=pdfBlend(n);if(n.exportGhost)return scope(n.opacity<1||!!blend,n.opacity,blend,()=>siblings(kids,n,clips));
  if(n.type==='text')return scope(!!blend,1,blend,()=>{const text=resolvers.text?.(n);if(!text)return raster(n,clips);const m=multiply(root,worldMatrix(n,nodes)),base=quadBox(quadOf(m,n)),pad=n.fontSize*Math.max(Math.hypot(m[0],m[1]),Math.hypot(m[2],m[3]))*.5;for(const plan of [text].flat())ops.push({kind:'text',...plan,matrix:m,clips,box:{x:base.x-pad,y:base.y-pad,width:base.width+2*pad,height:base.height+2*pad}});return true;});
  if(!paintable(n,resolvers.images)||blurRoots.has(n.id))return scope(!!blend,1,blend,()=>raster(n,clips));
  const m=multiply(root,worldMatrix(n,nodes)),fills=fillsFor(n).filter(p=>p.visible&&p.opacity>0),strokes=strokesFor(n).filter(s=>s.visible&&effectiveStrokeWidth(s,n)>0&&s.paint.visible),d=fills.length||strokes.length||n.clip?scaledLocalPath(n):'';let contours:PathContour[]=[];if(d)contours=parse(d);const box=quadBox(quadOf(m,n)),evenOdd=n.fillRule==='evenodd',grouped=!!blend||n.opacity<1&&(kids.length>0||fills.length+strokes.length>1)||!!n.isolate&&kids.length>0,alpha=grouped?1:n.opacity;
  return scope(grouped,n.opacity,blend,()=>{for(const p of [...fills].reverse())if(p.type==='image')ops.push({kind:'image',...planPdfImage(p,n),contours,matrix:m,clips,evenOdd,opacity:p.opacity*alpha,box});else if(p.type==='linear'||p.type==='radial'){const [a,b]=linearGradientPoints(p);ops.push({kind:'gradient',contours,matrix:m,clips,evenOdd,opacity:p.opacity*alpha,box,form:p.type,coords:p.type==='linear'?[a.x,a.y,b.x,b.y]:[p.cx+(p.focalX??0)*p.radius,p.cy+(p.focalY??0)*p.radius,0,p.cx,p.cy,p.radius],stops:gradientStops(p),size:{width:n.width,height:n.height}});}else if(p.type==='angular'||p.type==='diamond')ops.push({kind:'gradient',contours,matrix:m,clips,evenOdd,opacity:p.opacity*alpha,box,form:p.type,coords:[p.cx,p.cy,p.angle,p.radius],stops:gradientStops(p),size:{width:n.width,height:n.height},mesh:conicMesh(p)});else ops.push({kind:'fill',contours,matrix:m,clips,color:p.color as string,opacity:p.opacity*alpha,evenOdd,box});
   for(const s of [...strokes].reverse()){const width=effectiveStrokeWidth(s,n),outset=width*(s.align==='center'?.5:s.align==='outside'?1:0),closed=contours.length===1&&contours[0].closed,local:PdfClip|undefined=s.align==='inside'?{contours,matrix:m,evenOdd}:s.align==='outside'?{contours:[...parse('M-100000 -100000H100000V100000H-100000Z'),...contours],matrix:m,evenOdd:true}:undefined;if(s.align!=='center'&&!closed)return raster(n,clips);const scale=Math.max(Math.hypot(m[0],m[1]),Math.hypot(m[2],m[3]));ops.push({kind:'stroke',contours,matrix:m,clips:local?[...clips,local]:clips,color:s.paint.color as string,opacity:s.paint.opacity*alpha,width:s.align==='center'?width:width*2,dash:s.dash??[],dashOffset:s.dashOffset??0,cap:s.cap==='round'||s.cap==='square'?s.cap:'butt',join:s.join==='round'||s.join==='bevel'?s.join:'miter',miterLimit:s.miterLimit??4,box:{x:box.x-outset*scale,y:box.y-outset*scale,width:box.width+2*outset*scale,height:box.height+2*outset*scale}});}
   return siblings(kids,n,n.clip&&contours.length?[...clips,{contours,matrix:m,evenOdd}]:clips);});};
 const ordered=(list:DesignNode[],parent?:DesignNode)=>parent?.layout!=='none'&&parent?.layoutStacking==='first-on-top'?[...list].reverse():list;
 /** A mask covers its run of following siblings, exactly as the canvas draws them. Its own artwork paints only the soft mask. */
 const siblings=(list:DesignNode[],parent:DesignNode|undefined,clips:PdfClip[]):boolean=>{const runs=maskRuns(list);for(const run of parent?.layout!=='none'&&parent?.layoutStacking==='first-on-top'?runs.reverse():runs){if(!run.source){for(const c of ordered(run.nodes,parent))if(!visit(c,clips))return false;continue;}const source=run.source,art=collect(()=>visit({...source,mask:undefined},clips)),covered=collect(()=>ordered(run.nodes,parent).every(c=>visit(c,clips)));if(!art||!covered)return false;if(covered.length)ops.push({kind:'group',ops:covered,opacity:1,mask:{mode:source.mask!.mode==='luminance'?'luminance':'alpha',ops:source.mask!.mode==='vector'?solidMask(art):art},box:boxOf(covered)});}return true;};
 if(!siblings(children.get(null)??[],undefined,[]))return undefined;
 if(segments>PDF_SEGMENT_LIMIT||flatPdfOps(ops).filter(o=>o.kind==='raster').length>PDF_RASTER_AREA_LIMIT)return undefined;return {ops};
}
const safeLink=(url:string)=>/^(https?:\/\/|mailto:)/i.test(url)&&url.length<=2048&&!/[\u0000-\u001f]/.test(url);
/** Live links and an invisible text layer, independent of how the artwork itself is drawn. */
export function planPageExtras(nodes:DesignNode[],transform?:Matrix,live:ReadonlySet<string>=new Set()):PdfPageExtras{const root=transform??([1,0,0,1,0,0] as Matrix),links:PdfLink[]=[],texts:PdfSelectableText[]=[],byId=new Map(nodes.map(n=>[n.id,n]));for(const n of nodes){let parent:DesignNode|undefined=n,visible=true;const seen=new Set<string>();while(parent&&!seen.has(parent.id)){seen.add(parent.id);if(!parent.visible||parent.exportGhost&&parent.id===n.id){visible=false;break;}parent=byId.get(parent.parentId??'');}if(!visible||n.opacity<=0)continue;const m=multiply(root,worldMatrix(n,nodes));if(n.hyperlink&&safeLink(n.hyperlink)&&links.length<PDF_LINK_LIMIT)links.push({url:n.hyperlink,quad:quadOf(m,n)});if(n.type==='text'&&!n.textPath&&!live.has(n.id)&&texts.length<PDF_TEXT_LIMIT){const det=m[0]*m[3]-m[1]*m[2],scale=Math.hypot(m[0],m[1]);if(det<=0||Math.abs(Math.hypot(m[2],m[3])-scale)>1e-6*scale)continue;const rotation=Math.atan2(m[1],m[0])*180/Math.PI;for(const line of textLines(n)){const text=line.text.trim();if(!text)continue;const at=point(m,line.x,line.y);texts.push({text,x:at.x,y:at.y,size:line.fontSize*scale,rotation});if(texts.length>=PDF_TEXT_LIMIT)break;}}}return {links,texts};}
