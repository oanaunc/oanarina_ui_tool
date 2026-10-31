import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {useEditor} from '../store';
import {applyDocumentLanguage,watchLanguage} from '../i18n';
import {watchInterfaceAccessibility} from '../interface-accessibility';
import {watchDialogFocus,watchPanelNavigation} from '../focus-management';
import {subscribeErrorAnnouncements} from '../error-announcements';
import './interface-accessibility.css';

interface Tip{text:string;x:number;y:number;below:boolean;id:string}
const TIP_ID='forma-focus-tooltip';
/** Native title tooltips never appear for keyboard users. Show the same text on keyboard focus, as a description. */
function FocusTooltip(){
 const [tip,setTip]=useState<Tip|null>(null),owner=useRef<HTMLElement|null>(null),previous=useRef<string|null>(null);
 useEffect(()=>{
  const clear=()=>{const el=owner.current;if(el){if(previous.current===null)el.removeAttribute('aria-describedby');else el.setAttribute('aria-describedby',previous.current);}owner.current=null;setTip(null);};
  const focus=(e:FocusEvent)=>{clear();const el=e.target as HTMLElement;if(!el?.matches?.('[title]:focus-visible'))return;const text=el.title.trim();if(!text||el.closest('[role=tooltip]'))return;const box=el.getBoundingClientRect(),below=box.top<60;owner.current=el;previous.current=el.getAttribute('aria-describedby');if(text!==el.getAttribute('aria-label')&&text!==el.textContent?.trim())el.setAttribute('aria-describedby',[previous.current,TIP_ID].filter(Boolean).join(' '));setTip({text,x:Math.round(box.left+box.width/2),y:Math.round(below?box.bottom+6:box.top-6),below,id:TIP_ID});};
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&owner.current){e.stopImmediatePropagation();e.preventDefault();clear();}};
  document.addEventListener('focusin',focus);document.addEventListener('focusout',clear);document.addEventListener('keydown',key,true);window.addEventListener('scroll',clear,true);
  return()=>{clear();document.removeEventListener('focusin',focus);document.removeEventListener('focusout',clear);document.removeEventListener('keydown',key,true);window.removeEventListener('scroll',clear,true);};
 },[]);
 return tip?<div id={tip.id} role="tooltip" className={'focus-tooltip'+(tip.below?' focus-tooltip-below':'')} style={{left:tip.x,top:tip.y}}>{tip.text}</div>:null;
}
/** Errors interrupt politely-worded status toasts: they go to one assertive region, deduplicated by a counter suffix-free reset. */
function ErrorAnnouncer(){const [message,setMessage]=useState('');useEffect(()=>subscribeErrorAnnouncements(text=>{setMessage('');requestAnimationFrame(()=>setMessage(text));}),[]);return <div className="visually-hidden" role="alert" aria-atomic="true">{message}</div>;}
/** Mount once at the app root. Owns the root language/contrast attributes and app-wide keyboard behavior. */
export default function InterfaceAccessibility(){
 useLayoutEffect(()=>watchLanguage(language=>applyDocumentLanguage(language)),[]);
 useLayoutEffect(()=>watchInterfaceAccessibility(),[]);
 useEffect(()=>{const offDialogs=watchDialogFocus(),offPanels=watchPanelNavigation();return()=>{offDialogs();offPanels();};},[]);
 useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key!=='Escape'||e.defaultPrevented)return;const dialogs=document.querySelectorAll<HTMLElement>('[role=dialog][aria-modal=true]'),dialog=dialogs[dialogs.length-1];if(!dialog)return;const close=dialog.querySelector<HTMLElement>('.dialog-header button');if(close){e.preventDefault();close.click();}else if(useEditor.getState().modal){e.preventDefault();useEditor.getState().set({modal:null});}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[]);
 return <><FocusTooltip/><ErrorAnnouncer/></>;
}
