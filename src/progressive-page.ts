import type {DesignNode} from './model';

/** Opening a dense page mounts complete root subtrees in batches so the first layers paint quickly and the window keeps responding. */
export const PROGRESSIVE_PAGE_LIMITS={threshold:3000,keptLayers:400} as const;
/** Which batch each root belongs to. A big page stays in batches after it opens, so an edit or a camera move only redraws the ones it touched. Stacking follows root order, so concatenated batches paint exactly as one scene. */
export interface BatchPlan {of:ReadonlyMap<string,number>;rootFor:ReadonlyMap<string,string>;count:number;}
export interface LayerBatch {key:number;nodes:DesignNode[];detail?:number;}
/** Null keeps the single-pass render: too few layers, or one root owning nearly everything. Roots keep the batch they had while order allows it, so one edit doesn't shuffle layers between batches. Batch numbers only ever rise through the roots, which is what keeps the stacking of the whole scene. */
export function planBatches(nodes:readonly DesignNode[],rootFor:ReadonlyMap<string,string>,old?:BatchPlan|null):BatchPlan|null{
 if(nodes.length<PROGRESSIVE_PAGE_LIMITS.threshold)return null;
 const sizes=new Map<string,number>();for(const n of nodes){const root=rootFor.get(n.id);if(root===undefined)return null;sizes.set(root,(sizes.get(root)??0)+1);}
 const of=new Map<string,number>();let current=0,filled=0;
 for(const n of nodes){if(n.parentId)continue;const was=old?.of.get(n.id);if(was!==undefined&&was>current){current=was;filled=0;}else if(filled>=PROGRESSIVE_PAGE_LIMITS.keptLayers*(was===undefined?1:2)){current++;filled=0;}filled+=sizes.get(n.id)??0;of.set(n.id,current);}
 return current?{of,rootFor,count:current+1}:null;
}
const sameLayers=(a:readonly DesignNode[],b:readonly DesignNode[])=>a===b||a.length===b.length&&a.every((n,i)=>n===b[i]);
/** Splits the layers on the canvas by plan. A batch that holds exactly what it held keeps its array, so it doesn't render again. A layer born during a drag joins its parent, or the top batch. */
export function cutBatches(list:readonly DesignNode[],plan:BatchPlan,detail:number|undefined,kept:readonly LayerBatch[]=[]):LayerBatch[]{
 let byId:Map<string,DesignNode>|undefined;const groups=new Map<number,DesignNode[]>(),batchOf=(n:DesignNode):number=>{const root=plan.rootFor.get(n.id),known=root===undefined?undefined:plan.of.get(root);if(known!==undefined)return known;byId??=new Map(list.map(a=>[a.id,a]));const seen=new Set<string>();for(let at:DesignNode|undefined=n;at&&!seen.has(at.id);at=at.parentId?byId.get(at.parentId):undefined){seen.add(at.id);const up=plan.rootFor.get(at.id);if(up!==undefined)return plan.of.get(up)??plan.count-1;}return plan.count-1;};
 for(const n of list){const key=batchOf(n),group=groups.get(key);if(group)group.push(n);else groups.set(key,[n]);}
 const old=new Map(kept.map(b=>[b.key,b.nodes]));return [...groups].sort((a,b)=>a[0]-b[0]).map(([key,nodes])=>{const was=old.get(key);return {key,nodes:was&&sameLayers(was,nodes)?was:nodes,detail};});
}
const sameBatch=(a:LayerBatch,b:LayerBatch)=>a.nodes===b.nodes&&a.detail===b.detail;
/** One step from what's drawn toward what's wanted, so a camera move spreads its work over frames. A layer the view needs right now goes at once, because a blank edge is worse than a slow frame. After that come batches gaining layers. Batches that only lose layers can wait, since a few extra layers past the view harm nothing. */
export function stepBatches(wanted:readonly LayerBatch[],drawn:readonly LayerBatch[],needed:(n:DesignNode)=>boolean=()=>false,budget=1):{batches:LayerBatch[];left:number}{
 const was=new Map(drawn.map(b=>[b.key,b])),goal=new Map(wanted.map(b=>[b.key,b])),rank=(b:LayerBatch)=>{const old=was.get(b.key),held=old&&new Set(old.nodes.map(n=>n.id));let gain=0;for(const n of b.nodes)if(!held?.has(n.id)){if(needed(n))return 2;gain=1;}return gain;};
 const stale=wanted.filter(b=>{const old=was.get(b.key);return !old||!sameBatch(old,b);}).map(b=>({b,rank:rank(b)})).sort((a,b)=>b.rank-a.rank||a.b.key-b.b.key),taken=new Set(stale.filter((s,i)=>i<budget||s.rank===2).map(s=>s.b.key)),gone=drawn.filter(b=>!goal.has(b.key));
 const room=budget-taken.size,dropped=new Set(gone.slice(0,Math.max(0,room)).map(b=>b.key)),keys=[...new Set([...drawn.map(b=>b.key),...taken])].filter(key=>!dropped.has(key)).sort((a,b)=>a-b);
 return {batches:keys.map(key=>taken.has(key)?goal.get(key)!:was.get(key)!),left:Math.max(0,stale.length-taken.size)+Math.max(0,gone.length-dropped.size)};
}
