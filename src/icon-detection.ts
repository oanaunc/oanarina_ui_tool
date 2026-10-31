import type {DesignNode,VectorContour} from './model';
import type {IconCatalog} from './icon-library';
import {iconSvg,validateIconCatalog} from './icon-library';
import {parseEditableSvg} from './svg-import';
import {pathContours} from './geometry';
import {fillsFor,strokesFor} from './paints';
import {effectsFor} from './effects';
import {effectiveStrokeWidth} from './edge-strokes';
import {identity,multiply,nodeMatrix,point} from './transforms';

export const ICON_DETECTION_LIMITS={page:20000,nodes:128,depth:64,points:2048,pathBytes:100000,signatureBytes:160000,catalogPoints:200000,comparisons:1000000,tolerance:.0001,milliseconds:15000} as const;
export interface IconContourSignature {closed:boolean;points:number[][];}
export interface IconGeometrySignature {version:1;contours:IconContourSignature[];}
export interface IconGeometryIndex {entries:Map<string,{name:string;signature:IconGeometrySignature}[]>;icons:number;}
function fail(message:string):never{throw Error('Icon matching: '+message);}
const groupKinds=new Set(['frame','group','component','instance','section']);
export function iconGeometryKey(signature:IconGeometrySignature){return signature.contours.map(c=>(c.closed?'c':'o')+c.points.length).sort().join('|');}
export function validateIconGeometrySignature(value:IconGeometrySignature){if(!value||value.version!==1||!Array.isArray(value.contours)||!value.contours.length||value.contours.length>128||Object.keys(value).some(k=>!['version','contours'].includes(k)))fail('invalid bounded geometry signature.');let points=0;for(const c of value.contours){if(!c||typeof c.closed!=='boolean'||!Array.isArray(c.points)||c.points.length<1||Object.keys(c).some(k=>!['closed','points'].includes(k)))fail('invalid contour signature.');points+=c.points.length;if(points>ICON_DETECTION_LIMITS.points)fail('the selected icon exceeds 2,048 anchors.');for(const p of c.points)if(!Array.isArray(p)||p.length!==6||p.some(v=>!Number.isFinite(v)||Math.abs(v)>10000))fail('icon coordinates exceed the supported normalized range.');}if(JSON.stringify(value).length>ICON_DETECTION_LIMITS.signatureBytes)fail('geometry signature exceeds 160 KB.');}

/** Authored container geometry only; names, IDs, text, URLs and assets never enter the signature. */
export function selectedIconSignature(nodes:DesignNode[],rootId:string):IconGeometrySignature{
 if(nodes.length>ICON_DETECTION_LIMITS.page)fail('inspect an icon on a page with at most 20,000 layers.');
 const map=new Map<string,DesignNode>(),children=new Map<string,DesignNode[]>();for(const n of nodes){if(!n.id||map.has(n.id)||n.parentId==='')fail('layer identities or hierarchy are ambiguous.');map.set(n.id,n);if(n.parentId){const rows=children.get(n.parentId)??[];rows.push(n);children.set(n.parentId,rows);}}
 const root=map.get(rootId);if(!root||!groupKinds.has(root.type))fail('select an icon container with its authored viewport, rather than an individual stroke.');
 if(![root.width,root.height].every(v=>Number.isFinite(v)&&v>=8&&v<=2048))fail('the icon viewport must be 8–2,048 units per edge.');
 const contours:IconContourSignature[]=[],pending=[{n:root,m:identity,depth:0,parent:undefined as DesignNode|undefined}],seen=new Set<string>();let points=0,pathBytes=0,decodedPoints=0;
 while(pending.length){const {n,m:parentMatrix,depth,parent}=pending.pop()!;if(seen.has(n.id)||seen.size>=ICON_DETECTION_LIMITS.nodes||depth>ICON_DETECTION_LIMITS.depth)fail('the icon exceeds 128 layers or 64 acyclic levels.');seen.add(n.id);
  if(!n.visible||n.opacity<=0||n.mask||n.booleanOp||n.media||n.vectorNetwork||(n.blendMode??'normal')!=='normal'||effectsFor(n).some(e=>e.visible)||n.arrowStart&&n.arrowStart!=='none'||n.arrowEnd&&n.arrowEnd!=='none')fail('hidden or composited artwork is outside this geometry match.');
  const m=n.id===root.id?identity:multiply(parentMatrix,nodeMatrix(n,parent));if(m.some(v=>!Number.isFinite(v)))fail('the selected transform is invalid.');const descendants=children.get(n.id)??[];
  if(groupKinds.has(n.type)){if(fillsFor(n).some(p=>p.visible&&p.opacity>0)||strokesFor(n).some(s=>s.visible&&effectiveStrokeWidth(s,n)>0&&s.paint.visible&&s.paint.opacity>0)||n.id!==root.id&&n.clip)fail('container paints or nested clipping are outside this geometry match.');for(const child of descendants)pending.push({n:child,m,depth:depth+1,parent:n});continue;}
  if(descendants.length||!['path','rectangle','ellipse','line','polygon','star'].includes(n.type)||n.clip)fail('the container must contain ordinary unclipped vector shapes only.');
  if(strokesFor(n).some(s=>s.variableWidth||s.dynamic||s.calligraphic||s.dash.length||s.edgeWidths))fail('specialized strokes are outside this geometry match.');
  pathBytes+=n.path.length;for(const c of n.contours??[]){points+=c.points.length;if(points>ICON_DETECTION_LIMITS.points)fail('the selected icon exceeds 2,048 anchors.');}points+=n.points.length;
  if(pathBytes>ICON_DETECTION_LIMITS.pathBytes||points>ICON_DETECTION_LIMITS.points)fail('the selected icon exceeds its vector work budget.');
  const sx=n.type==='path'||n.type==='line'&&n.points.length>1?n.width/(n.pathWidth||n.width||1):1,sy=n.type==='path'||n.type==='line'&&n.points.length>1?n.height/(n.pathHeight||n.height||1):1,basis=multiply(m,[sx,0,0,sy,0,0]);
  const at=(p:{x:number;y:number})=>{const q=point(basis,p.x,p.y);return[q.x*24/root.width,q.y*24/root.height];};
  const decoded:VectorContour[]=pathContours(n);for(const c of decoded){decodedPoints+=c.points.length;if(decodedPoints>ICON_DETECTION_LIMITS.points)fail('decoded icon geometry exceeds 2,048 anchors.');if(!c.points.length)continue;contours.push({closed:c.closed,points:c.points.map((p,i)=>{const incoming=c.closed||i>0?p.in:undefined,outgoing=c.closed||i<c.points.length-1?p.out:undefined;return[...at(p),...at({x:p.x+(incoming?.x??0),y:p.y+(incoming?.y??0)}),...at({x:p.x+(outgoing?.x??0),y:p.y+(outgoing?.y??0)})];})});}
 }
 const signature={version:1 as const,contours};validateIconGeometrySignature(signature);return signature;
}

/** The index contains installed public geometry only and is built inside the owned worker. */
export function buildIconGeometryIndex(input:IconCatalog):IconGeometryIndex{const catalog=validateIconCatalog(input),entries:IconGeometryIndex['entries']=new Map();let points=0;for(const icon of catalog.icons){const parsed=parseEditableSvg(iconSvg(icon,24,'#123456',2),'Catalog icon');if(!parsed.complete)fail('the installed catalog has unsupported geometry.');const signature=selectedIconSignature(parsed.nodes,parsed.rootId);points+=signature.contours.reduce((sum,c)=>sum+c.points.length,0);if(points>ICON_DETECTION_LIMITS.catalogPoints)fail('the installed catalog exceeds its geometry budget.');const key=iconGeometryKey(signature),rows=entries.get(key)??[];rows.push({name:icon.name,signature});entries.set(key,rows);}return{entries,icons:catalog.icons.length};}

export function matchIconGeometry(index:IconGeometryIndex,signature:IconGeometrySignature){validateIconGeometrySignature(signature);let work=0;const tick=()=>{if(++work>ICON_DETECTION_LIMITS.comparisons)fail('this ambiguous geometry exceeds the comparison budget.');};
 const contourEqual=(a:IconContourSignature,b:IconContourSignature)=>{tick();if(a.closed!==b.closed||a.points.length!==b.points.length)return false;const count=a.points.length;for(const reverse of [false,true])for(let start=0;start<(a.closed?count:1);start++){let same=true;for(let i=0;i<count&&same;i++){tick();const x=a.points[i],y=b.points[reverse?(a.closed?(start-i+count)%count:count-1-i):(start+i)%count];for(let k=0;k<6;k++){const other=reverse&&k>=2?k<4?k+2:k-2:k;if(Math.abs(x[k]-y[other])>ICON_DETECTION_LIMITS.tolerance){same=false;break;}}}if(same)return true;}return false;};
 const matches:string[]=[];for(const row of index.entries.get(iconGeometryKey(signature))??[]){const a=signature.contours,b=row.signature.contours,edges=a.map(c=>b.flatMap((d,i)=>contourEqual(c,d)?[i]:[]));if(edges.some(e=>!e.length))continue;const owners=new Map<number,number>();const assign=(i:number,seen:Set<number>):boolean=>{for(const j of edges[i]){tick();if(seen.has(j))continue;seen.add(j);const old=owners.get(j);if(old===undefined||assign(old,seen)){owners.set(j,i);return true;}}return false;};if(a.every((_,i)=>assign(i,new Set())))matches.push(row.name);}
 return{names:matches.sort(),icons:index.icons,tolerance:ICON_DETECTION_LIMITS.tolerance};
}
