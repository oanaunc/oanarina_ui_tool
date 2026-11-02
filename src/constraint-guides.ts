import {create} from 'zustand';
import type {DesignNode} from './model';
import type {Constraint} from './layout';
import {point,worldMatrix} from './transforms';
import {activeGuideBinding} from './responsive-guides';

/** View-only state: never saved into, or added to Undo for, a design document. */
export const useConstraintGuides=create<{visible:boolean;setVisible:(visible:boolean)=>void}>(set=>({visible:false,setVisible:visible=>set({visible})}));
export function constraintParent(n:DesignNode,nodes:DesignNode[]){const parent=nodes.find(p=>p.id===n.parentId);return parent&&['frame','component','instance'].includes(parent.type)&&(parent.layout==='none'||n.ignoreLayout)?parent:undefined;}
export interface ConstraintGuide {axis:'x'|'y';mode:Constraint;from:{x:number;y:number};to:{x:number;y:number};}
/** Constraints use the layer's layout box in parent coordinates, before its own rotation. */
export function constraintGuides(n:DesignNode,nodes:DesignNode[]):ConstraintGuide[]{
 const parent=constraintParent(n,nodes),result:ConstraintGuide[]=[];
 const pinLines=(axis:'x'|'y')=>{const pin=activeGuideBinding(n,axis,id=>nodes.find(v=>v.id===id));if(!pin)return;const b=pin.binding,align=b.align??'stretch';if(align==='stretch'&&!b.offset&&!b.endOffset)return;const matrix=worldMatrix(pin.owner,nodes),track=pin.range.position-pin.owner[axis],end=track+pin.range.size,own=axis==='x'?n.width:n.height,from=n[axis]-pin.owner[axis],cross=axis==='x'?n.y-pin.owner.y+n.height/2:n.x-pin.owner.x+n.width/2,line=(a:number,c:number)=>{if(Math.abs(a-c)<.01)return;const start=axis==='x'?point(matrix,a,cross):point(matrix,cross,a),to=axis==='x'?point(matrix,c,cross):point(matrix,cross,c);result.push({axis,mode:align,from:start,to});};if(align==='start'||align==='stretch')line(track,from);if(align==='end'||align==='stretch')line(from+own,end);if(align==='center')line((track+end)/2,from+own/2);};
 for(const axis of ['x','y'] as const)if(n.layoutGuideBindings?.[axis])pinLines(axis);
 if(!parent)return result;
 const matrix=worldMatrix(parent,nodes),left=n.x-parent.x,top=n.y-parent.y;
 for(const axis of ['x','y'] as const){if(n.layoutGuideBindings?.[axis])continue;const mode=(axis==='x'?n.constraintX:n.constraintY)??'start',start=axis==='x'?left:top,size=axis==='x'?n.width:n.height,end=start+size,total=axis==='x'?parent.width:parent.height,cross=axis==='x'?top+n.height/2:left+n.width/2;
  const line=(a:number,b:number)=>{const from=axis==='x'?point(matrix,a,cross):point(matrix,cross,a),to=axis==='x'?point(matrix,b,cross):point(matrix,cross,b);if([from.x,from.y,to.x,to.y].every(Number.isFinite))result.push({axis,mode,from,to});};
  if(mode==='start'||mode==='stretch'||mode==='scale')line(0,start);
  if(mode==='end'||mode==='stretch'||mode==='scale')line(end,total);
  if(mode==='center')line(total/2,start+size/2);
 }
 return result;
}
