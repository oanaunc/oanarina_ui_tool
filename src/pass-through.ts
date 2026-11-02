import type {DesignNode} from './model';
import {effectsFor} from './effects';
import {fillsFor,strokesFor} from './paints';
export const PASS_THROUGH='pass-through';
export const PASS_THROUGH_LIMITS={nodes:100000,pageNodes:20000,depth:64} as const;
const CONTAINERS=['group','frame','section','component','instance'];
export function hasPassThrough(nodes:readonly DesignNode[]){return nodes.some(n=>n.blendMode===PASS_THROUGH);}
export function validatePassThroughNodes(nodes:readonly DesignNode[]){
 if(!hasPassThrough(nodes))return;
 if(nodes.length>20000)throw Error('Pass-through blending supports pages with at most 20,000 layers.');
 const map=new Map<string,DesignNode>();for(const n of nodes){if(!n.id||map.has(n.id))throw Error('Pass-through blending requires nonempty unique layer identities.');map.set(n.id,n);}
 for(const n of nodes){if(n.blendMode!==PASS_THROUGH)continue;
  if(!CONTAINERS.includes(n.type)||n.isolate!==false||n.clip||n.booleanOp||n.media||effectsFor(n).some(e=>e.visible))throw Error('Pass-through needs a group, frame or section with isolation off, and no clipping or effects, which would seal its children off from what is behind them. Choose an ordinary blend mode before changing these settings.');
  let at:DesignNode|undefined=n;const seen=new Set<string>();while(at){if(seen.size>=64||seen.has(at.id))throw Error('Pass-through blending supports an acyclic hierarchy of at most 64 levels.');seen.add(at.id);if(at.parentId!==null&&(!at.parentId||!map.has(at.parentId)))throw Error('A pass-through container ancestor is missing.');at=at.parentId?map.get(at.parentId):undefined;}
 }
}
export function validateDocumentPassThrough(d:{pages?:unknown;workspace?:unknown}){if(!Array.isArray(d.pages))return;let total=0;for(const page of d.pages)if(Array.isArray(page?.nodes))total+=page.nodes.length;const affected=d.pages.filter(p=>Array.isArray(p?.nodes)&&hasPassThrough(p.nodes));if(!affected.length)return;if(total>100000)throw Error('Pass-through blending supports files with at most 100,000 layers.');for(const page of affected)validatePassThroughNodes(page.nodes);}
/** SVG group opacity always seals a group, which is the one thing pass-through must not do. So a reduced pass-through hands its opacity to its own paint and each child. Children that overlap each other show through one another a little more than a sealed group's would. */
export function settlePassThroughOpacity(nodes:DesignNode[]):DesignNode[]{if(!nodes.some(n=>n.blendMode===PASS_THROUGH&&n.opacity<1))return nodes;const map=new Map(nodes.map(n=>[n.id,n])),known=new Map<string,number>(),passed=(n:DesignNode|undefined,depth=0):number=>{if(!n||n.blendMode!==PASS_THROUGH||depth>64)return 1;const held=known.get(n.id);if(held!==undefined)return held;const value=n.opacity*passed(map.get(n.parentId??''),depth+1);known.set(n.id,value);return value;};return nodes.map(n=>{const inherited=passed(map.get(n.parentId??''));if(n.blendMode!==PASS_THROUGH)return inherited===1?n:{...n,opacity:n.opacity*inherited};const own=passed(n);return own===1?n:{...n,opacity:1,paints:fillsFor(n).map(p=>({...p,opacity:p.opacity*own})),strokes:strokesFor(n).map(s=>({...s,paint:{...s.paint,opacity:s.paint.opacity*own}}))};});}
