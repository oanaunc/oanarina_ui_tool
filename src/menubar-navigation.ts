import type {KeyboardEvent} from 'react';
import {isRtl} from './i18n';

/** Menu bar keys follow the ARIA menu bar pattern; arrows never activate an item and modified keys stay with the app. */
export function menubarKey(e:KeyboardEvent<HTMLElement>,open:string|null,setOpen:(group:string|null)=>void){
 if(e.metaKey||e.ctrlKey||e.altKey)return;
 const target=e.target as HTMLElement,bar=e.currentTarget,triggers=[...bar.querySelectorAll<HTMLButtonElement>('[data-menu-group]')],menu=target.closest<HTMLElement>('[role=menu]'),items=[...menu?.querySelectorAll<HTMLElement>('[role^=menuitem]:not([disabled])')??[]];
 const trigger=menu?menu.closest('.menu-container')?.querySelector<HTMLButtonElement>('[data-menu-group]'):target.closest<HTMLButtonElement>('[data-menu-group]');if(!trigger)return;
 const stop=()=>{e.preventDefault();e.stopPropagation();},index=triggers.indexOf(trigger),forward=isRtl()?'ArrowLeft':'ArrowRight',back=isRtl()?'ArrowRight':'ArrowLeft';
 if(e.key===forward||e.key===back){const next=triggers[(index+(e.key===forward?1:-1)+triggers.length)%triggers.length];stop();next.focus();if(open){setOpen(next.dataset.menuGroup!);if(menu)focusMenuItem(bar,next.dataset.menuGroup!,'first');}return;}
 if(e.key==='Tab'){if(open){setOpen(null);if(menu)trigger.focus();}return;}
 if(menu){const at=items.indexOf(target),next=e.key==='ArrowDown'?items[(at+1)%items.length]:e.key==='ArrowUp'?items[(at-1+items.length)%items.length]:e.key==='Home'?items[0]:e.key==='End'?items.at(-1):undefined;if(next){stop();next.focus();}else if(e.key===' '){stop();target.click();}return;}
 if(e.key==='ArrowDown'||e.key==='ArrowUp'){stop();const edge=e.key==='ArrowDown'?'first':'last',group=trigger.dataset.menuGroup!;if(open!==group)setOpen(group);focusMenuItem(bar,group,edge);}
 else if(e.key==='Home'||e.key==='End'){stop();(e.key==='Home'?triggers[0]:triggers.at(-1))?.focus();}
}
function focusMenuItem(bar:HTMLElement,group:string,edge:'first'|'last'){requestAnimationFrame(()=>{const items=[...bar.querySelector(`[data-menu-group="${group}"]`)?.closest('.menu-container')?.querySelectorAll<HTMLElement>('[role=menu] [role^=menuitem]:not([disabled])')??[]];(edge==='first'?items[0]:items.at(-1))?.focus();});}
