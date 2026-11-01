import {canvasPointInNode,canvasSelectionBounds,canvasSelectionRoots} from './canvas-geometry';
import {nodeBounds} from './guides';
import {descendants,effectiveVisible,isLocked} from './model';
import type {DesignDocument,DesignNode} from './model';
import {planLayerMove} from './layer-operations';
import {inverseMatrix,point,worldMatrix} from './transforms';
import type {Matrix} from './transforms';
export interface CanvasDropParent {parentId:string|null;afterId?:string;}
const holds=(n:DesignNode,nodes:DesignNode[],p:{x:number;y:number})=>{try{const local=canvasPointInNode(n,nodes,p);return local.x>=0&&local.y>=0&&local.x<=n.width&&local.y<=n.height;}catch{return false;}};
export interface CanvasDropFrame {n:DesignNode;inverse:Matrix;}
/** Frames a drag could enter, with their matrices, worked out once. Each pointer move then only tests the pointer against this list. */
export function canvasDropFrames(nodes:DesignNode[],ids:readonly string[],setContainers:ReadonlySet<string>=new Set()):CanvasDropFrame[]{
 const owned=new Set(descendants(nodes,canvasSelectionRoots(nodes,[...ids]).map(n=>n.id))),frames:CanvasDropFrame[]=[];
 for(const n of nodes)if(['frame','section','component'].includes(n.type)&&!owned.has(n.id)&&!n.instanceRootId&&!n.siteMirror&&!setContainers.has(n.id)&&!n.booleanOp&&!isLocked(n,nodes)&&effectiveVisible(n,nodes))try{frames.push({n,inverse:inverseMatrix(worldMatrix(n,nodes))});}catch{/* A collapsed frame cannot hold a point. */}
 return frames;
}
/** A dragged layer joins the deepest open frame under the pointer, or the page once it leaves its frame. Frames only nest when they fit entirely, so arranging screens on the canvas never swallows one. Undefined keeps the ordinary move. */
export function canvasDropParent(nodes:DesignNode[],ids:readonly string[],moved:DesignNode[],pointer:{x:number;y:number},setContainers:ReadonlySet<string>=new Set(),frames?:readonly CanvasDropFrame[]):CanvasDropParent|undefined{
 const roots=canvasSelectionRoots(nodes,[...ids]);if(!roots.length||roots.some(n=>n.instanceRootId||n.siteMirror||isLocked(n,nodes)||setContainers.has(n.parentId??'')))return undefined;
 const owned=new Set(descendants(nodes,roots.map(n=>n.id))),framed=roots.some(n=>['frame','section','component'].includes(n.type)),box=canvasSelectionBounds(moved,[...ids]);
 const candidate=(frames??canvasDropFrames(nodes,ids,setContainers)).filter(({n,inverse})=>{const local=point(inverse,pointer.x,pointer.y);return local.x>=0&&local.y>=0&&local.x<=n.width&&local.y<=n.height&&(!framed||(()=>{const b=nodeBounds(n,nodes);return box.x>=b.x&&box.y>=b.y&&box.x+box.width<=b.x+b.width&&box.y+box.height<=b.y+b.height;})());}).at(-1)?.n;
 const parentId=candidate?.id??null,owner=(n:DesignNode)=>{let parent=nodes.find(p=>p.id===n.parentId);const seen=new Set<string>();while(parent?.type==='group'&&!seen.has(parent.id)){seen.add(parent.id);const id:string|null=parent.parentId;parent=nodes.find(p=>p.id===id);}return parent?.id??null;};if(roots.every(n=>owner(n)===parentId))return undefined;
 if(framed&&parentId===null&&roots.some(n=>{const p=nodes.find(a=>a.id===n.parentId);return p&&holds(p,nodes,pointer);}))return undefined;
 if(!candidate||candidate.layout==='none'||candidate.layout==='grid')return {parentId};
 const horizontal=candidate.layout==='horizontal',local=canvasPointInNode(candidate,nodes,pointer),flow=nodes.filter(n=>n.parentId===candidate.id&&n.visible&&!n.ignoreLayout&&!owned.has(n.id)),next=flow.find(n=>(horizontal?n.x-candidate.x+n.width/2:n.y-candidate.y+n.height/2)>(horizontal?local.x:local.y));return {parentId,afterId:next?.id};
}
/** Whole-pixel world positions mean nothing inside a rotated, flipped or scaled frame, so drawing there stays exact. */
export function overTransformedFrame(nodes:DesignNode[],p:{x:number;y:number}){return nodes.some(n=>{if(!['frame','section','component'].includes(n.type)||!holds(n,nodes,p))return false;const [a,b,c,d]=worldMatrix(n,nodes);return Math.abs(a-1)>1e-9||Math.abs(d-1)>1e-9||Math.abs(b)>1e-9||Math.abs(c)>1e-9;});}
/** `afterId` is the first flow sibling past the pointer. Stacks list in flow order, so the layer lands on the row before it. */
export function applyCanvasDropParent(nodes:DesignNode[],ids:string[],drop:CanvasDropParent,doc:DesignDocument){return drop.afterId?planLayerMove(nodes,ids,drop.afterId,'before',doc):planLayerMove(nodes,ids,drop.parentId,'inside',doc);}
