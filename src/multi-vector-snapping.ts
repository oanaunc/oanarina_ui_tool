import type {DesignNode} from './model';
import type {BendPoint} from './vector-bend-geometry';
import {vectorSnapIndex,snapVectorPoint} from './vector-snapping';
import type {VectorSnapHit,VectorSnapIndex} from './vector-snapping';

/** Targets for a multi-layer drag: everything except the contours that are moving, which would otherwise snap to themselves. */
export function multiVectorSnapIndex(nodes:DesignNode[],keys:readonly string[]):VectorSnapIndex{const moving=new Set(keys.map(k=>{const [id,contour]=JSON.parse(k) as [string,number];return JSON.stringify([id,contour]);})),index=vectorSnapIndex(nodes,'',''),free=(id:string,key:string)=>!moving.has(JSON.stringify([id,Number(key.split(':')[0])]));return {anchors:index.anchors.filter(a=>free(a.id,a.key)),curves:index.curves.filter(c=>free(c.id,c.key))};}
/** The grabbed anchor leads; every other selected anchor keeps the same canvas delta, so the selection keeps its shape. */
export function snappedMultiDelta(index:VectorSnapIndex,grabbed:BendPoint,delta:BendPoint,zoom:number):{delta:BendPoint;hit:VectorSnapHit|null}{const hit=snapVectorPoint(index,{x:grabbed.x+delta.x,y:grabbed.y+delta.y},zoom);return hit?{delta:{x:hit.point.x-grabbed.x,y:hit.point.y-grabbed.y},hit}:{delta,hit:null};}
