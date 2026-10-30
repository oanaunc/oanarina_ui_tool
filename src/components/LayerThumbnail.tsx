import {useEffect,useId,useMemo,useRef,useState} from 'react';
import type {RefObject} from 'react';
import {createPortal} from 'react-dom';
import type {DesignDocument,Page} from '../model';
import {layerPreviewGeometry,layerPreviewIndex} from '../layer-thumbnail';
import {thumbnailPlacement} from '../page-thumbnail';
import {exportSvg} from '../files';
import {useEditor} from '../store';
import './page-thumbnail.css';
import './layer-thumbnail.css';

type Request={id:string;row:HTMLElement;kind:'hover'|'focus'};
export default function LayerThumbnail({tree,page,doc,blocked,resetKey}:{tree:RefObject<HTMLDivElement|null>;page:Page;doc:DesignDocument;blocked:boolean;resetKey:string}){
 const tooltipId=useId(),timer=useRef<ReturnType<typeof setTimeout>|null>(null),request=useRef<Request|null>(null),[preview,setPreview]=useState<(Request&{anchor:{left:number;right:number;top:number}})|null>(null),index=useMemo(()=>layerPreviewIndex(page.nodes),[page.nodes]);
 useEffect(()=>{
  const root=tree.current;if(!root)return;
  const clear=()=>{if(timer.current!==null)clearTimeout(timer.current);timer.current=null;request.current=null;setPreview(null);};
  const valid=(r:Request)=>{const s=useEditor.getState();return !blocked&&s.doc===doc&&s.pageId===page.id&&!s.modal&&!s.motionOpen&&!s.home&&!s.uiHidden&&s.leftTab==='layers'&&r.row.isConnected&&(r.kind!=='focus'||document.activeElement===r.row);};
  const arm=(r:Request)=>{clear();if(!valid(r))return;request.current=r;timer.current=setTimeout(()=>{timer.current=null;request.current=null;if(!valid(r))return;const {left,right,top}=r.row.getBoundingClientRect();setPreview({...r,anchor:{left,right,top}});},200);};
  const row=(e:Event)=>e.target instanceof Element?e.target.closest<HTMLElement>('[data-layer-id]'):null;
  const enter=(e:PointerEvent)=>{const target=row(e);if(target&&!(e.relatedTarget instanceof Node&&target.contains(e.relatedTarget)))arm({id:target.dataset.layerId!,row:target,kind:'hover'});};
  const leave=(e:PointerEvent)=>{const target=row(e);if(target&&!(e.relatedTarget instanceof Node&&target.contains(e.relatedTarget)))clear();};
  const focus=(e:FocusEvent)=>{const target=row(e);if(target&&e.target===target)arm({id:target.dataset.layerId!,row:target,kind:'focus'});else clear();};
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'&&(timer.current!==null||root.querySelector('[data-layer-preview-owner]'))){e.preventDefault();e.stopPropagation();clear();}};
  const scroll=()=>{const pending=request.current;clear();if(pending?.kind==='focus'&&valid(pending)){const r=pending.row.getBoundingClientRect(),box=root.getBoundingClientRect();if(r.top<box.bottom&&r.bottom>box.top)arm(pending);}};
  root.addEventListener('pointerover',enter);root.addEventListener('pointerout',leave);root.addEventListener('focusin',focus);root.addEventListener('focusout',clear);root.addEventListener('pointerdown',clear);root.addEventListener('contextmenu',clear);root.addEventListener('dragstart',clear);window.addEventListener('keydown',escape,true);window.addEventListener('resize',clear);window.addEventListener('scroll',scroll,true);
  return()=>{clear();root.removeEventListener('pointerover',enter);root.removeEventListener('pointerout',leave);root.removeEventListener('focusin',focus);root.removeEventListener('focusout',clear);root.removeEventListener('pointerdown',clear);root.removeEventListener('contextmenu',clear);root.removeEventListener('dragstart',clear);window.removeEventListener('keydown',escape,true);window.removeEventListener('resize',clear);window.removeEventListener('scroll',scroll,true);};
 },[tree,page.id,doc,blocked,resetKey]);
 useEffect(()=>{if(!preview)return;const row=preview.row,existing=row.getAttribute('aria-describedby')?.split(/\s+/).filter(Boolean)??[];row.setAttribute('aria-describedby',[...existing,tooltipId].join(' '));row.dataset.layerPreviewOwner=tooltipId;return()=>{const rest=(row.getAttribute('aria-describedby')??'').split(/\s+/).filter(id=>id&&id!==tooltipId);if(rest.length)row.setAttribute('aria-describedby',rest.join(' '));else row.removeAttribute('aria-describedby');delete row.dataset.layerPreviewOwner;};},[preview,tooltipId]);
 const art=useMemo(()=>{if(!preview)return null;try{const g=layerPreviewGeometry(index,preview.id),svg=exportSvg(g.nodes,g.viewport,false,{transform:g.transform});if(svg.length>16_000_000)throw Error('This artwork is too large for a thumbnail. Use Export.');return {src:'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)};}catch(error){return {error:error instanceof Error?error.message:'Preview is unavailable. Use Export.'};}},[index,preview]);
 const live=useEditor.getState(),target=preview&&index.byId.get(preview.id);
 if(!preview||!target||!art||blocked||live.doc!==doc||live.pageId!==page.id||live.modal||live.motionOpen||live.home||live.uiHidden)return null;
 return createPortal(<div className="page-thumbnail layer-thumbnail" id={tooltipId} role="tooltip" style={thumbnailPlacement(preview.anchor,{width:window.innerWidth,height:window.innerHeight})} data-preview-layer={target.id}><div className="page-thumbnail-caption"><strong>{target.name}</strong><span>Static layer artwork · Escape closes preview</span></div><div className="page-thumbnail-art" aria-hidden="true">{art.src?<img alt="" src={art.src}/>:<span>{art.error}</span>}</div></div>,document.body);
}
