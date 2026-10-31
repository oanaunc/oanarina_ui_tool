import {effectiveStrokeWidth} from './edge-strokes';
import type {DesignNode} from './model';
import {effectsFor} from './effects';
import {fillsFor,strokesFor} from './paints';
export const PASS_THROUGH='pass-through';
export const PASS_THROUGH_LIMITS={nodes:100000,pageNodes:20000,depth:64} as const;
export function hasPassThrough(nodes:readonly DesignNode[]){return nodes.some(n=>n.blendMode===PASS_THROUGH);}
export function validatePassThroughNodes(nodes:readonly DesignNode[]){
 if(!hasPassThrough(nodes))return;
 if(nodes.length>20000)throw Error('Pass-through blending supports pages with at most 20,000 layers.');
 const map=new Map<string,DesignNode>();for(const n of nodes){if(!n.id||map.has(n.id))throw Error('Pass-through blending requires nonempty unique layer identities.');map.set(n.id,n);}
 if(nodes.some(n=>n.mask))throw Error('Pass-through blending currently requires a page without sibling masks.');
 for(const n of nodes){if(n.blendMode!==PASS_THROUGH)continue;
  if(!['group','frame','section'].includes(n.type)||n.opacity!==1||n.isolate!==false||n.clip||n.booleanOp||n.media||n.exportGhost||effectsFor(n).some(e=>e.visible)||fillsFor(n).some(p=>p.visible&&p.opacity>0)||strokesFor(n).some(s=>s.visible&&s.paint.visible&&s.paint.opacity>0&&effectiveStrokeWidth(s,n)>0))throw Error('Pass-through currently needs an unpainted group, frame or section at 100% opacity, with isolation off and no clipping, masks or effects. Choose an ordinary blend mode before changing these settings.');
  let at:DesignNode|undefined=n;const seen=new Set<string>();while(at){if(seen.size>=64||seen.has(at.id))throw Error('Pass-through blending supports an acyclic hierarchy of at most 64 levels.');seen.add(at.id);if(at.instanceRootId||at.componentId||at.componentMetadata||at.sourceId||['component','instance'].includes(at.type))throw Error('Pass-through authoring currently requires independent containers outside components and instances.');if(at.parentId!==null&&(!at.parentId||!map.has(at.parentId)))throw Error('A pass-through container ancestor is missing.');at=at.parentId?map.get(at.parentId):undefined;}
 }
}
export function validatePassThroughMotion(nodes:readonly DesignNode[],motion:unknown){if(!hasPassThrough(nodes))return;const tracks=(motion as {tracks?:{keyframes?:unknown[]}[]}|undefined)?.tracks;if(Array.isArray(tracks)&&tracks.some(t=>Array.isArray(t.keyframes)&&t.keyframes.length))throw Error('Pass-through currently supports static pages without Motion keyframes.');}
export function validateDocumentPassThrough(d:{pages?:unknown;workspace?:unknown}){if(!Array.isArray(d.pages))return;let total=0;for(const page of d.pages)if(Array.isArray(page?.nodes))total+=page.nodes.length;const affected=d.pages.filter(p=>Array.isArray(p?.nodes)&&hasPassThrough(p.nodes));if(!affected.length)return;if(total>100000)throw Error('Pass-through blending supports files with at most 100,000 layers.');if(d.workspace&&d.workspace!=='design')throw Error('Pass-through authoring currently supports Design files only.');for(const page of affected){validatePassThroughNodes(page.nodes);validatePassThroughMotion(page.nodes,page.motion);}}
/** Source-owned export entry points refuse partial backdrop substitution, including a child without its container. */
export function validatePassThroughExportSource(source:DesignNode[],output:DesignNode[]){if(!hasPassThrough(source))return;validatePassThroughNodes(source);const children=new Map<string,DesignNode[]>();for(const n of source)if(n.parentId){const list=children.get(n.parentId)??[];list.push(n);children.set(n.parentId,list);}const affected=new Set<string>(),pending=source.filter(n=>n.blendMode===PASS_THROUGH);for(let i=0;i<pending.length;i++){const n=pending[i];if(affected.has(n.id))continue;affected.add(n.id);pending.push(...children.get(n.id)??[]);}if(output.some(n=>affected.has(n.id))&&JSON.stringify(output)!==JSON.stringify(source))throw Error('Pass-through export needs the complete original page artwork, including enclosing and preceding backdrop layers. Export the whole page or change the container to an ordinary blend mode.');}
export function refusePassThroughPlayback(nodes:DesignNode[]){if(hasPassThrough(nodes))throw Error('Pass-through currently supports static Design artwork only. Choose an ordinary blend mode before prototype, Smart animate or scrolling presentation.');}
