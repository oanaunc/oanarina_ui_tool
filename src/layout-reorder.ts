import {canvasSelectionRoots} from './canvas-geometry';
import {isLocked} from './model';
import type {DesignNode} from './model';
import {inverseMatrix,point,worldMatrix} from './transforms';
import type {Matrix} from './transforms';
export interface LayoutDrop {parentId:string;ids:string[];beforeId:string|null;changed:boolean;line:{x1:number;y1:number;x2:number;y2:number};}
interface Slot {id:string;start:number;end:number;crossStart:number;crossEnd:number;}
interface Row {start:number;end:number;items:Slot[];}
const slot=(n:DesignNode,p:DesignNode,horizontal:boolean):Slot=>{const left=n.x-p.x,top=n.y-p.y;return horizontal?{id:n.id,start:left,end:left+n.width,crossStart:top,crossEnd:top+n.height}:{id:n.id,start:top,end:top+n.height,crossStart:left,crossEnd:left+n.width};};
/** Wrapped children form rows along the cross axis; a single row is the ordinary case. */
function rows(items:Slot[]){const lines:Row[]=[];for(const item of items){const line=lines.at(-1);if(line&&item.crossStart<line.end&&item.crossEnd>line.start){line.items.push(item);line.start=Math.min(line.start,item.crossStart);line.end=Math.max(line.end,item.crossEnd);}else lines.push({start:item.crossStart,end:item.crossEnd,items:[item]});}return lines;}
const crossDistance=(line:Row,cross:number)=>cross<line.start?line.start-cross:cross>line.end?cross-line.end:0;
function eligibleParent(nodes:DesignNode[],roots:DesignNode[]){const parent=nodes.find(n=>n.id===roots[0].parentId);if(!parent||parent.layout==='none'||parent.layout==='grid'||parent.instanceRootId||parent.wrap&&parent.wrapDirection==='reverse'||isLocked(parent,nodes))return undefined;return roots.some(n=>n.parentId!==parent.id||n.ignoreLayout||n.instanceRootId||isLocked(n,nodes))?undefined:parent;}
function insertionLine(matrix:Matrix,horizontal:boolean,row:Row|undefined,previous:Slot|undefined,next:Slot|undefined,parent:DesignNode){const inset=Math.min(parent.gap/2,4),position=previous&&next?(previous.end+next.start)/2:previous?previous.end+inset:next?next.start-inset:(horizontal?parent.width:parent.height)/2,start=row?.start??0,end=row?.end??(horizontal?parent.height:parent.width),a=horizontal?point(matrix,position,start):point(matrix,start,position),b=horizontal?point(matrix,position,end):point(matrix,end,position);return {x1:a.x,y1:a.y,x2:b.x,y2:b.y};}
/** The insertion slot under the pointer, or undefined when an ordinary free move applies. Reverse-wrapped rows and rotated siblings keep the free move. */
export function layoutDropTarget(nodes:DesignNode[],ids:readonly string[],pointer:{x:number;y:number},margin=8):LayoutDrop|undefined{
 const roots=canvasSelectionRoots(nodes,[...ids]);if(!roots.length)return undefined;const parent=eligibleParent(nodes,roots);if(!parent)return undefined;
 const matrix=worldMatrix(parent,nodes);let inverse:Matrix;try{inverse=inverseMatrix(matrix);}catch{return undefined;}
 const local=point(inverse,pointer.x,pointer.y),horizontal=parent.layout==='horizontal';if(local.x<-margin||local.y<-margin||local.x>parent.width+margin||local.y>parent.height+margin)return undefined;
 const moved=new Set(roots.map(n=>n.id)),flow=nodes.filter(n=>n.parentId===parent.id&&n.visible&&!n.ignoreLayout),rest=flow.filter(n=>!moved.has(n.id));if(rest.some(n=>n.rotation))return undefined;
 const lines=rows(rest.map(n=>slot(n,parent,horizontal))),cross=horizontal?local.y:local.x,position=horizontal?local.x:local.y,row=lines.length?lines.reduce((best,candidate)=>crossDistance(candidate,cross)<crossDistance(best,cross)?candidate:best):undefined,next=row?.items.find(item=>position<(item.start+item.end)/2),previous=row?next?row.items[row.items.indexOf(next)-1]:row.items.at(-1):undefined,beforeId=next?.id??(row?lines[lines.indexOf(row)+1]?.items[0]?.id??null:null);
 const order=flow.map(n=>n.id),block=flow.filter(n=>moved.has(n.id)).map(n=>n.id),target=rest.map(n=>n.id),at=beforeId===null?target.length:target.indexOf(beforeId),proposed=[...target.slice(0,at),...block,...target.slice(at)];
 return {parentId:parent.id,ids:block,beforeId,changed:proposed.some((id,i)=>id!==order[i]),line:insertionLine(matrix,horizontal,row,previous,next,parent)};
}
/** Sibling array order is layout order. Positions are left to the shared reflow. */
export function applyLayoutDrop(nodes:DesignNode[],drop?:LayoutDrop){if(!drop?.changed)return nodes;const moved=new Set(drop.ids),kept=nodes.filter(n=>!moved.has(n.id)),block=nodes.filter(n=>moved.has(n.id));if(block.length!==drop.ids.length)return nodes;let at=drop.beforeId===null?-1:kept.findIndex(n=>n.id===drop.beforeId);if(at<0){at=kept.reduce((last,n,i)=>n.parentId===drop.parentId?i+1:last,-1);if(at<0)return nodes;}return [...kept.slice(0,at),...block,...kept.slice(at)];}
