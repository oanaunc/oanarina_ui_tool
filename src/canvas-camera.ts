import {useEditor} from './store';
export interface CanvasCamera {zoom:number;pan:{x:number;y:number}}
export const CAMERA_SETTLE_MS=120;
const NOTCH_ZOOM=1.2,LONE_WHEEL_MS=60;
/** A wheel moves in separate notches, so each one glides for a moment. A trackpad is already a smooth stream. */
const GLIDE_MS=45,GLIDE_SETTLE_MS=260,GLIDE_FRAME_MS=50;
/** Cheap artwork redraws every frame, which is what looks right. Slow artwork moves as one retained layer on the compositor: the canvas paints past its edges, so a pan repaints nothing, and a zoom shows a scaled copy that refreshes only once it has drifted far enough to look soft. */
const SLOW_REPAINT_MS=40,REPAINT_MS=250,SOFT_SCALE=2,SLOW_SETTLE_MS=320,FILTER_MS=.6,TEXT_MS=.07;
let pending:CanvasCamera|undefined,origin:CanvasCamera|undefined,painted:CanvasCamera|undefined,shown:CanvasCamera|undefined,canvas:HTMLElement|SVGElement|undefined,frame=0,repainted=0,lastFrame=0,repaintCost=0,costPage='',gliding=false,timer:ReturnType<typeof setTimeout>|undefined;
/** Things that sit over the canvas and must stay on it while a gesture bypasses the store. */
export const cameraWatchers=new Set<(camera:CanvasCamera)=>void>();
function repaint(next:CanvasCamera){if(!canvas)return;const {zoom,pan}=next;for(const watch of cameraWatchers)watch(next);canvas.querySelector('[data-camera]')?.setAttribute('transform',`translate(${pan.x} ${pan.y}) scale(${zoom})`);const dots=canvas.querySelector('#dots');if(dots){dots.setAttribute('width',String(zoom*16));dots.setAttribute('height',String(zoom*16));dots.setAttribute('x',String(pan.x));dots.setAttribute('y',String(pan.y));}canvas.style.transform='';painted=next;repainted=performance.now();}
/** A step from one camera toward another that holds still the one point both agree on, which is the point a wheel zooms around. */
export function glideCamera(from:CanvasCamera,to:CanvasCamera,t:number):CanvasCamera{const zoom=from.zoom*(to.zoom/from.zoom)**t,dx=from.zoom-to.zoom;if(Math.abs(dx)<1e-9)return {zoom,pan:{x:from.pan.x+(to.pan.x-from.pan.x)*t,y:from.pan.y+(to.pan.y-from.pan.y)*t}};const axis=(a:number,b:number)=>{const world=(b-a)/dx;return a+world*(from.zoom-zoom);};return {zoom,pan:{x:axis(from.pan.x,to.pan.x),y:axis(from.pan.y,to.pan.y)}};}
const arrived=(a:CanvasCamera,b:CanvasCamera)=>Math.abs(a.zoom/b.zoom-1)<1e-3&&Math.hypot(a.pan.x-b.pan.x,a.pan.y-b.pan.y)<.25;
const appMoved=(from:CanvasCamera)=>{const {zoom,pan}=useEditor.getState();return zoom!==from.zoom||pan.x!==from.pan.x||pan.y!==from.pan.y;};
/** What one redraw of this canvas will cost, before any frame has shown it: a transform on an SVG group re-runs every filter and lays out every text again. */
const estimatedCost=(target:HTMLElement|SVGElement)=>target.querySelectorAll?target.querySelectorAll('[filter]').length*FILTER_MS+target.querySelectorAll('text').length*TEXT_MS:0;
const slow=()=>repaintCost>=SLOW_REPAINT_MS;
function paint(now:number){frame=0;if(!pending||!canvas||!painted||!shown)return;if(appMoved(origin!)){settleCamera();return;}const elapsed=Math.min(now-lastFrame,GLIDE_FRAME_MS);lastFrame=now;shown=gliding&&!arrived(shown,pending)?glideCamera(shown,pending,1-Math.exp(-elapsed/GLIDE_MS)):pending;if(shown!==pending)frame=requestAnimationFrame(paint);
 const scale=shown.zoom/painted.zoom;if(!slow()||Math.max(scale,1/scale)>=SOFT_SCALE&&performance.now()-repainted>=Math.max(REPAINT_MS,repaintCost*5)){repaint(shown);requestAnimationFrame(next=>{const cost=next-now;if(cost<1000)repaintCost=repaintCost?repaintCost*.6+cost*.4:cost;});return;}
 for(const watch of cameraWatchers)watch(shown);const x=shown.pan.x-painted.pan.x*scale,y=shown.pan.y-painted.pan.y*scale;canvas.style.transform=`translate(${x}px,${y}px) scale(${scale})`;}
/** The camera a gesture should build on: where it is heading, which can be ahead of the screen and of the store. */
export function liveCamera():CanvasCamera{return pending??useEditor.getState();}
export const cameraMoving=()=>pending!==undefined;
/** Hands the gesture to the store, which re-renders once. A camera the app moved meanwhile wins. */
export function settleCamera(){if(timer!==undefined)clearTimeout(timer);timer=undefined;if(frame)cancelAnimationFrame(frame);frame=0;if(!pending)return;const next=pending,from=origin!,state=useEditor.getState(),moved=appMoved(from);repaint(moved?{zoom:state.zoom,pan:state.pan}:next);pending=undefined;origin=undefined;painted=undefined;shown=undefined;gliding=false;if(!moved)state.set({zoom:next.zoom,pan:next.pan});}
/** Wheel and pinch fire many times a frame, and each store change re-renders every layer, so a gesture moves only the camera. The canvas keeps its own compositor layer in CSS: making one per gesture flashes the whole canvas. */
export function moveCamera(target:HTMLElement|SVGElement,next:CanvasCamera,glide=false){if(!origin){const {zoom,pan,doc,pageId}=useEditor.getState(),page=doc.id+'\0'+pageId;/* A cost measured on one page says nothing about the next. */if(page!==costPage){costPage=page;repaintCost=0;}repaintCost=Math.max(repaintCost,estimatedCost(target));origin={zoom,pan};painted=origin;shown=origin;repainted=performance.now();lastFrame=repainted;}canvas=target;pending=next;gliding=glide;if(!frame)frame=requestAnimationFrame(paint);if(timer!==undefined)clearTimeout(timer);timer=setTimeout(settleCamera,slow()?SLOW_SETTLE_MS:glide?GLIDE_SETTLE_MS:CAMERA_SETTLE_MS);}
let lastWheel=-Infinity,lastGlideCheck=-Infinity;
const wholeNotch=(e:{deltaY:number;wheelDeltaY?:number})=>{const ticks=(e.wheelDeltaY??0)/120;return !!ticks&&Number.isInteger(ticks)&&e.wheelDeltaY===-3*e.deltaY;};
/** Whether this wheel event is a separate step: a whole notch, or anything arriving on its own rather than in a stream. */
export function wheelGlides(e:Pick<WheelEvent,'deltaY'|'timeStamp'>&{wheelDeltaY?:number}){const lone=e.timeStamp-lastGlideCheck>LONE_WHEEL_MS;lastGlideCheck=e.timeStamp;return lone||wholeNotch(e);}
/** A mouse wheel turns in notches, far coarser than a trackpad's stream of small steps, and macOS reports a slow notch as a tiny delta. A lone event therefore always moves a visible amount. */
export function wheelZoomFactor(e:Pick<WheelEvent,'deltaY'|'timeStamp'>&{wheelDeltaY?:number},sensitivity:number,invert:boolean){const direction=invert?-1:1,ticks=(e.wheelDeltaY??0)/120,lone=e.timeStamp-lastWheel>LONE_WHEEL_MS;lastWheel=e.timeStamp;if(wholeNotch(e))return NOTCH_ZOOM**(Math.max(-4,Math.min(4,ticks))*sensitivity*direction);const change=-e.deltaY*.01*sensitivity*direction;return Math.exp(lone&&change?Math.sign(change)*Math.max(Math.abs(change),Math.log(NOTCH_ZOOM)*sensitivity*.6):change);}
