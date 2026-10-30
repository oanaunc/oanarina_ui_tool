import {create} from 'zustand';
import type {DesignNode} from './model';
import type {Constraint} from './layout';
import {point,worldMatrix} from './transforms';

/** View-only state: never saved into, or added to Undo for, a design document. */
export const useConstraintGuides=create<{visible:boolean;setVisible:(visible:boolean)=>void}>(set=>({visible:false,setVisible:visible=>set({visible})}));
export function constraintParent(n:DesignNode,nodes:DesignNode[]){const parent=nodes.find(p=>p.id===n.parentId);return parent&&['frame','component','instance'].includes(parent.type)&&(parent.layout==='none'||n.ignoreLayout)?parent:undefined;}
export interface ConstraintGuide {axis:'x'|'y';mode:Constraint;from:{x:number;y:number};to:{x:number;y:number};}
/** Constraints use the layer's layout box in parent coordinates, before its own rotation. */
export function constraintGuides(n:DesignNode,nodes:DesignNode[]):ConstraintGuide[]{
 const parent=constraintParent(n,nodes);if(!parent)return [];
 const matrix=worldMatrix(parent,nodes),left=n.x-parent.x,top=n.y-parent.y,result:ConstraintGuide[]=[];
 for(const axis of ['x','y'] as const){if(n.layoutGuideBindings?.[axis])continue;const mode=(axis==='x'?n.constraintX:n.constraintY)??'start',start=axis==='x'?left:top,size=axis==='x'?n.width:n.height,end=start+size,total=axis==='x'?parent.width:parent.height,cross=axis==='x'?top+n.height/2:left+n.width/2;
  const line=(a:number,b:number)=>{const from=axis==='x'?point(matrix,a,cross):point(matrix,cross,a),to=axis==='x'?point(matrix,b,cross):point(matrix,cross,b);if([from.x,from.y,to.x,to.y].every(Number.isFinite))result.push({axis,mode,from,to});};
  if(mode==='start'||mode==='stretch'||mode==='scale')line(0,start);
  if(mode==='end'||mode==='stretch'||mode==='scale')line(end,total);
  if(mode==='center')line(total/2,start+size/2);
 }
 return result;
}
