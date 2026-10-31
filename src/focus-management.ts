/** Whole-application keyboard behavior that individual dialogs and panels should not have to reimplement. */
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
const MODAL='[role=dialog][aria-modal=true],[role=alertdialog][aria-modal=true]';
export function focusableWithin(root:Element){return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el=>el.tabIndex>=0&&!el.closest('[hidden],[inert]')&&(el.getClientRects().length>0||el===document.activeElement));}
/** Index to move to when Tab would leave the list, or null when normal Tab order already stays inside. */
export function trappedTabIndex(index:number,count:number,backward:boolean):number|null{if(count<1)return null;if(index<0)return backward?count-1:0;if(backward&&index===0)return count-1;if(!backward&&index===count-1)return 0;return null;}
/** Keep the keyboard in the top modal, give every modal an initial focus, and return focus to its opener. */
export function watchDialogFocus(doc:Document=document){
 const stack:{dialog:HTMLElement;opener:HTMLElement|null}[]=[];let outside:HTMLElement|null=null;
 const top=()=>stack.at(-1)?.dialog;
 const sync=()=>{
  const dialogs=[...doc.querySelectorAll<HTMLElement>(MODAL)];
  for(let i=stack.length-1;i>=0;i--){const entry=stack[i];if(dialogs.includes(entry.dialog))continue;stack.splice(i,1);const active=doc.activeElement;if((!active||active===doc.body)&&entry.opener?.isConnected)entry.opener.focus({preventScroll:true});}
  for(const dialog of dialogs){if(stack.some(entry=>entry.dialog===dialog))continue;const active=doc.activeElement as HTMLElement|null;stack.push({dialog,opener:active&&active!==doc.body&&!dialog.contains(active)?active:outside});requestAnimationFrame(()=>{if(top()!==dialog||dialog.contains(doc.activeElement))return;const first=focusableWithin(dialog)[0]??dialog;if(first===dialog&&!dialog.hasAttribute('tabindex'))dialog.tabIndex=-1;first.focus({preventScroll:true});});}
 };
 const key=(e:KeyboardEvent)=>{if(e.key!=='Tab'||e.defaultPrevented)return;const dialog=top();if(!dialog)return;const list=focusableWithin(dialog),active=doc.activeElement as HTMLElement,next=trappedTabIndex(list.indexOf(active),list.length,e.shiftKey);if(!list.length){e.preventDefault();return;}if(next!==null&&(active===list[e.shiftKey?0:list.length-1]||!dialog.contains(active))){e.preventDefault();list[next].focus();}};
 const focus=(e:FocusEvent)=>{const target=e.target as HTMLElement,dialog=top();if(target.closest(MODAL))return;if(!dialog){if(target!==doc.body)outside=target;return;}if(target.closest('[role=menu],[role=listbox],[role=tooltip]'))return;(focusableWithin(dialog)[0]??dialog).focus({preventScroll:true});};
 const observer=new MutationObserver(sync);observer.observe(doc.body,{childList:true,subtree:true});sync();doc.addEventListener('keydown',key,true);doc.addEventListener('focusin',focus);
 return()=>{observer.disconnect();doc.removeEventListener('keydown',key,true);doc.removeEventListener('focusin',focus);};
}
const REGIONS=['.menubar','#editor-sidebar-left','.canvas-wrap','.toolbar','#editor-sidebar-right'];
/** F6 and Shift+F6 cycle the visible editor regions; a dialog keeps focus until it closes. */
export function nextPanelRegion(current:number,count:number,backward:boolean){return count<1?-1:current<0?(backward?count-1:0):(current+(backward?-1:1)+count)%count;}
export function watchPanelNavigation(doc:Document=document){
 const key=(e:KeyboardEvent)=>{if(e.key!=='F6'||e.metaKey||e.ctrlKey||e.altKey||doc.querySelector(MODAL))return;const regions=REGIONS.flatMap(selector=>[...doc.querySelectorAll<HTMLElement>(selector)]).filter(el=>el.getClientRects().length>0&&!el.closest('[hidden]'));if(!regions.length)return;e.preventDefault();e.stopPropagation();const region=regions[nextPanelRegion(regions.findIndex(el=>el.contains(doc.activeElement)),regions.length,e.shiftKey)],target=region.matches('.canvas-wrap')?region.querySelector<HTMLElement>('svg[tabindex="0"]'):focusableWithin(region)[0];if(target)target.focus({preventScroll:true});else{region.tabIndex=-1;region.focus({preventScroll:true});}};
 doc.addEventListener('keydown',key,true);return()=>doc.removeEventListener('keydown',key,true);
}
