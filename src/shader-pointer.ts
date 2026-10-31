/** Transient preview pointer. Never saved, never undoable, and absent from every export path. */
export interface ShaderPointer {nodeId:string;x:number;y:number;}
let current:ShaderPointer|null=null;const listeners=new Set<()=>void>();
export const subscribeShaderPointer=(fn:()=>void)=>{listeners.add(fn);return ()=>{listeners.delete(fn);};};
export const shaderPointerFor=(nodeId:string)=>current?.nodeId===nodeId?current:undefined;
export function setShaderPointer(next:ShaderPointer|null){if(current===next||current&&next&&current.nodeId===next.nodeId&&current.x===next.x&&current.y===next.y)return;current=next;listeners.forEach(fn=>fn());}
/** Local coordinates come from the live CTM, so rotated and flipped layers report the point under the cursor. */
export function shaderPointerAt(target:Element,clientX:number,clientY:number,sizeOf:(id:string)=>{width:number;height:number}|undefined):ShaderPointer|null{const host=target.closest<SVGGraphicsElement>('[data-node-id]'),id=host?.getAttribute('data-node-id'),size=id?sizeOf(id):undefined,matrix=host?.getScreenCTM?.();if(!id||!size||!matrix||size.width<=0||size.height<=0)return null;const p=new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse());return {nodeId:id,x:Math.max(0,Math.min(1,p.x/size.width)),y:Math.max(0,Math.min(1,p.y/size.height))};}
