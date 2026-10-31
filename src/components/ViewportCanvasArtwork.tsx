import {memo,useEffect,useMemo,useReducer,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {RefObject} from 'react';
import type {DesignNode} from '../model';
import {useEditor} from '../store';
import {usePreferences} from '../preferences';
import {useMaskView} from '../mask-view';
import {cullViewportRoots,indexViewportRoots} from '../viewport-culling';
import {progressiveBatches} from '../progressive-page';
import MaskCanvasArtwork from './MaskCanvasArtwork';
import './progressive-page.css';
const ProgressiveBatch=memo(MaskCanvasArtwork);
/** Only this Canvas boundary narrows the render list. All editing/export callers retain the complete source. */
export default function ViewportCanvasArtwork({nodes,canvasRef,activeId,drafting,onNode}:{nodes:DesignNode[];canvasRef:RefObject<SVGSVGElement|null>;activeId:string|null;drafting:boolean;onNode:(e:React.PointerEvent,id:string)=>void}){
 const s=useEditor(),prefs=usePreferences(),masks=useMaskView(),[size,setSize]=useState({width:0,height:0});
 useEffect(()=>{const el=canvasRef.current;if(!el)return;const measure=()=>setSize(old=>old.width===el.clientWidth&&old.height===el.clientHeight?old:{width:el.clientWidth,height:el.clientHeight});measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[canvasRef]);
 const enabled=prefs.viewportCulling&&!drafting&&!s.motionOpen&&!s.outlines&&!masks.outlines&&!masks.preview&&s.mode==='design'&&!s.home&&!s.uiHidden;
 const index=useMemo(()=>enabled?indexViewportRoots(nodes):null,[nodes,enabled]);
 const result=useMemo(()=>index?cullViewportRoots(nodes,index,s,size,[...s.selection,...(s.vectorEditId?[s.vectorEditId]:[]),...(activeId?[activeId]:[])],enabled):{nodes,omittedRoots:0,omittedNodes:0,retainedUncertain:0,fallback:'Culling is disabled for this view.'},[nodes,index,s.zoom,s.pan.x,s.pan.y,size,s.selection,s.vectorEditId,activeId,enabled]);
 // Batches belong to one exact render list. Any camera or edit that replaces the list returns to the single-pass scene.
 const pageKey=s.doc.id+'\0'+s.pageId,opened=useRef(''),session=useRef<{source:DesignNode[];batches:DesignNode[][];shown:number}|null>(null),[,advance]=useReducer((n:number)=>n+1,0);
 if(opened.current!==pageKey&&size.width>0&&index&&!drafting){opened.current=pageKey;const batches=enabled&&!index.fallback?progressiveBatches(result.nodes,index.rootFor):null;session.current=batches?{source:result.nodes,batches,shown:1}:null;}
 if(session.current&&session.current.source!==result.nodes)session.current=null;
 const live=session.current,total=live?.batches.length??0,shown=live?.shown??0,loading=shown<total;
 useEffect(()=>{if(!loading)return;const frame=requestAnimationFrame(()=>{if(session.current)session.current.shown++;advance();});return()=>cancelAnimationFrame(frame);});
 return <g data-viewport-culling={enabled?'enabled':'disabled'} data-culled-root-count={result.omittedRoots} data-culled-node-count={result.omittedNodes} data-retained-uncertain-roots={result.retainedUncertain} data-culling-fallback={result.fallback||undefined} data-progressive-page={live?loading?'loading':'complete':undefined} data-progressive-shown={live?shown:undefined} data-progressive-total={live?total:undefined}>{live?live.batches.slice(0,shown).map((batch,i)=><ProgressiveBatch key={i} nodes={batch} mediaMode={s.motionOpen?undefined:'editor'} outlines={s.outlines} zoom={s.zoom} onNode={onNode}/>):<MaskCanvasArtwork nodes={result.nodes} mediaMode={s.motionOpen?undefined:'editor'} outlines={s.outlines} zoom={s.zoom} onNode={onNode}/>}{loading&&createPortal(<div className="page-loading" role="status">Loading page… {Math.round(shown/total*100)}%</div>,document.body)}</g>;
}
