import {useEffect,useRef,useState} from 'react';
import {MoreHorizontal} from 'lucide-react';
import {useEditor} from '../store';
import './page-list.css';

export default function PageList(){
 const s=useEditor(),list=useRef<HTMLDivElement>(null),popup=useRef<HTMLDivElement>(null),[focused,setFocused]=useState(s.pageId),[menu,setMenu]=useState<{id:string;x:number;y:number}|null>(null),[error,setError]=useState(''),[drag,setDrag]=useState<{id:string;docId:string}|null>(null),[drop,setDrop]=useState<{id:string;after:boolean}|null>(null);
 const tabStop=s.doc.pages.some(p=>p.id===focused)?focused:s.pageId;
 const focus=(id:string)=>{setFocused(id);requestAnimationFrame(()=>{const row=list.current?.querySelector<HTMLButtonElement>(`[data-page-id="${CSS.escape(id)}"]`);row?.focus();row?.scrollIntoView({block:'nearest'});});};
 const restore=()=>{if(!useEditor.getState().modal)focus(useEditor.getState().pageId);};
 const close=(restoreFocus=false)=>{setMenu(null);setError('');if(restoreFocus)restore();};
 const perform=(fn:()=>void)=>{try{fn();close(true);}catch(e){setError(e instanceof Error?e.message:'Page action failed.');}};
 const openMenu=(id:string,x:number,y:number)=>{if(s.modal)return;s.selectPage(id);setFocused(id);setError('');setMenu({id,x:Math.max(8,Math.min(x,window.innerWidth-230)),y:Math.max(8,Math.min(y,window.innerHeight-280))});};
 useEffect(()=>{if(!menu)return;popup.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();const outside=(e:PointerEvent)=>{if(!popup.current?.contains(e.target as Node))close();};window.addEventListener('pointerdown',outside);return()=>window.removeEventListener('pointerdown',outside);},[menu]);
 useEffect(()=>{setMenu(null);setError('');setDrag(null);setDrop(null);setFocused(s.pageId);},[s.doc.id,s.modal]);
 useEffect(()=>{if(menu&&!s.doc.pages.some(p=>p.id===menu.id))close();},[s.doc.pages,menu]);
 const move=(id:string,index:number)=>perform(()=>{s.reorderPage(id,index);focus(id);});
 return <><div className="pages-list" ref={list} role="navigation" aria-label="Pages">{s.doc.pages.map((p,index)=><div key={p.id} className={'page-list-item '+(drop?.id===p.id?(drop.after?'page-drop-after':'page-drop-before'):'')}>
  <button data-page-id={p.id} aria-label={p.name} aria-current={p.id===s.pageId?'page':undefined} tabIndex={tabStop===p.id?0:-1} className={'page-row '+(p.id===s.pageId?'active':'')} disabled={!!s.modal} title="Arrow keys select pages. Option–Shift–Up/Down moves a page. Shift–F10 opens page actions." draggable={!s.modal} onClick={()=>{s.selectPage(p.id);setFocused(p.id);}} onFocus={()=>setFocused(p.id)} onDoubleClick={()=>{s.selectPage(p.id);s.set({modal:'rename-page'});}} onContextMenu={e=>{e.preventDefault();e.stopPropagation();openMenu(p.id,e.clientX,e.clientY);}} onKeyDown={e=>{
   if(s.modal||e.target!==e.currentTarget)return;
   if(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey){e.preventDefault();e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();openMenu(p.id,r.left+24,r.bottom);return;}
   if(e.altKey&&e.shiftKey&&(e.key==='ArrowUp'||e.key==='ArrowDown')){e.preventDefault();e.stopPropagation();const next=index+(e.key==='ArrowUp'?-1:1);if(next>=0&&next<s.doc.pages.length)move(p.id,next);return;}
   if(e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;
   const next=e.key==='ArrowDown'?Math.min(s.doc.pages.length-1,index+1):e.key==='ArrowUp'?Math.max(0,index-1):e.key==='Home'?0:e.key==='End'?s.doc.pages.length-1:-1;
   if(next>=0){e.preventDefault();e.stopPropagation();s.selectPage(s.doc.pages[next].id);focus(s.doc.pages[next].id);}
  }} onDragStart={e=>{setDrag({id:p.id,docId:s.doc.id});e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('application/x-forma-page',p.id);close();}} onDragEnd={()=>{setDrag(null);setDrop(null);}} onDragOver={e=>{if(!drag||drag.docId!==s.doc.id)return;e.preventDefault();e.stopPropagation();setDrop({id:p.id,after:e.clientY>e.currentTarget.getBoundingClientRect().top+e.currentTarget.clientHeight/2});e.dataTransfer.dropEffect='move';}} onDrop={e=>{if(!drag||drag.docId!==s.doc.id)return;e.preventDefault();e.stopPropagation();const from=s.doc.pages.findIndex(p=>p.id===drag.id),after=e.clientY>e.currentTarget.getBoundingClientRect().top+e.currentTarget.clientHeight/2,position=index+(after?1:0)-(from<index+(after?1:0)?1:0);if(from>=0)move(drag.id,position);setDrag(null);setDrop(null);}}><span aria-hidden="true">{p.id===s.pageId?'✓':' '}</span><span className="page-name">{p.name}</span></button>
  <button className="page-actions-button" tabIndex={tabStop===p.id?0:-1} aria-label={'Page actions for '+p.name} aria-haspopup="menu" aria-expanded={menu?.id===p.id} disabled={!!s.modal} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();openMenu(p.id,r.left,r.bottom);}}><MoreHorizontal size={13}/></button>
 </div>)}</div>{menu&&<div ref={popup} className="page-context-menu" role="menu" aria-label="Page actions" style={{left:menu.x,top:menu.y}} onKeyDown={e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close(true);}else if(e.key==='Tab')close();else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const buttons=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')],at=buttons.indexOf(document.activeElement as HTMLButtonElement),next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(at+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next]?.focus();}}}>
  <button role="menuitem" onClick={()=>perform(()=>{s.selectPage(menu.id);s.set({modal:'rename-page'});})}>Rename page…</button>
  <button role="menuitem" onClick={()=>perform(()=>s.duplicatePage(menu.id))}>Duplicate page</button>
  <button role="menuitem" disabled={s.doc.pages[0].id===menu.id} onClick={()=>move(menu.id,s.doc.pages.findIndex(p=>p.id===menu.id)-1)}>Move page up</button>
  <button role="menuitem" disabled={s.doc.pages.at(-1)?.id===menu.id} onClick={()=>move(menu.id,s.doc.pages.findIndex(p=>p.id===menu.id)+1)}>Move page down</button>
  <button role="menuitem" disabled={s.doc.pages.length<=1} onClick={()=>perform(()=>s.deletePage(menu.id))}>Delete page</button>
  <button role="menuitem" onClick={()=>close(true)}>Close page menu</button>{error&&<p role="alert">{error}</p>}
 </div>}</>;
}
