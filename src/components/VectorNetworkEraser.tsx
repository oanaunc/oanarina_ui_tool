import {useEffect,useRef,useState} from 'react';
import type {RefObject} from 'react';
import type {DesignNode} from '../model';
import {useVectorEraser} from '../vector-eraser';
import {commitNetworkEraser,useNetworkView} from '../vector-network-actions';
import type {NetworkContext} from '../vector-network-actions';
import {eraseNetwork} from '../vector-network-cut';
import type {VectorNetwork} from '../vector-network-geometry';
import type {Matrix} from '../transforms';
import {notifyError} from '../files';
import CanvasPaintHint from './CanvasPaintHint';
type P={x:number;y:number};
/** The brush keeps its size and shape in the shared eraser settings; only the surface differs from the contour eraser. */
export default function VectorNetworkEraser({c,n,matrix,space,onPreview}:{c:NetworkContext;n:DesignNode;matrix:Matrix;space:RefObject<boolean>;onPreview:(graph:VectorNetwork|null,gone?:boolean)=>void}){
 const brush=useVectorEraser(),drag=useRef<{pointer:number;element:SVGElement;points:P[]}|null>(null),[cursor,setCursor]=useState<P|null>(null),[points,setPoints]=useState<P[]>([]);
 const cancel=()=>{const d=drag.current;drag.current=null;setPoints([]);onPreview(null);if(d?.element.hasPointerCapture(d.pointer))d.element.releasePointerCapture(d.pointer);};
 const cancelRef=useRef(cancel);cancelRef.current=cancel;useEffect(()=>{const off=useNetworkView.subscribe(v=>{if(drag.current&&v.context!==c)cancelRef.current();});return off;},[c]);
 const position=(e:React.PointerEvent<SVGElement>)=>{const rect=e.currentTarget.ownerSVGElement!.getBoundingClientRect();return {x:(e.clientX-rect.left-c.pan.x)/c.zoom,y:(e.clientY-rect.top-c.pan.y)/c.zoom};};
 const preview=(list:P[])=>{setPoints(list.slice());try{const next=eraseNetwork(n,matrix,{points:list,diameter:brush.diameter,shape:brush.shape});if(next===null)onPreview(null,true);else onPreview(next??null);}catch{/* A stroke past a graph limit reports on release. */}};
 const begin=(e:React.PointerEvent<SVGElement>)=>{if(e.button!==0||space.current)return;e.preventDefault();e.stopPropagation();if(!e.isPrimary||drag.current)return;const p=position(e);e.currentTarget.ownerSVGElement!.focus({preventScroll:true});e.currentTarget.setPointerCapture(e.pointerId);drag.current={pointer:e.pointerId,element:e.currentTarget,points:[p]};setCursor(p);preview([p]);};
 const add=(e:React.PointerEvent<SVGElement>)=>{const d=drag.current,p=position(e);setCursor(p);if(!d||d.pointer!==e.pointerId)return;e.stopPropagation();const last=d.points.at(-1)!;if(Math.hypot(p.x-last.x,p.y-last.y)<1/c.zoom||d.points.length>=64)return;d.points.push(p);preview(d.points);};
 const end=(e:React.PointerEvent<SVGElement>)=>{const d=drag.current;if(!d||d.pointer!==e.pointerId)return;e.preventDefault();e.stopPropagation();add(e);const list=d.points;cancel();try{commitNetworkEraser(c,{points:list,diameter:brush.diameter,shape:brush.shape});}catch(error){notifyError(error);}};
 const r=brush.diameter/2;
 return <g data-network-eraser=""><rect x={-1e6} y={-1e6} width={2e6} height={2e6} fill="transparent" style={{cursor:'crosshair',touchAction:'none'}} onPointerDown={begin} onPointerMove={add} onPointerUp={end} onPointerCancel={e=>{if(drag.current?.pointer===e.pointerId)cancel();}} onLostPointerCapture={e=>{if(drag.current?.pointer===e.pointerId)cancel();}} onPointerLeave={()=>{if(!drag.current)setCursor(null);}}/>
 {cursor&&<g pointerEvents="none">{brush.shape==='round'?<circle cx={cursor.x} cy={cursor.y} r={r} fill="#eec9d622" stroke="#b1637f" strokeWidth={1/c.zoom}/>:<rect x={cursor.x-r} y={cursor.y-r} width={r*2} height={r*2} fill="#eec9d622" stroke="#b1637f" strokeWidth={1/c.zoom}/>}<CanvasPaintHint origin={{x:cursor.x+r,y:cursor.y-r-35/c.zoom}} zoom={c.zoom} mode="eraser" label={`Network eraser · ${points.length}/64 positions · Esc`}/></g>}
 </g>;
}
