import {useEffect,useMemo,useState} from 'react';
import {t} from '../i18n';
import {useEditor} from '../store';
import {useAnnotationView} from '../annotation-view';
import {annotationMarkerPositions,annotationMatrices,annotationValue,setLayerAnnotations} from '../layer-annotations';
import type {LayerAnnotation} from '../layer-annotations';
import {annotationSegment,boxPoint,canvasBoxPoint} from '../annotation-measure';
import type {AnnotationPoint,AnnotationSegment} from '../annotation-measure';
import type {DesignNode} from '../model';
import type {Matrix} from '../transforms';
const measuring=(a:LayerAnnotation)=>a.kind==='measurement'||a.kind==='distance';
interface Detail {key:string;ownerId:string;text:string;value:string;color:string;x:number;y:number;segment?:AnnotationSegment;}
/** HTML and a detached SVG beside the canvas: this text never joins the artwork tree that exports serialize. */
export function AnnotationDetails({nodes,pan,zoom}:{nodes:DesignNode[];pan:{x:number;y:number};zoom:number}){
 const details=useMemo(()=>{try{const matrices=annotationMatrices(nodes),byId=new Map(nodes.map(n=>[n.id,n])),rows:Detail[]=[];for(const owner of annotationMarkerPositions(nodes)){const n=byId.get(owner.id)!,set=n.annotations!,offset={value:0};for(const a of set.items){const segment=measuring(a)?annotationSegment(n,a,{nodes},matrices):undefined,value=measuring(a)||a.kind==='property'?annotationValue(n,a,{nodes} as never,matrices).value:'',m=matrices.get(n.id)!,place=segment?{x:(segment.x1+segment.x2)/2,y:(segment.y1+segment.y2)/2}:a.at?boxPoint(n,m,a.at):{x:owner.x,y:owner.y+(offset.value++*44+18)/zoom};rows.push({key:n.id+':'+a.id,ownerId:n.id,text:a.text.slice(0,240),value,color:set.categories.find(c=>c.id===a.categoryId)?.color??'#d6336c',...place,segment});}}return {rows};}catch(e){return {rows:[],error:(e as Error).message};}},[nodes,zoom]);
 const screen=(x:number,y:number)=>({x:pan.x+x*zoom,y:pan.y+y*zoom});
 return <><svg className="annotation-lines" aria-hidden="true">{details.rows.flatMap(r=>{if(!r.segment)return [];const a=screen(r.segment.x1,r.segment.y1),b=screen(r.segment.x2,r.segment.y2);return [<g key={r.key} style={{color:r.color}}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y}/><circle cx={a.x} cy={a.y} r="3"/><circle cx={b.x} cy={b.y} r="3"/></g>];})}</svg>{details.error&&<span role="note">{details.error}</span>}{details.rows.map(r=>{const p=screen(r.x,r.y);return <div key={r.key} className="annotation-detail" data-annotation-detail={r.key} style={{left:p.x,top:p.y,borderLeftColor:r.color}}>{r.value&&<strong>{r.value}</strong>}{r.text&&<span>{r.text}</span>}</div>;})}</>;
}
const hitLayer=(x:number,y:number)=>{for(const el of document.elementsFromPoint(x,y)){const id=el.closest('#forma-design-canvas [data-node-id]')?.getAttribute('data-node-id');if(id)return id;}};
/** Pointer path into the same panels and edits as the sidebar: a note opens its editor, a measurement saves on the second click. */
export function AnnotationPlacementLayer({nodes,pan,zoom}:{nodes:DesignNode[];pan:{x:number;y:number};zoom:number}){
 const view=useAnnotationView(),[first,setFirst]=useState<{id:string;point:AnnotationPoint}|null>(null),[pointer,setPointer]=useState<{x:number;y:number}|null>(null),[error,setError]=useState(''),placing=view.placing;
 const matrices=useMemo(()=>{try{return annotationMatrices(nodes);}catch{return new Map<string,Matrix>();}},[nodes]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key!=='Escape')return;e.preventDefault();e.stopImmediatePropagation();useAnnotationView.getState().setPlacing(null);};window.addEventListener('keydown',key,true);return()=>window.removeEventListener('keydown',key,true);},[]);
 const world=(e:React.PointerEvent)=>{const svg=document.querySelector<SVGSVGElement>('#forma-design-canvas');if(!svg)return null;const r=svg.getBoundingClientRect(),sx=r.width/(svg.clientWidth||r.width),sy=r.height/(svg.clientHeight||r.height);return {x:((e.clientX-r.left)/sx-pan.x)/zoom,y:((e.clientY-r.top)/sy-pan.y)/zoom};};
 const place=(e:React.PointerEvent)=>{e.preventDefault();e.stopPropagation();if(e.button!==0||e.isPrimary===false)return;try{const at=world(e),id=hitLayer(e.clientX,e.clientY),n=nodes.find(v=>v.id===id),m=n&&matrices.get(n.id);if(!at||!n||!m)throw Error(t('Click a layer on the canvas.'));const hit=canvasBoxPoint(n,m,at,8/zoom),live=useEditor.getState();setError('');
  if(placing==='note'){view.setRequest({nodeId:n.id,at:hit});view.setPlacing(null);live.set({selection:[n.id],leftTab:'layers',vectorEditId:null,vectorSelection:[]});return;}
  if(!first){setFirst({id:n.id,point:hit});return;}const owner=nodes.find(v=>v.id===first.id);if(!owner)throw Error(t('The first measured layer is gone. Start again.'));const item:LayerAnnotation=first.id===n.id?{id:crypto.randomUUID(),kind:'measurement',text:'',measurement:'points',fromPoint:first.point,toPoint:hit}:{id:crypto.randomUUID(),kind:'distance',text:'',targetId:n.id,fromPoint:first.point,toPoint:hit};
  live.edit(d=>{const page=d.pages.find(p=>p.id===live.pageId),source=page?.nodes.find(v=>v.id===owner.id),set=structuredClone(source?.annotations??{categories:[],items:[]});set.items.push(item);setLayerAnnotations(d,live.pageId,owner.id,set);});useEditor.getState().set({selection:[owner.id],leftTab:'layers',vectorEditId:null,vectorSelection:[]});view.setDetails(true);view.setVisible(true);view.setPlacing(null);
 }catch(failure){setError((failure as Error).message);setFirst(null);}};
 const from=first&&matrices.get(first.id)?boxPoint(nodes.find(v=>v.id===first.id)!,matrices.get(first.id)!,first.point):null,start=from&&{x:pan.x+from.x*zoom,y:pan.y+from.y*zoom},end=pointer&&{x:pan.x+pointer.x*zoom,y:pan.y+pointer.y*zoom};
 return <div className="annotation-placement" role="application" aria-label={placing==='note'?t('Click a layer to annotate it'):t('Click two points to measure')} onPointerDown={place} onPointerMove={e=>setPointer(world(e))}>{start&&end&&<svg className="annotation-lines" aria-hidden="true"><g style={{color:'#d6336c'}}><line x1={start.x} y1={start.y} x2={end.x} y2={end.y}/><circle cx={start.x} cy={start.y} r="3"/></g></svg>}<p role="status">{error||(placing==='note'?t('Click a layer to annotate it. Escape cancels.'):first?t('Click the second point. Escape cancels.'):t('Click the first point. Escape cancels.'))}</p></div>;
}
