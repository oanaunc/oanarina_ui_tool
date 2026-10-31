import {refuseVariableWidthConversion} from './variable-width';
import paper from 'paper/dist/paper-core.js';
import {geometry} from './geometry';
import {node} from './model';
import type {DesignNode,VectorContour} from './model';
import {fillsFor,strokesFor,validatePaint} from './paints';
import {detachEditedBindings} from './design-systems';
import {effectsFor} from './effects';

const scope=new paper.PaperScope();scope.setup(new scope.Size(1,1));
export const VECTOR_SEPARATION_LIMITS={contours:32,points:512,pathCharacters:200000,coordinate:1e6} as const;
const subpaths=(p:paper.PathItem)=>p instanceof scope.CompoundPath?p.children as paper.Path[]:[p as paper.Path];
function finite(p:{x:number;y:number}){if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e6||Math.abs(p.y)>1e6)throw Error('Separated geometry must stay within ±1,000,000.');}
function contour(p:paper.Path):VectorContour{return {closed:true,points:p.segments.map(s=>({x:s.point.x,y:s.point.y,in:{x:s.handleIn.x,y:s.handleIn.y},out:{x:s.handleOut.x,y:s.handleOut.y},mode:'independent'}))};}
export interface VectorSeparation {group:DesignNode;regions:DesignNode[];removedContours:number;}
/** Exact saved cubic contours; no flattening or knife-cut approximation. Holes belong to their nearest filled region. */
export function separateVectorRegions(n:DesignNode,ids?:string[]):VectorSeparation{refuseVariableWidthConversion(n);
 if(n.type!=='path'||n.booleanOp||n.mask||n.media||n.componentKey||n.componentMetadata)throw Error('Select a compound path without a mask, live boolean or component definition.');
 if(n.layout!=='none'||effectsFor(n).some(e=>e.visible))throw Error('Remove visible effects and automatic layout before separating this path.');
 if(n.width<=0||n.height<=0||!Number.isFinite(n.width)||!Number.isFinite(n.height)||n.width>1e6||n.height>1e6)throw Error('The compound path needs a finite, nonzero coordinate box.');
 if(n.path.length>VECTOR_SEPARATION_LIMITS.pathCharacters||(n.contours?.length??0)>32||n.points.length+(n.contours??[]).reduce((sum,c)=>sum+c.points.length,0)>512)throw Error('Separation supports up to 32 contours and 512 input anchors.');
 const paints=structuredClone(fillsFor(n));paints.forEach(validatePaint);
 if(!paints.some(p=>p.visible&&p.opacity>0))throw Error('Add a visible solid fill before separating filled regions.');
 if(paints.some(p=>p.type!=='solid'))throw Error('Only solid fill stacks can be separated without changing paint coordinates. Materialize or replace gradient/image fills first.');
 if(strokesFor(n).some(s=>s.visible&&s.width>0&&s.paint.visible&&s.paint.opacity>0))throw Error('Outline or hide visible strokes before separating filled regions.');
 for(const p of [...n.points,...(n.contours??[]).flatMap(c=>c.points)]){finite(p);if(p.in)finite({x:p.x+p.in.x,y:p.y+p.in.y});if(p.out)finite({x:p.x+p.out.x,y:p.y+p.out.y});}
 const source=geometry({...n,x:0,y:0,rotation:0,flipX:false,flipY:false,motionScaleX:undefined,motionScaleY:undefined});scope.activate();let base:paper.PathItem|undefined;
 try{
  base=scope.PathItem.create(source.pathData);let paths=subpaths(base);const inputCount=paths.length;
  if(inputCount>32||paths.reduce((sum,p)=>sum+p.segments.length,0)>512)throw Error('Separation supports up to 32 contours and 512 input anchors.');
  if(paths.some(p=>!p.closed||p.segments.length<3||Math.abs(p.area)<1e-7))throw Error('Separate only closed, nondegenerate contours. Open paths are not filled-region slices.');
  for(const p of paths)for(const s of p.segments){finite(s.point);finite(s.point.add(s.handleIn));finite(s.point.add(s.handleOut));}
  if(base.getIntersections().length)throw Error('Crossing, overlapping or touching contours cannot be separated safely. Resolve their topology first.');
  base.reorient(n.fillRule!=='evenodd',true);paths=subpaths(base);
  // Non-contributing nonzero contours are discarded by reorient. The remaining nesting alternates fill and hole.
  const parents=paths.map((p,i)=>{let parent=-1,area=Infinity;for(let j=0;j<paths.length;j++)if(i!==j&&Math.abs(paths[j].area)>Math.abs(p.area)&&Math.abs(paths[j].area)<area&&paths[j].contains(p.firstSegment.point)){parent=j;area=Math.abs(paths[j].area);}return parent;}),depths=parents.map((_,i)=>{let depth=0,j=i;while(parents[j]!==-1){if(++depth>32)throw Error('Invalid contour nesting.');j=parents[j];}return depth;});
  const roots=paths.map((_,i)=>i).filter(i=>depths[i]%2===0);
  if(roots.length<2)throw Error('This path has fewer than two separate filled regions. Holes stay with their surrounding region.');
  if(ids&&(ids.length!==roots.length||new Set(ids).size!==ids.length||ids.some(id=>!id||id===n.id)))throw Error('Invalid separated layer identities.');
  return {...separationPlan(n,roots.map(i=>[contour(paths[i]),...paths.filter((_,j)=>parents[j]===i).map(contour)]),ids),removedContours:inputCount-paths.length};
 }finally{source.remove();base?.remove();}
}

/** Geometry and fills are materialized. Group compositing, hierarchy/layout slot and original ID stay intact. */
export function separationPlan(n:DesignNode,regions:VectorContour[][],ids?:string[]):VectorSeparation{if(ids&&(ids.length!==regions.length||new Set(ids).size!==ids.length||ids.some(id=>!id||id===n.id)))throw Error('Invalid separated layer identities.');const paints=structuredClone(fillsFor(n)),group=structuredClone(n),patch:Partial<DesignNode>={type:'group',path:'',points:[],contours:undefined,closed:undefined,pathWidth:undefined,pathHeight:undefined,fill:'none',paints:[],gradient:false,stroke:'',strokeWidth:0,strokes:[],clip:false,radius:0,corners:undefined};detachEditedBindings(group,patch);Object.assign(group,patch);if(group.variableBindings)for(const k of ['width','height','radius','fill','stroke','strokeWidth'] as const)delete group.variableBindings[k];return {group,regions:regions.map((contours,index)=>node('path',{id:ids?.[index]??crypto.randomUUID(),name:`${n.name} · region ${index+1}`,parentId:n.id,x:n.x,y:n.y,width:n.width,height:n.height,pathWidth:n.width,pathHeight:n.height,contours,fillRule:'nonzero',fill:n.fill,paints:structuredClone(paints),stroke:'',strokeWidth:0,strokes:[],layout:'none',opacity:1})),removedContours:0};}

export function applyVectorSeparation(nodes:DesignNode[],id:string,plan:VectorSeparation){const index=nodes.findIndex(n=>n.id===id);if(index<0||plan.group.id!==id||nodes.some(n=>plan.regions.some(r=>r.id===n.id))||nodes.length+plan.regions.length>20000)throw Error('Separated layers exceed the page limit or their identities are no longer available.');nodes.splice(index,1,structuredClone(plan.group),...structuredClone(plan.regions));}
