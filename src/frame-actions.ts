import type {DesignDocument,DesignNode} from './model';
import {descendants,effectiveVisible,isLocked,parseDocument} from './model';
import {managedLayer} from './layer-operations';
import {inverseMatrix,multiply,nodeMatrix,point,transformFromMatrix} from './transforms';
import type {Matrix} from './transforms';

export type FrameFitBounds='children'|'descendants';
/** A bounded, cached hierarchy for fitting and post-layout verification. */
function fitHierarchy(nodes:DesignNode[],id:string){
 if(nodes.length>20000)throw Error('Frame fitting supports pages with up to 20000 layers.');
 const byId=new Map(nodes.map(n=>[n.id,n])),children=new Map<string,DesignNode[]>();
 for(const n of nodes)if(n.parentId){const list=children.get(n.parentId)??[];list.push(n);children.set(n.parentId,list);}
 const owned=new Set<string>(),queue=[id];
 for(let i=0;i<queue.length;i++){const current=queue[i];if(owned.has(current))throw Error('Cyclic frame hierarchy.');owned.add(current);if(owned.size>2000)throw Error('Fit a frame containing at most 2000 layers, including the frame itself.');for(const child of children.get(current)??[])queue.push(child.id);}
 const cache=new Map<string,Matrix>(),depths=new Map<string,number>();
 const matrix=(n:DesignNode)=>{const lineage:DesignNode[]=[],seen=new Set<string>();let current:DesignNode|undefined=n;while(current&&!cache.has(current.id)){if(seen.has(current.id))throw Error('Cyclic frame hierarchy.');seen.add(current.id);lineage.push(current);if(lineage.length>1024)throw Error('Frame fitting supports at most 1024 ancestor transforms.');current=byId.get(current.parentId??'');}let depth=current?depths.get(current.id)!:0,m=current?cache.get(current.id)!:[1,0,0,1,0,0] as Matrix;for(let i=lineage.length-1;i>=0;i--){if(++depth>1024)throw Error('Frame fitting supports at most 1024 ancestor transforms.');const item=lineage[i];m=multiply(m,nodeMatrix(item,byId.get(item.parentId??'')));cache.set(item.id,m);depths.set(item.id,depth);}return m;};
 return {byId,children,owned,matrix};
}

function editableFrame(nodes:DesignNode[],id:string,doc?:DesignDocument){
 const frame=nodes.find(n=>n.id===id);
 if(!frame||frame.type!=='frame')throw Error('Select one frame.');
 if(isLocked(frame,nodes))throw Error('Unlock the frame and its ancestors first.');
 if(managedLayer(frame,nodes))throw Error('Detach the instance before changing its managed frame.');
 if(doc?.slides?.slides.some(s=>s.frameId===id)||doc?.whiteboard?.stickies.some(s=>s.frameId===id)||doc?.whiteboard?.tables.some(t=>t.frameId===id))throw Error('Use the workspace controls for a slide, sticky note or table.');
 const parent=nodes.find(n=>n.id===frame.parentId);
 if(parent&&parent.layout!=='none'&&!frame.ignoreLayout)throw Error('Use absolute position or move the frame outside auto layout first.');
 return frame;
}
function checkedSize(n:DesignNode,width:number,height:number){if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1||width>1e6||height>1e6||width<(n.minWidth??0)||width>(n.maxWidth??1e6)||height<(n.minHeight??0)||height>(n.maxHeight??1e6))throw Error('The resulting frame size conflicts with its size limits.');}
function finiteFitGeometry(width:number,height:number,matrix:Matrix){if(![width,height,...matrix].every(Number.isFinite)||[[0,0],[width,0],[width,height],[0,height]].some(([x,y])=>{const p=point(matrix,x,y);return !Number.isFinite(p.x)||!Number.isFinite(p.y);}))throw Error('This frame hierarchy has nonfinite world geometry. Reduce its nested scales before fitting.');}
/** Direct visible unlocked children, in front-to-back layer order. Nested descendants are not included. */
export function frameContentsSelection(nodes:DesignNode[],id:string){const frame=nodes.find(n=>n.id===id);if(!frame||frame.type!=='frame')throw Error('Select one frame.');return nodes.filter(n=>n.parentId===id&&effectiveVisible(n,nodes)&&!isLocked(n,nodes)).reverse().map(n=>n.id);}

/** Swap authored dimensions, keep the frame center, and let the normal editor constraints resize children. */
export function planFrameOrientation(nodes:DesignNode[],id:string,doc?:DesignDocument){
 const frame=editableFrame(nodes,id,doc),width=frame.height,height=frame.width;checkedSize(frame,width,height);
 const next=structuredClone(nodes),result=next.find(n=>n.id===id)!,dx=(frame.width-width)/2,dy=(frame.height-height)/2,owned=new Set(descendants(nodes,[id]));
 for(const n of next)if(owned.has(n.id)){n.x+=dx;n.y+=dy;}
 Object.assign(result,{width,height,sizingX:'fixed',sizingY:'fixed'});return next;
}
export interface FrameFitPlan {nodes:DesignNode[];frameId:string;matrix:Matrix;size:{width:number;height:number};preserved:Map<string,{matrix:Matrix;width:number;height:number}>;constraints:Map<string,{x:DesignNode['constraintX'];y:DesignNode['constraintY'];hasX:boolean;hasY:boolean}>;}
/** Fit child or descendant rectangles (including hidden/clipped geometry), preserving all content poses. */
export function planFrameFit(nodes:DesignNode[],id:string,doc?:DesignDocument,bounds:FrameFitBounds='children'):FrameFitPlan{
 if(bounds!=='children'&&bounds!=='descendants')throw Error('Choose direct children or all descendant bounds.');
 const hierarchy=fitHierarchy(nodes,id),source=hierarchy.byId.get(id);if(source)hierarchy.matrix(source);const frame=editableFrame(nodes,id,doc);if(frame.layout!=='none')throw Error('Fit to content is for free-layout frames. Use Hug contents for auto layout.');
 const {owned}=hierarchy,children=hierarchy.children.get(id)??[];if(!children.length)throw Error('Add content to the frame before fitting it.');
 const frameWorld=hierarchy.matrix(frame);finiteFitGeometry(frame.width,frame.height,frameWorld);
 const measured=bounds==='children'?children:nodes.filter(n=>n.id!==id&&owned.has(n.id)),inverse=inverseMatrix(frameWorld),corners=measured.flatMap(n=>{const world=hierarchy.matrix(n);finiteFitGeometry(n.width,n.height,world);const m=multiply(inverse,world);return [[0,0],[n.width,0],[n.width,n.height],[0,n.height]].map(([x,y])=>point(m,x,y));}),x=Math.min(...corners.map(p=>p.x)),y=Math.min(...corners.map(p=>p.y)),width=Math.max(...corners.map(p=>p.x))-x,height=Math.max(...corners.map(p=>p.y))-y;checkedSize(frame,width,height);
 if(nodes.some(n=>owned.has(n.id)&&(n.type==='instance'||n.type==='component'||n.instanceRootId)))throw Error('Fit a free frame without managed instances or main components.');
 const relevant=new Set(owned);let ancestor=nodes.find(n=>n.id===frame.parentId);while(ancestor&&!relevant.has(ancestor.id)){relevant.add(ancestor.id);ancestor=nodes.find(n=>n.id===ancestor!.parentId);}
 if(bounds==='descendants'&&nodes.some(n=>relevant.has(n.id)&&(n.mask||n.booleanOp||n.type==='slice')))throw Error('All-descendant fitting does not support mask sources, live booleans or slices in this hierarchy. Use direct child bounds or ordinary layers.');
 if(doc?.pages.some(p=>p.motion?.tracks.some(t=>relevant.has(t.nodeId))))throw Error('Remove motion tracks from this hierarchy before fitting its base geometry.');
 const preserved=new Map(nodes.filter(n=>n.id!==id&&owned.has(n.id)).map(n=>{const matrix=hierarchy.matrix(n);finiteFitGeometry(n.width,n.height,matrix);return [n.id,{matrix,width:n.width,height:n.height}];})),next=structuredClone(nodes),result=next.find(n=>n.id===id)!,parent=next.find(n=>n.id===frame.parentId),oldLocal=nodeMatrix(frame,parent),newLocal=multiply(oldLocal,[1,0,0,1,x,y]);
 Object.assign(result,{width,height,sizingX:'fixed',sizingY:'fixed'});
 Object.assign(result,transformFromMatrix(result,parent,newLocal));
 const nextHierarchy=fitHierarchy(next,id),nextInverse=inverseMatrix(nextHierarchy.matrix(result));
 // Rebase only the direct child transforms; each subtree's absolute-coordinate baseline follows its root.
 for(const child of children){const n=nextHierarchy.byId.get(child.id)!,patch=transformFromMatrix(n,result,multiply(nextInverse,preserved.get(n.id)!.matrix)),dx=patch.x!-n.x,dy=patch.y!-n.y,pending=[...nextHierarchy.children.get(n.id)??[]];for(let i=0;i<pending.length;i++){const c=pending[i];c.x+=dx;c.y+=dy;pending.push(...nextHierarchy.children.get(c.id)??[]);}Object.assign(n,patch);}
 const constraints=new Map(children.map(n=>[n.id,{x:n.constraintX,y:n.constraintY,hasX:Object.hasOwn(n,'constraintX'),hasY:Object.hasOwn(n,'constraintY')}]));
 const plan={nodes:next,frameId:id,matrix:nextHierarchy.matrix(result),size:{width,height},preserved,constraints};validateFrameFit(next,plan);return plan;
}
/** Run after the editor's layout/component pipeline so a refused fit remains a fully atomic edit. */
export function validateFrameFit(nodes:DesignNode[],plan:FrameFitPlan){const hierarchy=fitHierarchy(nodes,plan.frameId);for(const [id,before] of plan.preserved){finiteFitGeometry(before.width,before.height,before.matrix);const n=hierarchy.byId.get(id);if(!n)throw Error('Frame content disappeared during layout.');const matrix=hierarchy.matrix(n);finiteFitGeometry(n.width,n.height,matrix);if(Math.abs(n.width-before.width)>1e-6||Math.abs(n.height-before.height)>1e-6||matrix.some((v,i)=>Math.abs(v-before.matrix[i])>1e-6))throw Error('This fit would change child artwork through constraints or generated layout. Use a free frame with fixed child geometry.');}const frame=hierarchy.byId.get(plan.frameId);if(!frame)throw Error('The fitted frame disappeared during layout.');const frameMatrix=hierarchy.matrix(frame);finiteFitGeometry(frame.width,frame.height,frameMatrix);finiteFitGeometry(plan.size.width,plan.size.height,plan.matrix);if(frameMatrix.some((v,i)=>Math.abs(v-plan.matrix[i])>1e-6))throw Error('The frame layout changed its fitted position or transform.');if(![plan.size.width,plan.size.height].every(Number.isFinite)||Math.abs(frame.width-plan.size.width)>1e-6||Math.abs(frame.height-plan.size.height)>1e-6)throw Error('The frame layout changed its fitted size.');}

/** Temporarily suppress child constraints in the uncommitted candidate: this is an explicit geometry edit. */
export function prepareFrameFitForEdit(plan:FrameFitPlan){for(const n of plan.nodes)if(plan.constraints.has(n.id)){n.constraintX='start';n.constraintY='start';}return plan.nodes;}
/** Restore only the source constraint metadata, validate the whole candidate, then verify appearance before commit. */
export function finalizeFrameFit(doc:DesignDocument,pageId:string,plan:FrameFitPlan){const nodes=doc.pages.find(p=>p.id===pageId)!.nodes;for(const [id,c] of plan.constraints){const n=nodes.find(n=>n.id===id);if(!n)throw Error('Frame content disappeared during layout.');if(c.hasX)n.constraintX=c.x;else delete n.constraintX;if(c.hasY)n.constraintY=c.y;else delete n.constraintY;}parseDocument(JSON.stringify(doc));validateFrameFit(nodes,plan);}
