import {useEffect,useRef,useState} from 'react';
import type {PointerEvent as ReactPointerEvent} from 'react';
import {useEditor} from '../store';
import {captureColorContext} from '../color-edit-context';
import {setTextPathOffset} from '../text-path-actions';
import {textBaselinePath} from '../text-path';
import {nearestPathLength,offsetPercent} from '../text-path-baseline';
import {inverseMatrix,point,worldMatrix} from '../transforms';
import {isLocked} from '../model';
import type {DesignNode} from '../model';
import {notifyError} from '../files';

function measure(n:DesignNode){const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',textBaselinePath(n));return path;}
/** Drags the start offset along the real baseline; glyphs follow in preview and one Undo step lands on release. */
export default function TextPathHandle({onPreview}:{onPreview:(nodes:DesignNode[]|null)=>void}){const s=useEditor(),page=s.doc.pages.find(p=>p.id===s.pageId)!,n=s.selection.length===1?page.nodes.find(v=>v.id===s.selection[0]):undefined,active=!!n?.textPath&&s.mode==='design'&&s.tool==='move'&&!s.motionOpen&&!s.modal&&!s.home&&!s.uiHidden&&!s.outlines&&!isLocked(n,page.nodes),[draft,setDraft]=useState<number|null>(null),drag=useRef<{pointer:number;target:SVGCircleElement;proof:ReturnType<typeof makeProof>;id:string;value:number;start:number}|null>(null),root=useRef<SVGGElement>(null);
 const makeProof=()=>({origin:captureColorContext(useEditor.getState()),valid:true});
 const cancel=()=>{const d=drag.current;drag.current=null;setDraft(null);onPreview(null);if(d?.target.hasPointerCapture(d.pointer))d.target.releasePointerCapture(d.pointer);};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&drag.current){e.preventDefault();e.stopImmediatePropagation();cancel();}},blur=()=>{if(drag.current)cancel();},off=useEditor.subscribe(state=>{const d=drag.current;if(d&&(state.doc!==d.proof.origin.doc||state.selection.length!==1||state.selection[0]!==d.id||state.zoom!==s.zoom||state.pan!==s.pan))cancel();});window.addEventListener('keydown',key,true);window.addEventListener('blur',blur);return()=>{off();window.removeEventListener('keydown',key,true);window.removeEventListener('blur',blur);};},[s.zoom,s.pan]);
 if(!active||!n)return null;let position:{x:number;y:number};let matrix;try{matrix=worldMatrix(n,page.nodes);const path=measure(n),total=path.getTotalLength(),at=path.getPointAtLength(total*(draft??n.textPath!.startOffset)/100);position={x:at.x,y:at.y};}catch{return null;}
 const toOffset=(e:ReactPointerEvent)=>{const ctm=root.current?.getScreenCTM();if(!ctm)throw Error('The text path handle needs a visible canvas.');const world=new DOMPoint(e.clientX,e.clientY).matrixTransform(ctm.inverse()),local=point(inverseMatrix(matrix),world.x,world.y),path=measure(n);return offsetPercent(nearestPathLength(path,local),path.getTotalLength());};
 const begin=(e:ReactPointerEvent<SVGCircleElement>)=>{e.stopPropagation();e.preventDefault();if(e.button!==0||!e.isPrimary||drag.current)return;try{e.currentTarget.setPointerCapture(e.pointerId);const start=n.textPath!.startOffset;drag.current={pointer:e.pointerId,target:e.currentTarget,proof:makeProof(),id:n.id,value:start,start};setDraft(start);}catch(error){cancel();notifyError(error);}};
 const move=(e:ReactPointerEvent<SVGCircleElement>)=>{const d=drag.current;if(!d||e.pointerId!==d.pointer)return;e.stopPropagation();try{const value=toOffset(e);d.value=value;setDraft(value);onPreview(useEditor.getState().doc.pages.find(p=>p.id===useEditor.getState().pageId)!.nodes.map(v=>v.id===d.id?{...v,textPath:{startOffset:value}}:v));}catch(error){cancel();notifyError(error);}};
 const end=(e:ReactPointerEvent<SVGCircleElement>)=>{const d=drag.current;if(!d||e.pointerId!==d.pointer)return;e.stopPropagation();e.preventDefault();drag.current=null;setDraft(null);onPreview(null);if(d.target.hasPointerCapture(d.pointer))d.target.releasePointerCapture(d.pointer);try{if(d.value!==d.start)setTextPathOffset(d.proof,d.id,d.value);}catch(error){notifyError(error);}};
 const r=6/s.zoom;return <g ref={root} data-text-path-handle={n.id}><g transform={`matrix(${matrix.join(' ')})`}><circle role="slider" aria-label="Text path start" aria-valuemin={0} aria-valuemax={100} aria-valuenow={draft??n.textPath!.startOffset} cx={position.x} cy={position.y} r={r} fill="#ffffff" stroke="#8560c5" strokeWidth={2/s.zoom} style={{cursor:'grab'}} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={e=>{if(drag.current?.pointer===e.pointerId)cancel();}} onLostPointerCapture={e=>{if(drag.current?.pointer===e.pointerId)cancel();}}/></g></g>;}
