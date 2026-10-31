import {easingValue} from './motion';
import type {Easing} from './motion';
type Scroller=Pick<HTMLElement,'scrollLeft'|'scrollTop'|'addEventListener'|'removeEventListener'>;
export interface ScrollClock {request:(step:()=>void)=>number;cancel:(id:number)=>void;now:()=>number;}
const browserClock=():ScrollClock=>({request:step=>requestAnimationFrame(step),cancel:id=>cancelAnimationFrame(id),now:()=>performance.now()});
const interrupting=['wheel','touchstart','pointerdown'] as const;
/** Honors the authored duration and easing, which native smooth scrolling cannot. The viewer's own scrolling interrupts it, and the returned function cancels it. */
export function animateScroll(el:Scroller,to:{x:number;y:number},transition:{duration:number;easing:Easing},clock:ScrollClock=browserClock()){const from={x:el.scrollLeft,y:el.scrollTop},start=clock.now();let frame=0,active=true;const stop=()=>{if(!active)return;active=false;clock.cancel(frame);for(const type of interrupting)el.removeEventListener(type,stop);},step=()=>{if(!active)return;const t=transition.duration>0?Math.min(1,(clock.now()-start)/transition.duration):1,k=t===1?1:easingValue(transition.easing,t);el.scrollLeft=from.x+(to.x-from.x)*k;el.scrollTop=from.y+(to.y-from.y)*k;if(t<1)frame=clock.request(step);else stop();};for(const type of interrupting)el.addEventListener(type,stop,{passive:true});frame=clock.request(step);return stop;}
