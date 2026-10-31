import type {DesignNode} from './model';
import {effectsFor} from './effects';
import {strokesFor} from './paints';
import {outlineVectorStroke} from './vector-stroke-outline';

export const SVG_STROKE_OUTLINE_LIMITS={layers:20_000,conversions:64,outputPoints:16_384} as const;
const candidates=(nodes:DesignNode[])=>nodes.filter(n=>!n.exportGhost&&n.visible&&n.opacity>0&&strokesFor(n).some(s=>s.visible&&s.paint.visible&&s.paint.opacity>0&&(s.width>0||s.edgeWidths?.some(v=>v>0))));
function outlineHierarchy(nodes:DesignNode[]){
 if(nodes.length>SVG_STROKE_OUTLINE_LIMITS.layers)throw Error('SVG stroke outlining supports at most 20,000 source/exported layers.');
 const map=new Map(nodes.map(n=>[n.id,n])),parents=new Set(nodes.filter(n=>n.parentId).map(n=>n.parentId)),unsafe=new Map<string,{blocked:boolean;depth:number}>();
 if(map.size!==nodes.length)throw Error('SVG stroke outlining requires unique layer identities.');
 for(const start of nodes){if(unsafe.has(start.id))continue;const trail:DesignNode[]=[],seen=new Set<string>();let n:DesignNode|undefined=start;while(n&&!unsafe.has(n.id)){if(seen.has(n.id)||trail.length>=256)throw Error('SVG stroke outlining requires an acyclic hierarchy of at most 256 levels.');seen.add(n.id);trail.push(n);if(n.parentId&&!map.has(n.parentId))throw Error('An SVG stroke outline ancestor is missing.');n=n.parentId?map.get(n.parentId):undefined;}let state=n?unsafe.get(n.id)!:{blocked:false,depth:0};for(const child of trail.reverse()){const depth=state.depth+1;if(depth>256)throw Error('SVG stroke outlining supports at most 256 ancestor levels.');state={depth,blocked:state.blocked||!!child.clip||!!child.booleanOp||effectsFor(child).some(e=>e.visible)};unsafe.set(child.id,state);}}
 return {parents,unsafe};
}
/** Selection ghosts intentionally omit effects. Check the actual source ancestry first. */
export function validateSvgStrokeOutlineSource(source:DesignNode[],exported:DesignNode[]){
 const targets=candidates(exported);if(!targets.length)return;const {unsafe}=outlineHierarchy(source);
 for(const n of targets){const state=unsafe.get(n.id);if(!state)throw Error('The SVG stroke outline source layer is missing.');if(state.blocked)throw Error('SVG stroke outlining requires source vectors outside clipping, live Boolean and visible-effect hierarchies.');}
}
/** Export-only snapshot conversion. The source graph and its original crop never change. */
export function svgStrokeOutlineNodes(nodes:DesignNode[],enabled=false){
 if(!enabled)return nodes;
 if(nodes.length>SVG_STROKE_OUTLINE_LIMITS.layers)throw Error('SVG stroke outlining supports at most 20,000 exported layers.');
 const {parents,unsafe}=outlineHierarchy(nodes);
 const targets=candidates(nodes);
 if(!targets.length)return nodes;
 if(targets.length>SVG_STROKE_OUTLINE_LIMITS.conversions)throw Error('SVG stroke outlining supports at most 64 stroked layers per export.');
 if(nodes.some(n=>n.mask))throw Error('SVG stroke outlining does not support mask runs. Keep SVG strokes or export the unmasked vector separately.');
 const plans=new Map<string,DesignNode>();let points=0;
 for(const n of targets){if(parents.has(n.id)||unsafe.get(n.id)?.blocked)throw Error('SVG stroke outlining requires leaf vectors outside clipping, live Boolean and visible-effect hierarchies.');if(n.layoutGuides?.length)throw Error('Remove this vector’s layout guides before SVG stroke outlining.');try{/* Export must keep appearance: an outlined gradient or image maps to a larger box, so only the interactive tool accepts those. */if(strokesFor(n).some(v=>v.paint.type!=='solid'))throw Error('SVG stroke outlining supports solid stroke paints. Gradient and image strokes remain separate.');const result={...n,...outlineVectorStroke(n)};points+=(result.contours??[]).reduce((sum,c)=>sum+c.points.length,0);if(points>SVG_STROKE_OUTLINE_LIMITS.outputPoints)throw Error('SVG stroke outlines exceed 16,384 total output anchors. Export fewer vectors.');plans.set(n.id,result);}catch(error){throw Error('SVG stroke outline: '+(error instanceof Error?error.message:String(error)));}}
 return nodes.map(n=>plans.get(n.id)??n);
}
