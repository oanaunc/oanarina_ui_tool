import {useEffect,useRef,useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {useEditor} from '../store';
import {commitVectorKnife,sameKnifeContext,useVectorKnife} from '../vector-knife';
import {inverseMatrix,point,worldMatrix} from '../transforms';
import {notifyError} from '../files';

type P={x:number;y:number};
/** Document coordinates stop at ±1,000,000. Much larger hit areas overflow browser layout integers once zoomed, and stop receiving pointers. */
const CANVAS_REACH=2e6;
/** Drag a line across the selected shape; release splits it. Escape leaves the tool without a change. */
export default function VectorKnifeOverlay(){const s=useEditor(),view=useVectorKnife(),c=view.context&&sameKnifeContext(view.context)?view.context:null,root=useRef<SVGGElement>(null),drag=useRef<{pointer:number;target:Element;from:P;to:P}|null>(null),[line,setLine]=useState<{from:P;to:P}|null>(null);
 const cancel=()=>{const d=drag.current;drag.current=null;setLine(null);if(d?.target.hasPointerCapture(d.pointer))d.target.releasePointerCapture(d.pointer);};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&useVectorKnife.getState().context){e.preventDefault();e.stopImmediatePropagation();cancel();useVectorKnife.getState().reset();}},blur=()=>{cancel();};window.addEventListener('keydown',key,true);window.addEventListener('blur',blur);return()=>{window.removeEventListener('keydown',key,true);window.removeEventListener('blur',blur);};},[]);
 useEffect(()=>{if(!view.context)cancel();},[view.context]);
 if(!c)return null;
 const world=(e:ReactPointerEvent)=>{const ctm=root.current?.getScreenCTM();if(!ctm)throw Error('The knife needs a visible canvas.');const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(ctm.inverse());return {x:p.x,y:p.y};};
 const begin=(e:ReactPointerEvent<SVGRectElement>)=>{e.stopPropagation();e.preventDefault();if(e.button!==0||!e.isPrimary||drag.current)return;try{const from=world(e);e.currentTarget.setPointerCapture(e.pointerId);drag.current={pointer:e.pointerId,target:e.currentTarget,from,to:from};setLine({from,to:from});}catch(error){cancel();notifyError(error);}};
 const move=(e:ReactPointerEvent<SVGRectElement>)=>{const d=drag.current;if(!d||e.pointerId!==d.pointer)return;e.stopPropagation();d.to=world(e);setLine({from:d.from,to:d.to});};
 const end=(e:ReactPointerEvent<SVGRectElement>)=>{const d=drag.current;if(!d||e.pointerId!==d.pointer)return;e.stopPropagation();e.preventDefault();d.to=world(e);cancel();try{const live=useEditor.getState(),nodes=live.doc.pages.find(p=>p.id===live.pageId)!.nodes,n=nodes.find(v=>v.id===c.id);if(!n)throw Error('The slice target changed. Choose the knife again.');const inverse=inverseMatrix(worldMatrix(n,nodes));commitVectorKnife(c,point(inverse,d.from.x,d.from.y),point(inverse,d.to.x,d.to.y));}catch(error){notifyError(error);}};
 return <g ref={root} data-vector-knife={c.id}><rect x={-CANVAS_REACH} y={-CANVAS_REACH} width={2*CANVAS_REACH} height={2*CANVAS_REACH} fill="transparent" style={{cursor:'crosshair'}} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={e=>{if(drag.current?.pointer===e.pointerId)cancel();}} onLostPointerCapture={e=>{if(drag.current?.pointer===e.pointerId)cancel();}}/>{line&&<line x1={line.from.x} y1={line.from.y} x2={line.to.x} y2={line.to.y} stroke="#8560c5" strokeWidth={2/s.zoom} strokeDasharray={`${6/s.zoom} ${4/s.zoom}`} pointerEvents="none"/>}<g pointerEvents="none"><rect x={(14-s.pan.x)/s.zoom} y={(14-s.pan.y)/s.zoom} width={320/s.zoom} height={30/s.zoom} rx={6/s.zoom} fill="#221d2d"/><text x={(24-s.pan.x)/s.zoom} y={(34-s.pan.y)/s.zoom} fill="#ffffff" fontSize={12/s.zoom}>Knife · Drag a line across the shape · Escape to stop</text></g></g>;}
