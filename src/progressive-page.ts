import type {DesignNode} from './model';

/** Opening a dense page mounts complete root subtrees in batches so the first layers paint quickly and the window keeps responding. */
export const PROGRESSIVE_PAGE_LIMITS={threshold:3000,batchLayers:800} as const;
/** Null keeps the single-pass render: too few layers, or one root owning nearly everything. Stacking follows root order, so concatenated batches paint exactly as one scene. */
export function progressiveBatches(nodes:readonly DesignNode[],rootFor:ReadonlyMap<string,string>):DesignNode[][]|null{
 if(nodes.length<PROGRESSIVE_PAGE_LIMITS.threshold)return null;
 const groups=new Map<string,DesignNode[]>();for(const n of nodes)if(!n.parentId)groups.set(n.id,[]);
 for(const n of nodes){const root=rootFor.get(n.id),group=root===undefined?undefined:groups.get(root);if(!group)return null;group.push(n);}
 const batches:DesignNode[][]=[];let current:DesignNode[]=[];for(const group of groups.values()){current.push(...group);if(current.length>=PROGRESSIVE_PAGE_LIMITS.batchLayers){batches.push(current);current=[];}}if(current.length)batches.push(current);
 return batches.length>1?batches:null;
}
