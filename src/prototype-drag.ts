import type {PrototypeAction,PrototypeReaction,PrototypeState,PrototypeTransition} from './prototype';
import {easingValue} from './motion';

type P={x:number;y:number};
/** How a drag maps to a transition's timeline: distance along `axis`, in frame units, for the whole of it. */
export interface DragTrack {axis:P;distance:number;}
export interface DragSample {time:number;progress:number;}
/** The finger holds a transition at `progress`. On release `settle` plays what is left from there, forward to 1 or back to 0. */
export interface DragTracking {track:DragTrack;progress:number;origin:PrototypeState;settle?:{from:number;to:number;start:number;duration:number};}
export const DRAG_FLICK=.0015;
export const DRAG_FASTEST_SETTLE=80;
const directions={left:{x:-1,y:0},right:{x:1,y:0},top:{x:0,y:-1},bottom:{x:0,y:1}} as const;
const directional=(t:PrototypeTransition)=>t.type!=='dissolve'&&t.type!=='smart-animate'&&t.type!=='instant';
/** A push or move follows its own direction. Dissolve and Smart animate have none, so they follow the drag, and a layer that travels between the frames stays under the finger. */
export function dragTrack(t:PrototypeTransition,size:{width:number;height:number},drag:P,travel?:P):DragTrack{if(directional(t)){const axis=directions[t.direction];return {axis,distance:Math.max(1,axis.x?size.width:size.height)};}const length=travel?Math.hypot(travel.x,travel.y):0;if(travel&&length>=1)return {axis:{x:travel.x/length,y:travel.y/length},distance:length};return Math.abs(drag.x)>=Math.abs(drag.y)?{axis:{x:Math.sign(drag.x)||1,y:0},distance:Math.max(1,size.width)}:{axis:{x:0,y:Math.sign(drag.y)||1},distance:Math.max(1,size.height)};}
export function dragProgress(track:DragTrack,delta:P,base=0){const value=base+(delta.x*track.axis.x+delta.y*track.axis.y)/track.distance;return Math.max(0,Math.min(1,value));}
/** Progress per millisecond over the last tenth of a second, reaching one sample further back when events arrive slowly. A finger that stopped before lifting does not flick. */
export function dragVelocity(samples:readonly DragSample[],now:number){const last=samples.at(-1);if(!last||now-last.time>100)return 0;let i=samples.length-2;while(i>0&&last.time-samples[i].time<100)i--;const first=samples[i];if(!first||last.time===first.time)return 0;return (last.progress-first.progress)/(last.time-first.time);}
/** Past halfway it finishes unless flicked back; short of halfway it returns unless flicked on. A fast finger settles at its own speed. */
export function dragRelease(progress:number,velocity:number,duration:number){const commit=progress>=.5?velocity>-DRAG_FLICK:velocity>DRAG_FLICK,left=commit?1-progress:progress,speed=Math.abs(velocity),moving=commit?velocity>0:velocity<0,time=duration*left;return {commit,duration:Math.max(Math.min(DRAG_FASTEST_SETTLE,duration),moving&&speed>0?Math.min(time,left/speed):time)};}
export function settledProgress(tracking:DragTracking,now:number){const s=tracking.settle;if(!s)return tracking.progress;return s.from+(s.to-s.from)*easingValue('ease-out',s.duration>0?(now-s.start)/s.duration:1);}
export const settleDone=(tracking:DragTracking,now:number)=>!!tracking.settle&&now-tracking.settle.start>=tracking.settle.duration;
const transitionOf=(actions:readonly PrototypeAction[]):PrototypeTransition|undefined=>{for(const a of actions){if(a.transition)return a.transition;for(const b of a.branches??[]){const nested=transitionOf(b.actions);if(nested)return nested;}}return undefined;};
/** One layer can answer swipes in several directions. Only the reaction that matches the drag runs. */
export function dragReactions(reactions:readonly PrototypeReaction[],drag:P){if(reactions.length<2)return [...reactions];const scored=reactions.map(r=>{const t=transitionOf(r.actions);return {r,score:t&&directional(t)?directions[t.direction].x*drag.x+directions[t.direction].y*drag.y:undefined};}),aimed=scored.filter(s=>s.score!==undefined);if(aimed.length<2)return [...reactions];const best=aimed.reduce((a,b)=>b.score!>a.score!?b:a);return [...scored.filter(s=>s.score===undefined).map(s=>s.r),best.r];}
