import {t} from '../i18n';
import {additionalCommand,additionalShortcutsEnabled,getKeyboardPreferences,shortcutAria,shortcutLabel,useKeyboardPreferences} from '../keyboard-preferences';
import {usePreferences} from '../preferences';
import {useId,useLayoutEffect,useRef,useState} from 'react';
import {ChevronDown} from 'lucide-react';
import {commands,matchesShortcut,runCommand} from '../commands';
import {useEditor} from '../store';
import type {DesignDocument} from '../model';
import {TITLE_MENU_GROUPS,titleMenuPrefixMatch} from '../title-menu';
import './document-title-menu.css';

interface OpenMenu {document:DesignDocument;last:boolean;left:number;top:number;}
const groups=TITLE_MENU_GROUPS.map(ids=>ids.map(id=>commands.find(c=>c[0]===id)!)),items=groups.flat();

export default function DocumentTitleMenu({onOpen}:{onOpen:()=>void}){
 const {uiScale}=usePreferences(),keyboard=useKeyboardPreferences(commands),s=useEditor(),trigger=useRef<HTMLButtonElement>(null),host=useRef<HTMLDivElement>(null),popup=useRef<HTMLDivElement>(null),id=useId(),[opened,setOpened]=useState<OpenMenu|null>(null),prefix=useRef({text:'',time:0}),returnFromModal=useRef<{documentId:string;modal:string}|null>(null);
 const valid=!!opened&&opened.document===s.doc&&!s.modal&&!s.home&&!s.uiHidden;
 const close=(restore=false)=>{setOpened(null);prefix.current={text:'',time:0};if(restore)trigger.current?.focus();};
 const open=(last=false)=>{const current=useEditor.getState();if(current.modal||current.home||current.uiHidden)return;const box=trigger.current!.getBoundingClientRect();onOpen();prefix.current={text:'',time:0};setOpened({document:current.doc,last,left:Math.max(8,Math.min(box.left,window.innerWidth-288)),top:box.bottom+6});};
 const buttons=()=>[...(popup.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]')??[])];
 useLayoutEffect(()=>{if(!valid){if(opened)setOpened(null);return;}const list=buttons();list[opened!.last?list.length-1:0]?.focus();},[opened,valid]);
 useLayoutEffect(()=>{const pending=returnFromModal.current;if(!pending)return;if(s.doc.id!==pending.documentId||s.home){returnFromModal.current=null;return;}if(s.modal&&s.modal!==pending.modal){if(pending.modal==='snapshot'&&s.modal==='history'||pending.modal==='history'&&s.modal==='snapshot')pending.modal=s.modal;else returnFromModal.current=null;return;}if(!s.modal){returnFromModal.current=null;trigger.current?.focus();}},[s.modal,s.doc.id,s.home]);
 useLayoutEffect(()=>{if(!opened)return;const outside=(event:PointerEvent)=>{if(!host.current?.contains(event.target as Node))close();},dismiss=()=>close();window.addEventListener('pointerdown',outside,true);window.addEventListener('resize',dismiss);window.addEventListener('blur',dismiss);return()=>{window.removeEventListener('pointerdown',outside,true);window.removeEventListener('resize',dismiss);window.removeEventListener('blur',dismiss);};},[opened]);
 const invoke=(command:string,event:Event)=>{const current=useEditor.getState(),context=opened;if(!context||current.doc!==context.document||current.modal||current.home||current.uiHidden){close();return;}close();runCommand(command,event);const next=useEditor.getState();if(next.modal)returnFromModal.current={documentId:next.doc.id,modal:next.modal};else if(next.doc===context.document&&!next.home)trigger.current?.focus();};
 const tabOut=(backward:boolean)=>{const list=[...document.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,[tabindex]')].filter(el=>el.tabIndex>=0&&!el.matches(':disabled')&&!popup.current?.contains(el)&&el.getClientRects().length&&!el.closest('[inert]')),at=list.indexOf(trigger.current!);close();(list[at+(backward?-1:1)]??trigger.current)?.focus();};
 return <div className="document-title-control" ref={host} onBlur={event=>{if(opened&&!event.currentTarget.contains(event.relatedTarget as Node))close();}}>
  <button ref={trigger} className="document-title-trigger" aria-label={'Document title menu: '+s.doc.name} title={s.doc.name+' · File actions'} aria-haspopup="menu" aria-expanded={valid} aria-controls={valid?id:undefined} disabled={!!s.modal} onClick={()=>valid?close(true):open()} onDoubleClick={()=>{close();const current=useEditor.getState();if(!current.modal&&!current.home){runCommand('rename-file');returnFromModal.current={documentId:current.doc.id,modal:'rename-file'};}}} onKeyDown={event=>{if(event.metaKey||event.ctrlKey||event.altKey)return;if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();if(valid)close(true);else open();}else if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();event.stopPropagation();open(event.key==='ArrowUp');}}}><span>{s.doc.name}</span><ChevronDown size={12} aria-hidden="true"/></button>
  {valid&&<div ref={popup} id={id} className="document-title-menu" role="menu" aria-label={t('Document actions')} style={{left:Math.max(8,Math.min(opened!.left,window.innerWidth-288*uiScale-8))/uiScale,top:opened!.top/uiScale,maxHeight:Math.max(80,window.innerHeight-opened!.top-8)/uiScale}} onKeyDown={event=>{
   event.stopPropagation();const list=buttons(),active=list.indexOf(document.activeElement as HTMLButtonElement);
   if(event.key==='Escape'){event.preventDefault();close(true);return;}
   if(event.key==='Tab'){event.preventDefault();tabOut(event.shiftKey);return;}
   if(event.metaKey||event.ctrlKey){const action=commands.find(c=>matchesShortcut(event.nativeEvent,c[3]))??(additionalShortcutsEnabled(useEditor.getState())?additionalCommand(event.nativeEvent,commands,getKeyboardPreferences(commands)):undefined);if(action){event.preventDefault();if(action[2]==='File')invoke(action[0],event.nativeEvent);}return;}
   if(event.altKey||event.nativeEvent.isComposing)return;
   if(['Delete','Backspace','ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();return;}
   if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();prefix.current={text:'',time:0};const next=event.key==='Home'?0:event.key==='End'?list.length-1:(active+(event.key==='ArrowDown'?1:-1)+list.length)%list.length;list[next]?.focus();return;}
   if(event.key==='Enter'||event.key===' '){event.preventDefault();if(active>=0)invoke(items[active][0],event.nativeEvent);return;}
   if(event.key.length===1){event.preventDefault();const old=prefix.current,text=event.timeStamp-old.time>700?'':old.text,next=text+event.key,repeated=[...next].every(c=>c.toLocaleLowerCase()===next[0].toLocaleLowerCase()),query=repeated?event.key:next,index=titleMenuPrefixMatch(items.map(c=>c[1]),query,repeated?active+1:Math.max(0,active));prefix.current={text:next,time:event.timeStamp};if(index>=0)list[index]?.focus();}
  }}><div className="document-title-heading" role="presentation"><strong>{s.doc.name}</strong><small>{s.doc.workspace==='slides'?'Presentation':s.doc.workspace==='whiteboard'?'Whiteboard':'Design'} · Local .oui project</small></div>{groups.map((group,index)=><div key={index} role="group" aria-label={['File details','Save project','Local versions','Import and export','File browser'][index]}>{index>0&&<div role="separator"/>}{group.map(([command,label,,shortcut])=><button key={command} role="menuitem" aria-label={label} aria-keyshortcuts={shortcutAria([command,label,'File',shortcut],keyboard)} tabIndex={-1} onClick={event=>invoke(command,event.nativeEvent)}><span>{label}</span>{shortcutLabel([command,label,'File',shortcut],keyboard)&&<kbd aria-hidden="true">{shortcutLabel([command,label,'File',shortcut],keyboard)}</kbd>}</button>)}</div>)}</div>}
 </div>;
}
