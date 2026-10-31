import {getWorkspacePreferences,subscribeWorkspacePreferences} from './workspace-preferences';

export const PROPERTY_CHANGE_ATTRIBUTE='data-property-change';
export const PROPERTY_CHANGE_LINGER_MS=800;
const surface='.right-panel,.color-picker,.color-popover',gesture='[aria-label^="Scrub "],input[type=range],input[type=color],[role=slider],.color-picker canvas,.color-picker svg';
/** Inspector value controls only: panel chrome, tabs and the canvas itself never hide selection UI. */
export function isPropertyGesture(target:EventTarget|null){const el=target instanceof Element?target:null;return !!el?.closest(surface)&&!!el.closest(gesture);}
export function isPropertyInput(target:EventTarget|null){const el=target instanceof Element?target:null;return !!el?.closest(surface)&&el.matches('input,select,textarea');}
/** Canvas selection chrome hides through one root attribute; artwork, selection state and history are untouched. */
export function watchPropertyChanges(root:HTMLElement=document.documentElement){
 let pointer:number|null=null,timer:ReturnType<typeof setTimeout>|undefined;
 const clear=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined;pointer=null;root.removeAttribute(PROPERTY_CHANGE_ATTRIBUTE);},show=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined;root.setAttribute(PROPERTY_CHANGE_ATTRIBUTE,'true');},linger=()=>{show();timer=setTimeout(clear,PROPERTY_CHANGE_LINGER_MS);};
 const enabled=()=>getWorkspacePreferences().hideCanvasUiDuringChanges;
 const down=(e:PointerEvent)=>{if(enabled()&&e.button===0&&isPropertyGesture(e.target)){pointer=e.pointerId;show();}},up=(e:PointerEvent)=>{if(pointer===e.pointerId){pointer=null;linger();}},cancel=(e:PointerEvent)=>{if(pointer===e.pointerId)clear();},input=(e:Event)=>{if(enabled()&&pointer===null&&isPropertyInput(e.target))linger();},blur=()=>clear();
 window.addEventListener('pointerdown',down,true);window.addEventListener('pointerup',up,true);window.addEventListener('pointercancel',cancel,true);window.addEventListener('input',input,true);window.addEventListener('change',input,true);window.addEventListener('blur',blur);
 const off=subscribeWorkspacePreferences(()=>{if(!enabled())clear();});
 return()=>{off();clear();window.removeEventListener('pointerdown',down,true);window.removeEventListener('pointerup',up,true);window.removeEventListener('pointercancel',cancel,true);window.removeEventListener('input',input,true);window.removeEventListener('change',input,true);window.removeEventListener('blur',blur);};
}
