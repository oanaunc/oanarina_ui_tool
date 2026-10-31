import {liveCamera,moveCamera,settleCamera} from './canvas-camera';
import {getWorkspacePreferences} from './workspace-preferences';

export const PINCH_ZOOM_LIMITS={min:.05,max:8} as const;
export interface PinchEvent {scale:number;clientX:number;clientY:number;}
/** WebKit reports a pinch as cumulative scale from gesture start. Keeps the point under the fingers fixed. */
export function pinchCamera(startZoom:number,camera:{zoom:number;pan:{x:number;y:number}},scale:number,x:number,y:number){
 if(![startZoom,scale,x,y].every(Number.isFinite)||startZoom<=0||scale<=0)return undefined;
 const zoom=Math.min(PINCH_ZOOM_LIMITS.max,Math.max(PINCH_ZOOM_LIMITS.min,startZoom*scale));
 return {zoom,pan:{x:x-(x-camera.pan.x)*zoom/camera.zoom,y:y-(y-camera.pan.y)*zoom/camera.zoom}};
}
/** The gesture's cumulative scale at the chosen speed. Exponent, so a pinch out and back still returns to where it began. */
export const pinchScale=(scale:number,speed:number)=>Number.isFinite(scale)&&scale>0?scale**speed:scale;
/** WKWebView has no ctrl-wheel pinch; it delivers Safari gesture events instead. Chromium and Electron use the wheel path. */
export function bindTrackpadPinch(target:Element){
 let start:number|undefined;
 const begin=(event:Event)=>{event.preventDefault();start=getWorkspacePreferences().pinchZoom?liveCamera().zoom:undefined;};
 const change=(event:Event)=>{event.preventDefault();if(start===undefined)return;const {scale,clientX,clientY}=event as unknown as PinchEvent,box=target.getBoundingClientRect(),next=pinchCamera(start,liveCamera(),pinchScale(scale,getWorkspacePreferences().pinchSpeed),clientX-box.left,clientY-box.top);if(next)moveCamera(target as SVGElement,next);};
 const end=(event:Event)=>{event.preventDefault();start=undefined;settleCamera();};
 target.addEventListener('gesturestart',begin);target.addEventListener('gesturechange',change);target.addEventListener('gestureend',end);
 return ()=>{target.removeEventListener('gesturestart',begin);target.removeEventListener('gesturechange',change);target.removeEventListener('gestureend',end);};
}
