import type {DesignNode,Page} from './model';
import {exportSelection} from './transforms';
import {layerExportGeometry} from './export-plan';

export const LAYER_PREVIEW_LIMIT=500;
/** Index the page once; collect only the selected subtree, ancestor ghosts and
 * relevant sibling masks before entering the shared (bounded) export renderer. */
export function layerPreviewIndex(nodes:DesignNode[]){
 const byId=new Map(nodes.map(n=>[n.id,n])),children=new Map<string|null,DesignNode[]>(),masks=new Map<string,string>();
 const lastMask=new Map<string|null,string>();
 for(const n of nodes){const list=children.get(n.parentId)??[];list.push(n);children.set(n.parentId,list);if(n.mask)lastMask.set(n.parentId,n.id);else{const mask=lastMask.get(n.parentId);if(mask)masks.set(n.id,mask);}}
 return {nodes,byId,children,masks};
}
export function layerPreviewGeometry(index:ReturnType<typeof layerPreviewIndex>,id:string){
 const target=index.byId.get(id);if(!target)throw Error('This layer is no longer available.');
 const keep=new Set<string>(),queue=[id],ancestors=new Set<string>();
 const addAncestors=(n:DesignNode)=>{let current=n,depth=0;const seen=new Set<string>();while(current.parentId){if(++depth>64||seen.has(current.parentId))throw Error('Preview supports up to 64 ancestor levels without cycles.');seen.add(current.parentId);const parent=index.byId.get(current.parentId);if(!parent)throw Error('A preview ancestor is missing.');if(n.id===id){if(parent.booleanOp)throw Error('Preview the live Boolean result instead of an individual operand inside it.');if(parent.mask)throw Error('Use mask inspection for layers inside a mask source.');if(parent.type==='slice')throw Error('Slice descendants do not paint. Move this layer outside the slice to preview it.');if(parent.media)throw Error('Preview this video poster layer as a whole instead of isolating its descendants.');if(parent.clip&&!['rectangle','image','frame','group','component','instance','section'].includes(parent.type))throw Error('Isolated previews require rectangular ancestor clips. Preview the clipped parent instead.');}if(!ancestors.has(parent.id)){ancestors.add(parent.id);const mask=index.masks.get(parent.id);if(mask)queue.push(mask);}current=parent;} };
 if(target.type==='slice'){
  if(index.nodes.length>LAYER_PREVIEW_LIMIT)throw Error('Slice preview supports up to 500 page layers. Use Export for this slice.');
  return layerExportGeometry({nodes:index.nodes} as Page,id,'frame');
 }
 if(target.mask)throw Error('Use mask inspection to preview a mask source and its affected artwork.');
 for(let at=0;at<queue.length;at++){
  const next=queue[at];if(keep.has(next))continue;const n=index.byId.get(next);if(!n)throw Error('A preview layer is missing.');keep.add(next);if(keep.size+ancestors.size>LAYER_PREVIEW_LIMIT)throw Error('This preview needs more than 500 layers. Preview a smaller child or use Export.');
  addAncestors(n);const mask=index.masks.get(n.id);if(mask)queue.push(mask);for(const child of index.children.get(n.id)??[])queue.push(child.id);
 }
 if(keep.size+ancestors.size>LAYER_PREVIEW_LIMIT)throw Error('This preview needs more than 500 layers. Preview a smaller child or use Export.');
 const context=index.nodes.filter(n=>keep.has(n.id)||ancestors.has(n.id));
 // exportSelection supplies invisible ancestor ghosts and the ordinary export
 // clipping/mask semantics. It never changes these original node objects.
 const nodes=exportSelection(context,[id]);
 return layerExportGeometry({nodes} as Page,id,target.type==='frame'?'frame':'artwork');
}
