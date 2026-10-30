import type {DesignNode} from './model';
import {visualBounds} from './transforms';

/** Render-only IDs: Artwork derives every SVG definition/reference from node IDs.
 * Keep source paint IDs/data intact; none of these clones enter document state. */
export function thumbnailNodes(nodes:DesignNode[],scope:string,reservedNodes:DesignNode[]=nodes):DesignNode[]{
 const base='page-preview-'+scope.replace(/[^a-zA-Z0-9_-]/g,'_');
 // Imported IDs are opaque strings. Avoid even deliberately crafted collisions
 // with any definition the normal canvas could derive in this document.
 const reserved=reservedNodes.flatMap(n=>[`local-clip-${n.id}`,`outside-mask-${n.id}`,`layer-mask-${n.id}`,`fx${n.id}`,...(n.paints??[{id:n.type==='image'&&n.image?'legacy-image':'legacy-fill'}]).map(p=>`fill-${n.id}-${p.id}`),...(n.strokes??(n.stroke?[{id:'legacy-stroke'}]:[])).map(s=>`stroke-${n.id}-${s.id}`)]);
 const occupied=new Set<string>(),pattern=new RegExp(base+'-(\\d+)-','g');
 for(const id of reserved)for(const match of id.matchAll(pattern))occupied.add(match[1]);
 let serial=0;while(occupied.has(String(serial)))serial++;
 const prefix=`${base}-${serial}-`;
 const ids=new Map(nodes.map((n,i)=>[n.id,`${prefix}-n${i}`]));
 return nodes.map(n=>({...n,id:ids.get(n.id)!,parentId:n.parentId?ids.get(n.parentId)??null:null}));
}
export function thumbnailBounds(nodes:DesignNode[]){
 const b=visualBounds(nodes),pad=Math.max(b.width,b.height)*.04;
 return {x:b.x-pad,y:b.y-pad,width:b.width+pad*2,height:b.height+pad*2};
}
export function thumbnailPlacement(anchor:{left:number;right:number;top:number},viewport:{width:number;height:number}){
 const gap=8,width=Math.max(1,Math.min(284,viewport.width-gap*2)),height=Math.max(1,Math.min(228,viewport.height-gap*2));
 let left=anchor.right+12;if(left+width>viewport.width-gap)left=anchor.left-width-12;
 return {left:Math.max(gap,Math.min(left,viewport.width-width-gap)),top:Math.max(gap,Math.min(anchor.top-20,viewport.height-height-gap)),width,height};
}
