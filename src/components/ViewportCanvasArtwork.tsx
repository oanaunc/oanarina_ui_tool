import {memo,useCallback,useEffect,useMemo,useReducer,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import type {RefObject} from 'react';
import type {DesignNode} from '../model';
import {useEditor} from '../store';
import {usePreferences} from '../preferences';
import {useMaskView} from '../mask-view';
import {CanvasDetailContext,coarser,detailZoom,gestureDetail} from '../canvas-detail';
import {shareUnchangedNodes} from '../share-nodes';
import {cullStillCovers,cullViewportRoots,indexViewportRoots,layerInView,retainedReach} from '../viewport-culling';
import type {CullCamera} from '../viewport-culling';
import {cameraMoving,cameraWatchers,liveCamera,readyShadows} from '../canvas-camera';
import {cutBatches,planBatches,stepBatches} from '../progressive-page';
import type {BatchPlan,LayerBatch} from '../progressive-page';
import {decodeImage,decodeOrder,runDecodeQueue} from '../image-decode-queue';
import MaskCanvasArtwork from './MaskCanvasArtwork';
import './progressive-page.css';
const Batch=memo(function Batch({detail,...artwork}:React.ComponentProps<typeof MaskCanvasArtwork>&{detail:number|undefined}){return <CanvasDetailContext.Provider value={detail}><MaskCanvasArtwork {...artwork}/></CanvasDetailContext.Provider>;});
const sameLayers=(a:readonly DesignNode[],b:readonly DesignNode[])=>a===b||a.length===b.length&&a.every((n,i)=>n===b[i]);
/** Only this Canvas boundary narrows the render list. All editing/export callers retain the complete source. */
export default function ViewportCanvasArtwork({nodes,canvasRef,activeId,drafting,onNode}:{nodes:DesignNode[];canvasRef:RefObject<SVGSVGElement|null>;activeId:string|null;drafting:boolean;onNode:(e:React.PointerEvent,id:string)=>void}){
 const s=useEditor(),prefs=usePreferences(),masks=useMaskView(),[size,setSize]=useState({width:0,height:0});
 useEffect(()=>{const el=canvasRef.current;if(!el)return;const measure=()=>setSize(old=>old.width===el.clientWidth&&old.height===el.clientHeight?old:{width:el.clientWidth,height:el.clientHeight});measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[canvasRef]);
 const enabled=prefs.viewportCulling&&!s.motionOpen&&!s.outlines&&!masks.outlines&&!masks.preview&&s.mode==='design'&&!s.home&&!s.uiHidden;
 // A drag replaces the layers on every move, so it keeps what was left out when it began. Those layers aren't the ones moving.
 const index=useMemo(()=>enabled&&!drafting?indexViewportRoots(nodes):null,[nodes,enabled,drafting]),settled=useRef<{nodes:DesignNode[];omitted:ReadonlySet<string>}|null>(null);
 // A big page's list outlives small camera moves. A gesture moves the camera without the store, so it asks for a new cut itself as the view nears the edge of this one. Detail drops as a gesture zooms out, and comes back when it ends.
 const reach=retainedReach(nodes.length,size),seen=liveCamera(),moving=cameraMoving(),cutAt=useRef<CullCamera>({zoom:seen.zoom,pan:seen.pan}),[,recut]=useReducer((n:number)=>n+1,0);if(!cullStillCovers(cutAt.current,seen,size,reach))cutAt.current={zoom:seen.zoom,pan:seen.pan};const cut=cutAt.current;
 const wanted=enabled?detailZoom(gestureDetail(seen.zoom,s.zoom)):undefined,detailIn=useRef(wanted);if(!moving||coarser(wanted,detailIn.current))detailIn.current=wanted;const detail=detailIn.current;
 useEffect(()=>{if(!enabled||drafting)return;const watch=(camera:CullCamera)=>{if(!cullStillCovers(cutAt.current,camera,size,reach)||coarser(detailZoom(gestureDetail(camera.zoom,useEditor.getState().zoom)),detailIn.current))recut();};cameraWatchers.add(watch);return()=>{cameraWatchers.delete(watch);};},[enabled,drafting,size,reach]);
 const result=useMemo(()=>{if(enabled&&drafting&&settled.current){const omitted=settled.current.omitted,shown=nodes.filter(n=>!omitted.has(n.id));shareUnchangedNodes([{id:'',nodes:settled.current.nodes}],[{id:'',nodes:shown}]);return {nodes:shown,omittedRoots:0,omittedNodes:omitted.size,retainedUncertain:0,fallback:''};}return index?cullViewportRoots(nodes,index,cut,size,[...s.selection,...(s.vectorEditId?[s.vectorEditId]:[]),...(activeId?[activeId]:[])],enabled,reach):{nodes,omittedRoots:0,omittedNodes:0,retainedUncertain:0,fallback:'Culling is disabled for this view.'};},[nodes,index,cut,reach,size,s.selection,s.vectorEditId,activeId,enabled,drafting]);
 // Selecting a layer outside the list recuts it without changing what's in it, and that must not redraw the page.
 const listed=useRef(result.nodes),list=useMemo(()=>{if(!sameLayers(listed.current,result.nodes))listed.current=result.nodes;return listed.current;},[result.nodes]);
 if(!drafting&&index&&settled.current?.nodes!==list){const shown=new Set(list.map(n=>n.id));settled.current={nodes:list,omitted:new Set(nodes.flatMap(n=>shown.has(n.id)?[]:[n.id]))};}
 // A big page draws in batches of whole roots for as long as it is open. Each one is memoized, so a change costs one batch rather than the page.
 const plan=useRef<{index:object;batches:BatchPlan|null}|null>(null);if(index&&plan.current?.index!==index)plan.current={index,batches:index.fallback?null:planBatches(nodes,index.rootFor,plan.current?.batches)};
 const batching=enabled?plan.current?.batches??null:null,cutList=useRef<LayerBatch[]>([]),target=useMemo(()=>cutList.current=batching?cutBatches(list,batching,detail,cutList.current):[{key:-1,nodes:list,detail}],[list,batching,detail]);
 // An edit shows at once. Opening a page, or a camera move, reaches the wanted batches one frame at a time, so the window never waits on all of them.
 const pulse=useRef(0),pageKey=s.doc.id+'\0'+s.pageId,opened=useRef(''),opening=useRef<DesignNode[]|null>(null),drawn=useRef<{target:LayerBatch[];source:DesignNode[];page:string;batches:LayerBatch[];left:number;pulse?:number}>({target:[],source:nodes,page:'',batches:[],left:0}),[,advance]=useReducer((n:number)=>n+1,0);
 if(opened.current!==pageKey&&size.width>0&&index&&!drafting){opened.current=pageKey;opening.current=batching&&target.length>1?list:null;}
 if(opening.current&&opening.current!==list)opening.current=null;
 const step=drawn.current,needed=(n:DesignNode)=>!!index&&layerInView(index,n.id,seen,size);if(step.page!==pageKey||step.target!==target||step.source!==nodes){const quiet=step.source===nodes&&step.page===pageKey,fresh=step.page!==pageKey&&!!opening.current,next=batching&&quiet?stepBatches(target,step.batches,needed):fresh?stepBatches(target,[]):{batches:target,left:0};drawn.current={target,source:nodes,page:pageKey,...next};}
 else if(step.left&&step.pulse!==pulse.current){const next=stepBatches(target,step.batches,opening.current?undefined:needed);drawn.current={...step,...next,pulse:pulse.current};}
 const {batches,left}=drawn.current,total=opening.current?target.length:0,shown=opening.current?total-left:0,loading=left>0&&total>0;
 useEffect(()=>{if(!left)return;const frame=requestAnimationFrame(()=>{pulse.current++;advance();});return()=>cancelAnimationFrame(frame);});
 useEffect(()=>{if(!drafting&&canvasRef.current)readyShadows(canvasRef.current);},[batches,drafting,canvasRef]);
 const handler=useRef(onNode);handler.current=onNode;const pressed=useCallback((e:React.PointerEvent,id:string)=>handler.current(e,id),[]);
 // One pass per opened page: the first view decides the order, and later edits reuse images already decoded.
 const [decoding,setDecoding]=useState('');
 useEffect(()=>{if(!size.width||s.home)return;const held:HTMLImageElement[]=[],urls=decodeOrder(nodes,useEditor.getState(),size);if(!urls.length){setDecoding('');return;}setDecoding('decoding');const run=runDecodeQueue(urls,src=>decodeImage(src,held),()=>setDecoding('decoded'));return()=>{run.cancel();held.length=0;};},[pageKey,size.width>0,s.home]);
 const retain=String(s.fontRevision);
 return <g data-image-decode={decoding||undefined} data-viewport-culling={enabled?'enabled':'disabled'} data-culled-root-count={result.omittedRoots} data-culled-node-count={result.omittedNodes} data-retained-uncertain-roots={result.retainedUncertain} data-culling-fallback={result.fallback||undefined} data-progressive-page={total?loading?'loading':'complete':undefined} data-progressive-shown={total?shown:undefined} data-progressive-total={total?total:undefined}>{batches.map(batch=><Batch key={batch.key} detail={batch.detail} retain={retain} nodes={batch.nodes} mediaMode={s.motionOpen?undefined:'editor'} outlines={s.outlines} zoom={masks.outlines?s.zoom:1} onNode={pressed}/>)}{loading&&createPortal(<div className="page-loading" role="status">Loading page… {Math.round(shown/total*100)}%</div>,document.body)}</g>;
}
