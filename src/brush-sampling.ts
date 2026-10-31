import paper from 'paper/dist/paper-core.js';
import type {DesignDocument,DesignNode,VectorContour} from './model';
import {pathContours} from './geometry';
import {fillsFor,strokesFor,validatePaint,validateStrokeStack} from './paints';
import {effectiveStrokeWidth} from './edge-strokes';
import {effectsFor} from './effects';
import {identity,multiply,nodeMatrix,point} from './transforms';
import type {Matrix} from './transforms';
import {validateVectorBrushStamp,VECTOR_STAMP_LIMITS} from './brush-vector-stamp';
import type {VectorBrushStamp} from './brush-vector-stamp';

const scope=new paper.PaperScope();scope.setup(new scope.Size(1,1));
export interface SampledBrush {stamp:VectorBrushStamp;aspect:number;color:string;sourceName:string;}
const proofs=new WeakMap<SampledBrush,string>();
function freeze<T>(v:T):T{if(v&&typeof v==='object'){Object.freeze(v);for(const child of Object.values(v))freeze(child);}return v;}
function fail(message:string):never{throw Error('Sample brush: '+message);}
/** Sampling retains no source IDs, controller state, annotations, fonts, or paint resources. */
export function sampleVectorBrush(d:DesignDocument,pageId:string,id:string):SampledBrush {
 if(d.workspace&&d.workspace!=='design'||d.pages.length>1000)fail('use a Design file with at most 1,000 pages.');let total=0;for(const p of d.pages)if((total+=p.nodes.length)>100000)fail('the source exceeds 100,000 layers.');
 const page=d.pages.find(p=>p.id===pageId);if(!page||page.nodes.length>20000)fail('use an existing page with at most 20,000 layers.');const map=new Map(page.nodes.map(n=>[n.id,n]));if(map.size!==page.nodes.length||!id||!map.has(id))fail('the source identity is missing or ambiguous.');const n=map.get(id)!;
 const masked=new Set<string>(),runs=new Set<string|null>();for(const v of page.nodes){const parent=v.parentId||null;if(v.mask)runs.add(parent);if(runs.has(parent))masked.add(v.id);}
 const lineage:DesignNode[]=[],seen=new Set<string>();let at:DesignNode|undefined=n;while(at){if(seen.has(at.id)||seen.size>=64)fail('source ancestry must be acyclic within 64 levels.');seen.add(at.id);lineage.unshift(at);if(!at.visible||at.locked||at.opacity!==1||at.clip||at.mask||masked.has(at.id)||at.layout!=='none'||at.booleanOp||at.instanceRootId||at.sourceId||at.componentId||at.componentMetadata||at.slotInstance||at.slotOverrides||['component','instance','slice'].includes(at.type)||at.media||at.prototypeInput||effectsFor(at).some(e=>e.visible)||(at.blendMode??'normal')!=='normal')fail('use visible unlocked opaque independent artwork without masks, clips, effects, components, slots, Auto layout or controllers.');if(at.parentId!==null&&(typeof at.parentId!=='string'||!at.parentId||!map.has(at.parentId)))fail('a source ancestor is missing or has an invalid identity.');at=at.parentId?map.get(at.parentId):undefined;}
 if(page.motion?.tracks.some(t=>t.keyframes.length&&seen.has(t.nodeId)))fail('remove affected Motion tracks before sampling.');
 if(!['path','rectangle','polygon','star'].includes(n.type)||page.nodes.some(c=>c.parentId===id)||n.radius||n.corners?.some(Boolean)||n.cornerSmoothing||n.vectorNetwork||n.textPath||n.textOutline||n.image||n.arcInner||n.arcStart||n.arcSweep!==undefined)fail('select one closed plain path, unrounded rectangle, polygon or star without children.');
 if(n.path.length>16384||(n.path.match(/[a-z]/gi)?.length??0)>512||/[Aa]/.test(n.path)||n.points.length>128||(n.contours?.length??0)>16||(n.contours?.reduce((a,c)=>a+c.points.length,0)??0)>128)fail('source geometry exceeds the bounded non-arc, 128-anchor subset.');
 validateStrokeStack(n.strokes);if(n.paints&&n.paints.length>100)fail('source fills exceed the 100-paint budget.');const fills=fillsFor(n);fills.forEach(validatePaint);const visible=fills.filter(p=>p.visible&&p.opacity>0);if(fills.some(p=>p.type!=='solid')||visible.length!==1||visible[0].opacity!==1||!/^#[0-9a-f]{6}$/i.test(visible[0].color)||strokesFor(n).some(s=>s.visible&&s.paint.visible&&s.paint.opacity>0&&effectiveStrokeWidth(s,n)>0))fail('use one opaque six-digit solid fill with no visible strokes or resource paints.');
 const contours=pathContours(n);if(!contours.length||contours.length>16||contours.some(c=>!c.closed||c.points.length<3)||contours.reduce((a,c)=>a+c.points.length,0)>128)fail('use 1–16 closed contours with 3–128 total anchors.');
 let m:Matrix=identity;for(const v of lineage)m=multiply(m,nodeMatrix(v,v.parentId?map.get(v.parentId):undefined));const sx=n.type==='path'?n.width/(n.pathWidth||n.width||1):1,sy=n.type==='path'?n.height/(n.pathHeight||n.height||1):1;m=multiply(m,[sx,0,0,sy,0,0]);
 // Position is deliberately removed: sampling a brush copies its silhouette, not its page location.
 const norm=Math.max(Math.abs(m[0])+Math.abs(m[2]),Math.abs(m[1])+Math.abs(m[3])),det=m[0]*m[3]-m[1]*m[2],inverseNorm=Math.max(Math.abs(m[3])+Math.abs(m[2]),Math.abs(m[1])+Math.abs(m[0]))/Math.abs(det);if(![...m,norm,inverseNorm].every(Number.isFinite)||!norm||Math.abs(det)<1e-12||norm*inverseNorm>10000)fail('the source transform or path basis is collapsed or too ill-conditioned to normalize.');m=[m[0],m[1],m[2],m[3],0,0];
 const transformed=contours.map(c=>({closed:true,points:c.points.map(p=>{const a=point(m,p.x,p.y),handle=(h:{x:number;y:number}|undefined)=>h?point(m,h.x,h.y):undefined;return {...a,...(p.in?{in:handle(p.in)}:{}),...(p.out?{out:handle(p.out)}:{})};})}));
 scope.activate();const compound=new scope.CompoundPath({insert:false});try{for(const c of transformed){const path=new scope.Path({insert:false,closed:true});for(const p of c.points)path.add(new scope.Segment(new scope.Point(p.x,p.y),p.in?new scope.Point(p.in.x,p.in.y):undefined,p.out?new scope.Point(p.out.x,p.out.y):undefined));compound.addChild(path);}const b=compound.bounds;if(![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<1e-5||b.height<1e-5||Math.max(Math.abs(b.x),Math.abs(b.y),b.width,b.height)>1e9)fail('the source silhouette is degenerate or exceeds its normalization budget.');const aspect=b.height/b.width;if(aspect<.1||aspect>4)fail('the sampled silhouette height/width must be between 0.1 and 4.');
  // Existing contour serialization rounds to 5 decimals. Bound its normalized error at maximum brush size, aspect and scatter size; reserve 0.001 for normalized serialization.
  if(norm*.5e-5/Math.min(b.width,b.height)*100*38.912+.001>.01)fail('source coordinate serialization would exceed 0.01 design units at the maximum stamp size.');
  const round=(v:number)=>Math.round(v*1e6)/1e6,normalized:VectorContour[]=transformed.map(c=>({closed:true,points:c.points.map(p=>({x:round((p.x-b.x)/b.width*100),y:round((p.y-b.y)/b.height*100),...(p.in?{in:{x:round(p.in.x/b.width*100),y:round(p.in.y/b.height*100)}}:{}),...(p.out?{out:{x:round(p.out.x/b.width*100),y:round(p.out.y/b.height*100)}}:{})}))})),stamp:VectorBrushStamp={version:1,fillRule:n.fillRule??'nonzero',contours:normalized};validateVectorBrushStamp(stamp);if(new TextEncoder().encode(JSON.stringify(stamp)).length>VECTOR_STAMP_LIMITS.bytes)fail('the normalized stamp exceeds 16 KB.');const result:SampledBrush={stamp,aspect,color:visible[0].color,sourceName:n.name.slice(0,80)};proofs.set(result,JSON.stringify([d.id,pageId,id,m,stamp,aspect,visible[0].color,result.sourceName]));return freeze(result);
 }finally{compound.remove();}
}
export function sameSampledBrush(sample:SampledBrush,d:DesignDocument,pageId:string,id:string){const original=proofs.get(sample);if(!original)return false;return proofs.get(sampleVectorBrush(d,pageId,id))===original;}
