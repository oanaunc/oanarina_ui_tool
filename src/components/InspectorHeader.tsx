import {useEffect,useRef,useState} from 'react';
import {Component,Ellipsis,Link,PenTool,SwatchBook,Target} from 'lucide-react';
import {runCommand} from '../commands';
import type {DesignNode} from '../model';
import {useEditor} from '../store';
const overflow=[['rename','Rename layer…'],['duplicate','Duplicate'],['copy-properties','Copy properties'],['paste-properties','Paste properties'],['group','Group selection'],['ungroup','Ungroup selection'],['frame-selection','Frame selection'],['auto-layout','Add auto layout'],['mask','Use as mask'],['rotate-left','Rotate 90° left'],['rotate-180','Rotate 180°'],['front','Bring to front'],['back','Send to back'],['lock','Toggle lock'],['delete','Delete']] as const;
function OverflowMenu(){
 const [open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;root.current?.querySelector<HTMLButtonElement>('[role=menuitem]')?.focus();const close=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};window.addEventListener('pointerdown',close);return()=>window.removeEventListener('pointerdown',close);},[open]);
 return <div className="inspector-overflow" ref={root}><button ref={trigger} aria-label="More layer actions" aria-haspopup="menu" aria-expanded={open} title="More layer actions" onClick={()=>setOpen(!open)}><Ellipsis size={14}/></button>{open&&<div className="inspector-overflow-menu" role="menu" aria-label="Layer actions" onKeyDown={e=>{e.stopPropagation();if(e.key==='Tab')setOpen(false);if(e.key==='Escape'){e.preventDefault();setOpen(false);trigger.current?.focus();}if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role=menuitem]')],at=items.indexOf(document.activeElement as HTMLButtonElement),next=e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;items[next]?.focus();}}}>{overflow.map(([id,label])=><button role="menuitem" key={id} onClick={e=>{setOpen(false);runCommand(id,e.nativeEvent);}}>{label}</button>)}</div>}</div>;
}
/** The layer's name and quick actions. Each one is an existing command, so Undo and refusals are the commands' own. */
export default function InspectorHeader({n,sel}:{n:DesignNode;sel:DesignNode[]}){
 const s=useEditor(),instance=sel.length===1&&n.type==='instance',main=sel.length===1&&n.type==='component',text=sel.some(v=>v.type==='text'),vector=!n.booleanOp&&!n.vectorNetwork&&['rectangle','ellipse','polygon','star','path','line','arrow'].includes(n.type),editing=s.vectorEditId===n.id;
 return <div className="inspector-header"><h3 title={sel.length>1?undefined:n.name}>{sel.length>1?`${sel.length} layers selected`:n.type[0].toUpperCase()+n.type.slice(1)}</h3><div className="inspector-header-actions">
  {vector&&<button aria-label={editing?'Finish editing points':'Edit vector points'} aria-pressed={editing} title={editing?'Finish editing points':'Edit vector points'} onClick={()=>runCommand('edit-vector')}><PenTool size={13}/></button>}
  <button aria-label="Create component" title={main?'This layer is already a main component':'Create component'} disabled={main} onClick={()=>runCommand('component')}><Component size={13}/></button>
  {text&&<button aria-label="Text link" title={n.hyperlink?'Edit link':'Create link'} onClick={()=>runCommand('text-link')}><Link size={13}/></button>}
  {instance?<button aria-label="Go to main component" title="Go to main component" onClick={()=>runCommand('main-component')}><Target size={13}/></button>:<button aria-label="Local design styles" title="Local design styles" onClick={()=>runCommand('styles')}><SwatchBook size={13}/></button>}
  <OverflowMenu/>
 </div></div>;
}
