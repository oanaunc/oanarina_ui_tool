import {canvasPointInNode,canvasSelectionBounds,canvasSelectionRoots} from './canvas-geometry';
import {nodeBounds} from './guides';
import {descendants,effectiveVisible,isLocked} from './model';
import type {DesignDocument,DesignNode} from './model';
import {planLayerMove} from './layer-operations';
export interface CanvasDropParent {parentId:string|null;afterId?:string;}
const holds=(n:DesignNode,nodes:DesignNode[],p:{x:number;y:number})=>{try{const local=canvasPointInNode(n,nodes,p);return local.x>=0&&local.y>=0&&local.x<=n.width&&local.y<=n.height;}catch{return false;}};
/** A dragged layer joins the deepest open frame under the pointer, or the page once it leaves its frame. Frames only nest when they fit entirely, so arranging screens on the canvas never swallows one. Undefined keeps the ordinary move. */
export function canvasDropParent(nodes:DesignNode[],ids:readonly string[],moved:DesignNode[],pointer:{x:number;y:number},setContainers:ReadonlySet<string>=new Set()):CanvasDropParent|undefined{
 const roots=canvasSelectionRoots(nodes,[...ids]);if(!roots.length||roots.some(n=>n.instanceRootId||isLocked(n,nodes)||setContainers.has(n.parentId??'')))return undefined;
 const owned=new Set(descendants(nodes,roots.map(n=>n.id))),framed=roots.some(n=>['frame','section','component'].includes(n.type)),box=canvasSelectionBounds(moved,[...ids]);
 const candidate=nodes.filter(n=>['frame','section','component'].includes(n.type)&&!owned.has(n.id)&&!n.instanceRootId&&!setContainers.has(n.id)&&!n.booleanOp&&!isLocked(n,nodes)&&effectiveVisible(n,nodes)&&holds(n,nodes,pointer)&&(!framed||(()=>{const b=nodeBounds(n,nodes);return box.x>=b.x&&box.y>=b.y&&box.x+box.width<=b.x+b.width&&box.y+box.height<=b.y+b.height;})())).at(-1);
 const parentId=candidate?.id??null;if(roots.every(n=>n.parentId===parentId))return undefined;
 if(framed&&parentId===null&&roots.some(n=>{const p=nodes.find(a=>a.id===n.parentId);return p&&holds(p,nodes,pointer);}))return undefined;
 if(!candidate||candidate.layout==='none'||candidate.layout==='grid')return {parentId};
 const horizontal=candidate.layout==='horizontal',local=canvasPointInNode(candidate,nodes,pointer),flow=nodes.filter(n=>n.parentId===candidate.id&&n.visible&&!n.ignoreLayout&&!owned.has(n.id)),next=flow.find(n=>(horizontal?n.x-candidate.x+n.width/2:n.y-candidate.y+n.height/2)>(horizontal?local.x:local.y));return {parentId,afterId:next?.id};
}
/** The tree lists the front layer first, so "after" a row is earlier in flow order. */
export function applyCanvasDropParent(nodes:DesignNode[],ids:string[],drop:CanvasDropParent,doc:DesignDocument){return drop.afterId?planLayerMove(nodes,ids,drop.afterId,'after',doc):planLayerMove(nodes,ids,drop.parentId,'inside',doc);}
