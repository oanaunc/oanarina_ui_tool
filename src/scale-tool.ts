import {create} from 'zustand';
import {canvasSelectionBounds,canvasSelectionRoots,resizeCanvasNodes} from './canvas-geometry';
import type {DesignNode,Page} from './model';
import {worldMatrix} from './transforms';
/** The nodes of a K Scale drag in progress. The panel reads them, because nothing is committed until the pointer lifts. */
export const useScaleDrag=create<{nodes:DesignNode[]|null}>(()=>({nodes:null}));
export const publishScaleDrag=(nodes:DesignNode[]|null)=>{if(useScaleDrag.getState().nodes!==nodes)useScaleDrag.setState({nodes});};
export type ScaleAnchor=readonly [0|.5|1,0|.5|1];
/** Typed scaling runs the same path as dragging a handle: the handle opposite the anchor, moved by the size this factor adds. */
export function scaleCanvasSelection(nodes:DesignNode[],ids:string[],factor:number,anchor:ScaleAnchor,motion:Page['motion']){
 if(!Number.isFinite(factor)||factor<=0)throw Error('Enter a scale above zero.');
 const roots=canvasSelectionRoots(nodes,ids),one=roots.length===1?roots[0]:undefined,box=one??canvasSelectionBounds(nodes,ids),[ax,ay]=anchor,center=ax===.5&&ay===.5,handle=center?'se':(ay===.5?'':ay===0?'s':'n')+(ax===.5?'':ax===0?'e':'w'),along=(size:number,grows:boolean,shrinks:boolean)=>size*(factor-1)*(center?.5:grows?1:shrinks?-1:0),x=along(box.width,handle.includes('e'),handle.includes('w')),y=along(box.height,handle.includes('s'),handle.includes('n')),m=one?worldMatrix(one,nodes):undefined;
 return resizeCanvasNodes(nodes,ids,handle,m?m[0]*x+m[2]*y:x,m?m[1]*x+m[3]*y:y,{scaleContents:true,center,settleScale:{motion}});
}
