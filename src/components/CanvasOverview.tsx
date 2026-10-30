import {useEffect,useId,useLayoutEffect,useMemo,useRef,useState} from 'react';
import type {KeyboardEvent,PointerEvent,RefObject} from 'react';
import type {DesignNode} from '../model';
import type {CanvasCamera} from '../canvas-navigation';
import type {OverviewRect} from '../canvas-overview';
import {canvasViewport,centeredCamera,overviewExtent,overviewFitCamera,overviewProjection,overviewScene,scrollbarAxis} from '../canvas-overview';
import {captureOverviewContext,overviewAvailable,sameOverviewContext} from '../overview-context';
import type {OverviewContext} from '../overview-context';
import {useEditor} from '../store';
import {getPreferences,subscribePreferences,usePreferences} from '../preferences';
import './canvas-overview.css';

interface Gesture {extent:OverviewRect;token:number;element:Element;pointerId:number;context:OverviewContext;update:(x:number,y:number)=>CanvasCamera;}
export default function CanvasOverview({nodes,canvasRef}:{nodes:DesignNode[];canvasRef:RefObject<SVGSVGElement|null>}){
 const s=useEditor(),prefs=usePreferences(),description=useId(),scene=useMemo(()=>overviewScene(nodes),[nodes]),gesture=useRef<Gesture|null>(null),[size,setSize]=useState({width:1,height:1}),session=useRef(captureOverviewContext(s,prefs.uiScale)),[,refreshContext]=useState(0);
 if(!sameOverviewContext(session.current,s,prefs.uiScale))session.current=captureOverviewContext(s,prefs.uiScale);const context=session.current,available=overviewAvailable(s),pageName=s.doc.pages.find(p=>p.id===s.pageId)?.name??'Current page';
 const view=canvasViewport(s,size.width,size.height),extent=gesture.current&&s.cameraGesture===gesture.current.token?gesture.current.extent:overviewExtent(scene.bounds,view),projection=overviewProjection(extent),frame=projection.project(view);
 const horizontal=scrollbarAxis(extent,view,'x',size.width-38,s.zoom),vertical=scrollbarAxis(extent,view,'y',size.height-86,s.zoom);
 const cancel=()=>{const g=gesture.current;if(!g)return;gesture.current=null;useEditor.getState().finishCameraGesture(g.token,true);if(g.element.hasPointerCapture(g.pointerId))g.element.releasePointerCapture(g.pointerId);};
 useLayoutEffect(()=>{const canvas=canvasRef.current;if(!canvas)return;let width=0,height=0;const measure=()=>{if(canvas.clientWidth===width&&canvas.clientHeight===height)return;session.current.valid=false;cancel();width=canvas.clientWidth;height=canvas.clientHeight;setSize({width:Math.max(1,width),height:Math.max(1,height)});};measure();const observer=new ResizeObserver(measure);observer.observe(canvas);window.addEventListener('resize',measure);return()=>{observer.disconnect();window.removeEventListener('resize',measure);cancel();};},[canvasRef]);
 useEffect(()=>{const interrupt=()=>{session.current.valid=false;cancel();refreshContext(n=>n+1);},key=(e:globalThis.KeyboardEvent)=>{if(e.key==='Escape'&&gesture.current){e.preventDefault();e.stopImmediatePropagation();cancel();}};window.addEventListener('keydown',key,true);window.addEventListener('blur',interrupt);window.addEventListener('resize',interrupt);document.addEventListener('visibilitychange',interrupt);return()=>{window.removeEventListener('keydown',key,true);window.removeEventListener('blur',interrupt);window.removeEventListener('resize',interrupt);document.removeEventListener('visibilitychange',interrupt);cancel();};},[]);
 useLayoutEffect(()=>{context.valid=session.current===context&&sameOverviewContext({...context,valid:true},useEditor.getState(),getPreferences().uiScale);const visibility=getPreferences(),off=useEditor.subscribe(live=>{if(!sameOverviewContext(context,live,getPreferences().uiScale)){context.valid=false;if(gesture.current?.context===context)cancel();}}),preferences=subscribePreferences(()=>{const live=getPreferences();if(live.uiScale!==context.uiScale||live.showCanvasScrollbars!==visibility.showCanvasScrollbars||live.showOverviewMinimap!==visibility.showOverviewMinimap){context.valid=false;cancel();}});return()=>{context.valid=false;off();preferences();};},[context]);
 useLayoutEffect(()=>{cancel();},[prefs.showCanvasScrollbars,prefs.showOverviewMinimap,prefs.uiScale]);
 useLayoutEffect(()=>{if(gesture.current&&s.cameraGesture!==gesture.current.token)cancel();},[s.cameraGesture]);
 const allowed=(c=context)=>!document.hidden&&sameOverviewContext(c,useEditor.getState(),getPreferences().uiScale)&&overviewAvailable(useEditor.getState());
 const apply=(g:Gesture,x:number,y:number)=>{if(!allowed(g.context)||!g.element.hasPointerCapture(g.pointerId)){cancel();return false;}const camera=g.update(x,y);g.context.camera=camera;if(!useEditor.getState().updateCameraGesture(g.token,camera)){g.context.valid=false;cancel();return false;}return true;};
 const start=(e:PointerEvent<HTMLElement>,update:Gesture['update'])=>{e.stopPropagation();if(e.button!==0||!e.isPrimary||gesture.current||!allowed())return;e.preventDefault();e.currentTarget.focus({preventScroll:true});const token=useEditor.getState().beginCameraGesture(),g={extent,token,element:e.currentTarget,pointerId:e.pointerId,context,update};gesture.current=g;e.currentTarget.setPointerCapture(e.pointerId);apply(g,e.clientX,e.clientY);};
 const move=(e:PointerEvent<HTMLElement>)=>{e.stopPropagation();const g=gesture.current;if(!g||g.pointerId!==e.pointerId)return;e.preventDefault();apply(g,e.clientX,e.clientY);};
 const finish=(e:PointerEvent<HTMLElement>)=>{e.stopPropagation();const g=gesture.current;if(!g||g.pointerId!==e.pointerId)return;e.preventDefault();if(!apply(g,e.clientX,e.clientY))return;gesture.current=null;useEditor.getState().finishCameraGesture(g.token);if(g.element.hasPointerCapture(e.pointerId))g.element.releasePointerCapture(e.pointerId);};
 const interrupted=(e:PointerEvent<HTMLElement>)=>{e.stopPropagation();if(gesture.current?.pointerId===e.pointerId)cancel();};
 const pointerProps={onPointerMove:move,onPointerUp:finish,onPointerCancel:interrupted,onLostPointerCapture:interrupted};
 const fit=()=>{if(!allowed())return;cancel();useEditor.getState().setCamera(overviewFitCamera(scene.bounds,size.width,size.height));};
 const keyboard=(e:KeyboardEvent<HTMLElement>,axis?:'x'|'y')=>{
  if(e.metaKey||e.ctrlKey||e.altKey)return;
  if(e.key===' '||e.key==='Enter'){e.preventDefault();e.stopPropagation();return;}
  if(!axis&&e.key.toLowerCase()==='f'){e.preventDefault();e.stopPropagation();fit();return;}
  if(!allowed()){if(e.key.startsWith('Arrow')||['Home','End','PageUp','PageDown'].includes(e.key)){e.preventDefault();e.stopPropagation();}return;}
  if(axis&&((axis==='x'&&['ArrowUp','ArrowDown'].includes(e.key))||(axis==='y'&&['ArrowLeft','ArrowRight'].includes(e.key)))){e.preventDefault();e.stopPropagation();return;}
  if(e.key.startsWith('Arrow')||['Home','End','PageUp','PageDown'].includes(e.key))cancel();
  const current=useEditor.getState(),v=canvasViewport(current,size.width,size.height);let x=v.x,y=v.y,handled=true;
  const stepX=e.shiftKey?v.width*.8:24/current.zoom,stepY=e.shiftKey?v.height*.8:24/current.zoom;
  if(e.key==='ArrowLeft'&&axis!=='y')x-=stepX;else if(e.key==='ArrowRight'&&axis!=='y')x+=stepX;else if(e.key==='ArrowUp'&&axis!=='x')y-=stepY;else if(e.key==='ArrowDown'&&axis!=='x')y+=stepY;
  else if(!axis&&(e.key==='PageUp'||e.key==='PageDown'))y+=v.height*.8*(e.key==='PageUp'?-1:1);
  else if(axis&&(e.key==='PageUp'||e.key==='PageDown')){const step=(axis==='x'?v.width:v.height)*.8*(e.key==='PageUp'?-1:1);if(axis==='x')x+=step;else y+=step;}
  else if(axis&&(e.key==='Home'||e.key==='End')){const a=axis==='x'?horizontal:vertical;if(axis==='x')x=e.key==='Home'?a.minimum:a.maximum;else y=e.key==='Home'?a.minimum:a.maximum;}
  else if(!axis&&e.key==='Home'){x=(scene.bounds?scene.bounds.x+scene.bounds.width/2:0)-v.width/2;y=(scene.bounds?scene.bounds.y+scene.bounds.height/2:0)-v.height/2;}
  else handled=false;
  if(handled){e.preventDefault();e.stopPropagation();cancel();current.setCamera(centeredCamera(current,size.width,size.height,{x:x+v.width/2,y:y+v.height/2}));}
 };
 const startScrollbar=(e:PointerEvent<HTMLDivElement>,axis:'x'|'y')=>{
  e.stopPropagation();if(e.button!==0||!e.isPrimary||gesture.current||!allowed())return;const rect=e.currentTarget.getBoundingClientRect(),length=axis==='x'?e.currentTarget.clientWidth:e.currentTarget.clientHeight,scale=(axis==='x'?rect.width:rect.height)/(length+2),camera={zoom:s.zoom,pan:{...s.pan}},a=scrollbarAxis(extent,view,axis,length,s.zoom),origin=(axis==='x'?rect.left:rect.top)+scale,coordinate=axis==='x'?e.clientX:e.clientY,position=(coordinate-origin)/scale,offset=position>=a.offset&&position<=a.offset+a.size?position-a.offset:a.size/2;
  start(e,(x,y)=>{const value=a.fromOffset(((axis==='x'?x:y)-origin)/scale-offset),pan={...camera.pan,[axis]:-value*camera.zoom};return{zoom:camera.zoom,pan};});
 };
 const startMap=(e:PointerEvent<HTMLButtonElement>)=>{
  e.stopPropagation();if(e.button!==0||!e.isPrimary||gesture.current||!allowed())return;const rect=e.currentTarget.getBoundingClientRect(),camera={zoom:s.zoom,pan:{...s.pan}},frozen=projection,world=(x:number,y:number)=>frozen.world((x-rect.left)*200/rect.width,(y-rect.top)*128/rect.height),p=world(e.clientX,e.clientY),inside=p.x>=view.x&&p.x<=view.x+view.width&&p.y>=view.y&&p.y<=view.y+view.height,offset=inside?{x:p.x-(view.x+view.width/2),y:p.y-(view.y+view.height/2)}:{x:0,y:0};
  start(e,(x,y)=>{const p=world(x,y);return centeredCamera(camera,size.width,size.height,{x:p.x-offset.x,y:p.y-offset.y});});
 };
 const aria=(axis:'x'|'y')=>{const a=axis==='x'?horizontal:vertical;return{'aria-valuemin':a.minimum,'aria-valuemax':a.maximum,'aria-valuenow':a.value,'aria-valuetext':`${Math.round(a.value)} canvas units`};};
 if(!available)return null;
 return <>
  <span id={description} className="canvas-overview-instructions">Arrow keys pan. Shift with arrows or Page Up and Page Down moves by a page. Home and End reach scrollbar edges. In the overview, Home centers artwork and F fits page bounds. Escape cancels dragging. Schematic layout boxes only: masks, effects and exact painted outlines are not shown.</span>
  {prefs.showCanvasScrollbars&&<>
   <div role="scrollbar" tabIndex={0} aria-label="Horizontal canvas scrollbar" aria-orientation="horizontal" aria-controls="forma-design-canvas" aria-describedby={description} {...aria('x')} className="canvas-scrollbar horizontal" onKeyDown={e=>keyboard(e,'x')} onPointerDown={e=>startScrollbar(e,'x')} {...pointerProps}><div aria-hidden="true" className="canvas-scrollbar-thumb" style={{left:horizontal.offset,width:horizontal.size}}/></div>
   <div role="scrollbar" tabIndex={0} aria-label="Vertical canvas scrollbar" aria-orientation="vertical" aria-controls="forma-design-canvas" aria-describedby={description} {...aria('y')} className="canvas-scrollbar vertical" onKeyDown={e=>keyboard(e,'y')} onPointerDown={e=>startScrollbar(e,'y')} {...pointerProps}><div aria-hidden="true" className="canvas-scrollbar-thumb" style={{top:vertical.offset,height:vertical.size}}/></div>
  </>}
  {prefs.showOverviewMinimap&&<section className={'canvas-overview'+(prefs.showCanvasScrollbars?' with-scrollbars':'')} aria-label="Canvas overview minimap"><header><strong>Overview</strong><button type="button" aria-label="Fit page bounds in canvas" title="Fit schematic page bounds · F while map is focused" disabled={!scene.bounds} onClick={fit} onKeyDown={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.altKey&&(e.key===' '||e.key==='Enter')){e.stopPropagation();if(e.key===' '){e.preventDefault();fit();}}}}>Fit</button></header><div className="canvas-overview-caption" title={pageName}>{pageName} · {s.motionOpen?'Sampled Motion':'Saved base'} layout</div><button className="canvas-overview-map" aria-label="Navigate canvas overview" aria-describedby={description} onKeyDown={e=>keyboard(e)} onPointerDown={startMap} {...pointerProps}><svg viewBox="0 0 200 128" aria-hidden="true"><rect width="200" height="128" fill="var(--canvas)"/>{scene.boxes.map(b=>{const p=projection.project(b);return <rect key={b.id} data-overview-node={b.id} x={p.x} y={p.y} width={Math.max(.6,p.width)} height={Math.max(.6,p.height)} fill={['frame','section','component','instance'].includes(b.kind)?'#b79bd126':'#b79bd170'} stroke="#b79bd1" strokeWidth=".5"/>;})}<rect data-overview-viewport x={frame.x} y={frame.y} width={Math.max(.8,frame.width)} height={Math.max(.8,frame.height)} fill="#d9bfed18" stroke="#e2c8ff" strokeWidth="1.4"/></svg></button><p>{!scene.bounds?'Empty canvas':scene.omitted?`${scene.omitted} outlines omitted; ${scene.truncated?'first 20,000 layers':'all valid layers'} included in bounds`:'Drag or use arrow keys to navigate'}{scene.invalid>0?` · ${scene.invalid} invalid bounds skipped`:''}</p><p className="canvas-overview-limit">Schematic boxes · approximate clips · no masks or effect ink</p></section>}
 </>;
}
