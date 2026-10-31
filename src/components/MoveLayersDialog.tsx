import {t} from '../i18n';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useEditor} from '../store';
import {moveDocumentLayers} from '../move-layers';
import './move-layers.css';

export default function MoveLayersDialog(){
 const s=useEditor(),[origin]=useState(()=>({document:s.doc,pageId:s.pageId,ids:[...s.selection]})),[query,setQuery]=useState(''),[destination,setDestination]=useState(()=>s.doc.pages.find(p=>p.id!==s.pageId)?.id??''),[error,setError]=useState(''),dialog=useRef<HTMLElement>(null);
 const candidates=s.doc.pages.filter(p=>p.id!==origin.pageId),visible=candidates.filter(p=>p.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),stale=s.doc!==origin.document||s.pageId!==origin.pageId||JSON.stringify(s.selection)!==JSON.stringify(origin.ids);
 const review=useMemo(()=>{if(stale)return {error:'The project or selection changed. Close this dialog and select the layers again.'};try{return {result:moveDocumentLayers(origin.document,{sourcePageId:origin.pageId,destinationPageId:destination,nodeIds:origin.ids})};}catch(e){return {error:e instanceof Error?e.message:'This move is unavailable.'};}},[origin,destination,stale]);
 const close=()=>{useEditor.getState().set({modal:null});requestAnimationFrame(()=>{const current=useEditor.getState();if(current.doc.id===origin.document.id&&current.pageId===origin.pageId)[...document.querySelectorAll<HTMLElement>('[data-layer-id]')].find(el=>el.dataset.layerId===origin.ids.at(-1))?.focus();});};
 useEffect(()=>{dialog.current?.querySelector<HTMLInputElement>('input')?.focus();},[]);
 const choose=(id:string)=>{setDestination(id);setError('');};
 return <div className="modal-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}><section ref={dialog} className="dialog move-layers-dialog" role="dialog" aria-modal="true" aria-label={t('Move layers to page')} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const controls=[...e.currentTarget.querySelectorAll<HTMLElement>('input,button:not(:disabled)')];if(e.shiftKey&&document.activeElement===controls[0]){e.preventDefault();controls.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===controls.at(-1)){e.preventDefault();controls[0]?.focus();}}}}>
  <header className="dialog-header"><h2>{t('Move layers to page')}</h2><button aria-label={t('Close move dialog')} onClick={close}>×</button></header>
  <div className="dialog-body"><p>{t('Keep editable layers and their IDs. Place the selected objects at the same world coordinates on another page.')}</p>
   <label>{t('Find destination page')}<input type="search" aria-label={t('Find destination page')} value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <div className="move-page-options" role="radiogroup" aria-label={t('Destination page')}>{visible.map((p,index)=><button key={p.id} role="radio" aria-checked={p.id===destination} tabIndex={p.id===destination||!visible.some(p=>p.id===destination)&&index===0?0:-1} onClick={()=>choose(p.id)} onKeyDown={e=>{if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?visible.length-1:(index+(e.key==='ArrowDown'?1:-1)+visible.length)%visible.length;choose(visible[next].id);(e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();}}}>{p.name}<span>{t('{count} layers',{count:p.nodes.length})}{p.id===destination?' · '+t('Selected'):''}</span></button>)}</div>
   {!visible.length&&<p role="status">{t('No destination pages match.')} <button onClick={()=>setQuery('')}>{t('Clear destination search')}</button></p>}
   {review.result&&<p role="status">Move {review.result.nodeIds.length} layers ({review.result.rootIds.length} objects) to <strong>{candidates.find(p=>p.id===destination)?.name}</strong>. {review.result.flowCount} flows and {review.result.trackCount} animation tracks move with them.</p>}
   <p className="move-page-note">{t('Page comments, canvas guides, backgrounds and prototype display settings stay on their page. Complete connected whiteboard objects are required. Presentation deck pages and unsupported inherited context are refused.')}</p>
   {(error||review.error)&&<p role="alert">{error||review.error}</p>}
  </div><footer className="move-page-footer"><button onClick={close}>{t('Cancel move')}</button><button disabled={!review.result||stale} onClick={()=>{try{const current=useEditor.getState();if(current.doc!==origin.document||current.pageId!==origin.pageId||JSON.stringify(current.selection)!==JSON.stringify(origin.ids))throw Error('The project or selection changed. Close this dialog and try again.');current.moveSelectionToPage(destination);requestAnimationFrame(()=>document.querySelector<SVGElement>('svg.canvas')?.focus());}catch(e){setError(e instanceof Error?e.message:'The move failed.');}}}>{t('Move layers')}</button></footer>
 </section></div>;
}
