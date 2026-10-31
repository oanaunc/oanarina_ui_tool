import {useEditor} from './store';
export interface CanvasCamera {zoom:number;pan:{x:number;y:number}}
export const CAMERA_SETTLE_MS=120;
const NOTCH_ZOOM=1.2,LONE_WHEEL_MS=60;
const REPAINT_MS=250;
let pending:CanvasCamera|undefined,origin:CanvasCamera|undefined,painted:CanvasCamera|undefined,canvas:HTMLElement|SVGElement|undefined,frame=0,repainted=0,timer:ReturnType<typeof setTimeout>|undefined;
/** Redrawing vector artwork is the slow part in WebKit, so most frames only scale what is already painted. */
function repaint(next:CanvasCamera){if(!canvas)return;const {zoom,pan}=next;canvas.querySelector('[data-camera]')?.setAttribute('transform',`translate(${pan.x} ${pan.y}) scale(${zoom})`);const dots=canvas.querySelector('#dots');if(dots){dots.setAttribute('width',String(zoom*16));dots.setAttribute('height',String(zoom*16));dots.setAttribute('x',String(pan.x));dots.setAttribute('y',String(pan.y));}canvas.style.transform='';painted=next;repainted=performance.now();}
function paint(){frame=0;if(!pending||!canvas||!painted)return;if(performance.now()-repainted>=REPAINT_MS){repaint(pending);return;}const scale=pending.zoom/painted.zoom,x=pending.pan.x-painted.pan.x*scale,y=pending.pan.y-painted.pan.y*scale;canvas.style.transform=`translate(${x}px,${y}px) scale(${scale})`;}
/** The camera a gesture should build on: the one on screen, which can be ahead of the store. */
export function liveCamera():CanvasCamera{return pending??useEditor.getState();}
/** Hands the gesture to the store, which re-renders once. A camera the app moved meanwhile wins. */
export function settleCamera(){if(timer!==undefined)clearTimeout(timer);timer=undefined;if(frame)cancelAnimationFrame(frame);frame=0;if(!pending)return;const next=pending,from=origin!,state=useEditor.getState();repaint(next);if(canvas){canvas.style.willChange='';canvas.style.transformOrigin='';}pending=undefined;origin=undefined;painted=undefined;if(state.zoom===from.zoom&&state.pan.x===from.pan.x&&state.pan.y===from.pan.y)state.set({zoom:next.zoom,pan:next.pan});}
/** Wheel and pinch fire many times a frame, and each store change re-renders every layer. Moving what is painted keeps the gesture at frame rate. */
export function moveCamera(target:HTMLElement|SVGElement,next:CanvasCamera){if(!origin){const {zoom,pan}=useEditor.getState();origin={zoom,pan};painted=origin;repainted=performance.now();target.style.transformOrigin='0 0';target.style.willChange='transform';}canvas=target;pending=next;if(!frame)frame=requestAnimationFrame(paint);if(timer!==undefined)clearTimeout(timer);timer=setTimeout(settleCamera,CAMERA_SETTLE_MS);}
let lastWheel=-Infinity;
/** A mouse wheel turns in notches, far coarser than a trackpad's stream of small steps, and macOS reports a slow notch as a tiny delta. A lone event therefore always moves a visible amount. */
export function wheelZoomFactor(e:Pick<WheelEvent,'deltaY'|'timeStamp'>&{wheelDeltaY?:number},sensitivity:number,invert:boolean){const direction=invert?-1:1,ticks=(e.wheelDeltaY??0)/120,lone=e.timeStamp-lastWheel>LONE_WHEEL_MS;lastWheel=e.timeStamp;if(ticks&&Number.isInteger(ticks))return NOTCH_ZOOM**(Math.max(-4,Math.min(4,ticks))*sensitivity*direction);const change=-e.deltaY*.01*sensitivity*direction;return Math.exp(lone&&change?Math.sign(change)*Math.max(Math.abs(change),Math.log(NOTCH_ZOOM)*sensitivity*.6):change);}
