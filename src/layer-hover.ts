import {useSyncExternalStore} from 'react';
let hovered:string|undefined;
const listeners=new Set<()=>void>(),subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};},snapshot=()=>hovered,publish=(id:string|undefined)=>{if(id===hovered)return;hovered=id;for(const listener of [...listeners])listener();};
export const useLayerHover=()=>useSyncExternalStore(subscribe,snapshot);
/** The row under the pointer names the layer the canvas outlines, so a click's target is visible before it lands. */
export function bindLayerHover(root:HTMLElement){
 const over=(e:PointerEvent)=>publish(e.target instanceof Element?e.target.closest<HTMLElement>('[data-layer-id]')?.dataset.layerId:undefined),leave=()=>publish(undefined);
 root.addEventListener('pointerover',over);root.addEventListener('pointerleave',leave);
 return()=>{publish(undefined);root.removeEventListener('pointerover',over);root.removeEventListener('pointerleave',leave);};
}
