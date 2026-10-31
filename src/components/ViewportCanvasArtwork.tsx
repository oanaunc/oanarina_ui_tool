import {useEffect,useMemo,useState} from 'react';
import type {RefObject} from 'react';
import type {DesignNode} from '../model';
import {useEditor} from '../store';
import {usePreferences} from '../preferences';
import {useMaskView} from '../mask-view';
import {cullViewportRoots,indexViewportRoots} from '../viewport-culling';
import MaskCanvasArtwork from './MaskCanvasArtwork';
/** Only this Canvas boundary narrows the render list. All editing/export callers retain the complete source. */
export default function ViewportCanvasArtwork({nodes,canvasRef,activeId,drafting,onNode}:{nodes:DesignNode[];canvasRef:RefObject<SVGSVGElement|null>;activeId:string|null;drafting:boolean;onNode:(e:React.PointerEvent,id:string)=>void}){
 const s=useEditor(),prefs=usePreferences(),masks=useMaskView(),[size,setSize]=useState({width:0,height:0});
 useEffect(()=>{const el=canvasRef.current;if(!el)return;const measure=()=>setSize(old=>old.width===el.clientWidth&&old.height===el.clientHeight?old:{width:el.clientWidth,height:el.clientHeight});measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[canvasRef]);
 const enabled=prefs.viewportCulling&&!drafting&&!s.motionOpen&&!s.outlines&&!masks.outlines&&!masks.preview&&s.mode==='design'&&!s.home&&!s.uiHidden;
 const index=useMemo(()=>enabled?indexViewportRoots(nodes):null,[nodes,enabled]);
 const result=useMemo(()=>index?cullViewportRoots(nodes,index,s,size,[...s.selection,...(s.vectorEditId?[s.vectorEditId]:[]),...(activeId?[activeId]:[])],enabled):{nodes,omittedRoots:0,omittedNodes:0,retainedUncertain:0,fallback:'Culling is disabled for this view.'},[nodes,index,s.zoom,s.pan.x,s.pan.y,size,s.selection,s.vectorEditId,activeId,enabled]);
 return <g data-viewport-culling={enabled?'enabled':'disabled'} data-culled-root-count={result.omittedRoots} data-culled-node-count={result.omittedNodes} data-retained-uncertain-roots={result.retainedUncertain} data-culling-fallback={result.fallback||undefined}><MaskCanvasArtwork nodes={result.nodes} mediaMode={s.motionOpen?undefined:'editor'} outlines={s.outlines} zoom={s.zoom} onNode={onNode}/></g>;
}
