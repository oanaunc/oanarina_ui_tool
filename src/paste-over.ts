import {canvasSelectionBounds} from './canvas-geometry';
import {normalizedRootSelection} from './geometry';
import {descendants} from './model';
import type {DesignDocument,DesignNode} from './model';
import {inverseMatrix,worldMatrix} from './transforms';
/** Paste over selection goes beside the selected layer, in its parent, never inside it. A selection across parents uses the topmost layer's. */
export function pasteOverTarget(nodes:DesignNode[],selection:string[]){const roots=normalizedRootSelection(nodes,selection);return roots.length?{parentId:roots[roots.length-1].parentId??undefined,over:roots.map(n=>n.id)}:undefined;}
/** Centers the pasted layers on the selection and stacks them directly above it. The same size lands exactly on the selected layer. */
export function placeOverSelection(nodes:DesignNode[],pasted:string[],over:string[]){
 const target=canvasSelectionBounds(nodes,over),box=canvasSelectionBounds(nodes,pasted),dx=target.x+target.width/2-box.x-box.width/2,dy=target.y+target.height/2-box.y-box.height/2;
 for(const id of pasted){const n=nodes.find(a=>a.id===id)!,parent=nodes.find(p=>p.id===n.parentId),inverse=parent?inverseMatrix(worldMatrix(parent,nodes)):undefined,x=inverse?inverse[0]*dx+inverse[2]*dy:dx,y=inverse?inverse[1]*dx+inverse[3]*dy:dy,owned=new Set(descendants(nodes,[id]));for(const a of nodes)if(owned.has(a.id)){a.x+=x;a.y+=y;}}
 const moved=new Set(descendants(nodes,pasted)),rest=nodes.filter(n=>!moved.has(n.id)),top=new Set(descendants(rest,[over[over.length-1]])),at=rest.reduce((last,n,i)=>top.has(n.id)?i:last,-1),block=nodes.filter(n=>moved.has(n.id));
 nodes.splice(0,nodes.length,...rest.slice(0,at+1),...block,...rest.slice(at+1));
}
export const placeOnPage=(d:DesignDocument,pageId:string,pasted:string[],over:string[])=>placeOverSelection(d.pages.find(p=>p.id===pageId)!.nodes,pasted,over);
