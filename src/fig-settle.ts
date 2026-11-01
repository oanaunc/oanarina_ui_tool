import {descendants} from './model';
import type {DesignDocument,DesignNode} from './model';
import {reflow} from './layout';
import {updateTextMetrics} from './text-layout';
import {updateBooleans} from './geometry';
import {applyDesignSystems} from './design-systems';
import {detachInstance,synchronizeComponents} from './components-model';
import {textOutlineSignature} from './text-outline';
import {detachEveryFigInstance} from './fig-components';
import {figSameArtwork} from './fig-vector-network';
import {cloneDocumentValue} from './image-sharing';
/** The edit pipeline reapplies styles, variables, instances and auto layout on the first change. Stored positions are
 * the source's truth, so each live link has to reproduce them here; one that cannot is dropped before the file opens. */
const pipeline=(d:DesignDocument)=>{applyDesignSystems(d);synchronizeComponents(d);applyDesignSystems(d);for(const p of d.pages){updateTextMetrics(p.nodes);reflow(p.nodes);updateBooleans(p.nodes);}};
const GEOMETRY=.5;
const moved=(a:DesignNode,b:DesignNode)=>(['x','y','width','height'] as const).some(k=>Math.abs(a[k]-b[k])>GEOMETRY)||Math.abs(a.rotation-b.rotation)>.01||!!a.flipX!==!!b.flipX||!!a.flipY!==!!b.flipY;
const look=(n:DesignNode)=>JSON.stringify([n.visible,n.opacity,n.text,n.fill,n.stroke,n.strokeWidth,n.radius,n.fontSize,n.fontFamily,n.fontWeight,n.fontStyle??'normal',n.lineHeight,n.letterSpacing,n.paints,n.strokes,n.effects,n.layout,n.gap],(key,v)=>key==='id'?undefined:key==='image'&&typeof v==='string'&&v.length>64?v.length+v.slice(-48):v);
export interface FigSettleReport {detached:number;layouts:number;links:number;booleans:number;}
export function settleFigDocument(input:DesignDocument):{document:DesignDocument;report:FigSettleReport}{
 const report:FigSettleReport={detached:0,layouts:0,links:0,booleans:0};let doc=input;
 for(let round=0;round<6;round++){
  const draft=cloneDocumentValue(doc);let failure=false;try{pipeline(draft);}catch{failure=true;}
  if(failure){report.detached+=doc.pages.reduce((sum,p)=>sum+p.nodes.filter(n=>n.type==='instance'&&!n.instanceRootId).length,0);detachEveryFigInstance(doc);continue;}
  const after=new Map(draft.pages.flatMap(p=>p.nodes.map(n=>[n.id,n] as const))),all=doc.pages.flatMap(p=>p.nodes),before=new Map(all.map(n=>[n.id,n])),layouts=new Set<DesignNode>(),roots=new Set<string>(),unlink=new Set<DesignNode>(),baked=new Set<DesignNode>();
  const layoutOwner=(n:DesignNode)=>{let p=before.get(n.parentId??''),hops=0;while(p&&hops++<256){if(p.layout!=='none')return p;p=before.get(p.parentId??'');}return undefined;},rootOf=(n:DesignNode)=>n.type==='instance'&&!n.instanceRootId?n.id:n.instanceRootId;
  // Sync adds a main's layer the instance never had, or drops one it did. Either way the instance cannot follow.
  for(const n of after.values())if(!before.has(n.id)){const root=n.instanceRootId;if(root)roots.add(root);}
  for(const n of all){const next=after.get(n.id);if(!next){const root=rootOf(n);if(root)roots.add(root);continue;}
   if(n.booleanOp&&(moved(n,next)||!figSameArtwork(n.path,next.path,n.fillRule))){baked.add(n);continue;}
   if(moved(n,next)){const owner=layoutOwner(n)??(n.layout!=='none'?n:undefined);if(owner)layouts.add(owner);else{const root=rootOf(n);if(root)roots.add(root);}}
   else if(look(n)!==look(next)){if(n.styleIds||n.variableBindings)unlink.add(n);else{const root=rootOf(n);if(root)roots.add(root);}}}
  if(!layouts.size&&!roots.size&&!unlink.size&&!baked.size){for(const n of draft.pages.flatMap(p=>p.nodes))if(n.type==='text'&&n.textOutline){const was=before.get(n.id);if(was?.textOutline?.path===n.textOutline.path&&was.textOutline.signature===textOutlineSignature(was))n.textOutline.signature=textOutlineSignature(n);}return {document:draft,report};}
  for(const n of layouts){report.layouts++;n.layout='none';n.sizingX=undefined;n.sizingY=undefined;if(n.type==='instance'||n.instanceRootId)n.overrideKeys=[...new Set([...n.overrideKeys??[],'layout','sizingX','sizingY'])];}
  for(const n of baked){report.booleans++;n.booleanOp=undefined;for(const page of doc.pages)if(page.nodes.includes(n)){const operands=new Set(descendants(page.nodes,[n.id]).filter(id=>id!==n.id));page.nodes=page.nodes.filter(c=>!operands.has(c.id));}}
  for(const n of unlink){report.links++;n.styleIds=undefined;n.variableBindings=undefined;}
  for(const id of roots){const n=before.get(id);if(n?.type==='instance'&&!n.instanceRootId){report.detached++;detachInstance(doc,id);}}
 }
 // Every remaining link is dropped together. The stored appearance always wins over a live relationship.
 detachEveryFigInstance(doc);for(const page of doc.pages)for(const n of page.nodes)if(n.booleanOp){const operands=new Set(descendants(page.nodes,[n.id]).filter(id=>id!==n.id));n.booleanOp=undefined;page.nodes=page.nodes.filter(c=>!operands.has(c.id));}for(const n of doc.pages.flatMap(p=>p.nodes)){n.styleIds=undefined;n.variableBindings=undefined;if(n.layout!=='none'&&n.layout!=='grid')n.layout='none';}
 return {document:doc,report};
}
