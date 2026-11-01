import type {DesignDocument,DesignNode} from './model';
import {descendants} from './model';
import {visualBounds} from './transforms';
import {executeActions,keyMatches,prototypeDocument,reactionsFor} from './prototype';
import type {PrototypeAction,PrototypeReaction,PrototypeState,PrototypeTransition,PrototypeTrigger} from './prototype';
import {interactiveActionResolver} from './interactive-variants';
/** The reaction engine behind a prototype embedded on a slide. It owns no React state, so the triggers can be tested without a renderer. */
export interface SlidePlayerStep {state:PrototypeState;transition?:PrototypeTransition;links:string[];scrollTo?:string;}
interface Temporary {kind:'hover'|'press';nodeId:string;actions:PrototypeAction[];}
const clone=<T,>(v:T):T=>structuredClone(v);
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
import {dragReactions} from './prototype-drag';
export const DRAG_THRESHOLD=4;
export class SlidePlayerEngine {
 private temporary:Temporary[]=[];private base:PrototypeState|null=null;
 constructor(private document:DesignDocument,private pageId:string){}
 private page(state:PrototypeState){return prototypeDocument(this.document,state).pages.find(p=>p.id===this.pageId)!;}
 private actionsFor(state:PrototypeState,id:string,types:readonly PrototypeTrigger[]){const live=prototypeDocument(this.document,state),n=live.pages.find(p=>p.id===this.pageId)?.nodes.find(n=>n.id===id),reactions=n?reactionsFor(n).filter(r=>r.enabled&&types.includes(r.trigger)):[];if(!n||!reactions.length)return [];const bind=interactiveActionResolver(live,this.pageId);return reactions.flatMap(r=>bind(n.id,r.actions,r.id));}
 handles(state:PrototypeState,id:string,types:readonly PrototypeTrigger[]){const n=this.page(state).nodes.find(n=>n.id===id);return !!n&&reactionsFor(n).some(r=>r.enabled&&types.includes(r.trigger));}
 private run(state:PrototypeState,actions:PrototypeAction[],transient=false):SlidePlayerStep{const result=executeActions(this.document,this.pageId,state,actions);if(!transient&&this.temporary.length){if(state.frameId!==result.state.frameId||!same(state.overlays,result.state.overlays)){this.temporary=[];this.base=null;}else if(this.base)this.base={...this.base,values:{...this.base.values,...result.state.values},variants:{...this.base.variants,...result.state.variants}};}return {state:result.state,transition:result.transition,links:result.effects.flatMap(e=>e.type==='open-link'&&e.url?[e.url]:[]),scrollTo:result.effects.find(e=>e.type==='scroll-to')?.targetId};}
 /** Persistent triggers: click, drag, mouse enter, leave, down and up, and scroll. */
 fire(state:PrototypeState,id:string,type:PrototypeTrigger){const actions=this.actionsFor(state,id,[type]);return actions.length?this.run(state,actions):undefined;}
 /** A drag runs only the reaction aimed along it when a layer answers swipes in several directions. */
 fireDrag(state:PrototypeState,id:string,delta:{x:number;y:number}){const live=prototypeDocument(this.document,state),n=live.pages.find(p=>p.id===this.pageId)?.nodes.find(n=>n.id===id),reactions=n?dragReactions(reactionsFor(n).filter(r=>r.enabled&&r.trigger==='drag'),delta):[];if(!n||!reactions.length)return undefined;const bind=interactiveActionResolver(live,this.pageId);return this.run(state,reactions.flatMap(r=>bind(n.id,r.actions,r.id)));}
 /** While hovering and while pressing last only as long as the pointer stays. */
 begin(state:PrototypeState,id:string,kind:'hover'|'press'){if(this.temporary.some(t=>t.kind===kind&&t.nodeId===id))return undefined;const actions=this.actionsFor(state,id,[kind]);if(!actions.length)return undefined;if(!this.temporary.length)this.base=clone(state);this.temporary.push({kind,nodeId:id,actions:clone(actions)});return this.run(state,actions,true);}
 restore(kind:'hover'|'press',id?:string):SlidePlayerStep|undefined{const remaining=this.temporary.filter(t=>!(t.kind===kind&&(!id||t.nodeId===id)));if(remaining.length===this.temporary.length||!this.base)return undefined;let state=clone(this.base);for(const entry of remaining)state=executeActions(this.document,this.pageId,state,entry.actions).state;this.temporary=remaining;if(!remaining.length)this.base=null;return {state,links:[]};}
 /** Every active layer's reactions of one trigger, with the owner kept so delayed work can recheck it. */
 reactions(state:PrototypeState,type:PrototypeTrigger){const page=this.page(state),root=state.overlays.at(-1)?.frameId??state.frameId,ids=new Set(descendants(page.nodes,[root]));return page.nodes.filter(n=>ids.has(n.id)&&n.visible).flatMap(n=>reactionsFor(n).filter(r=>r.enabled&&r.trigger===type).map(reaction=>({nodeId:n.id,reaction})));}
 delayed(state:PrototypeState,nodeId:string,reaction:PrototypeReaction){const live=prototypeDocument(this.document,state),current=live.pages.find(p=>p.id===this.pageId)?.nodes.find(n=>n.id===nodeId)?.reactions?.find(r=>r.id===reaction.id&&r.enabled&&r.trigger==='delay');if(!current)return undefined;const bind=interactiveActionResolver(live,this.pageId);return this.run(state,bind(nodeId,current.actions,current.id));}
 gamepad(state:PrototypeState,button:number){const matching=this.reactions(state,'gamepad').filter(({reaction})=>reaction.gamepadButton===button);if(!matching.length)return undefined;const bind=interactiveActionResolver(prototypeDocument(this.document,state),this.pageId);return this.run(state,matching.flatMap(({nodeId,reaction})=>bind(nodeId,reaction.actions,reaction.id)));}
 /** Undefined when nothing on the visible frame answers this key, so the presenter's own keys keep working. */
 key(state:PrototypeState,event:Pick<KeyboardEvent,'key'|'metaKey'|'ctrlKey'|'altKey'|'shiftKey'>){const matching=this.reactions(state,'key').filter(({reaction})=>keyMatches(reaction,event));if(!matching.length)return undefined;const bind=interactiveActionResolver(prototypeDocument(this.document,state),this.pageId);return this.run(state,matching.flatMap(({nodeId,reaction})=>bind(nodeId,reaction.actions,reaction.id)));}
}
/** How far a scrolling frame can move, from its contents' bounds. */
export function slideScrollExtent(nodes:readonly DesignNode[],frame:DesignNode){const ids=new Set(descendants(nodes as DesignNode[],[frame.id])),b=visualBounds(nodes.filter(n=>ids.has(n.id)).map(n=>n.id===frame.id?{...n,clip:false}:n)),allowed=frame.prototypeScroll??'none';return {x:['horizontal','both'].includes(allowed)?Math.max(0,b.x+b.width-frame.x-frame.width):0,y:['vertical','both'].includes(allowed)?Math.max(0,b.y+b.height-frame.y-frame.height):0};}
export function clampSlideScroll(offset:{x:number;y:number},extent:{x:number;y:number}){return {x:Math.max(0,Math.min(extent.x,offset.x)),y:Math.max(0,Math.min(extent.y,offset.y))};}
/** Frame-to-frame motion in SVG terms. The player morphs Smart animate through the shared interpolation and uses the dissolve here only when a frame refuses it. */
export function slideTransitionStyle(t:PrototypeTransition,progress:number,width:number,height:number,leaving:boolean){const p=Math.max(0,Math.min(1,progress)),v={x:t.direction==='left'?width:t.direction==='right'?-width:0,y:t.direction==='top'?height:t.direction==='bottom'?-height:0};if(t.type==='dissolve'||t.type==='smart-animate')return {opacity:leaving?1-p:p,x:0,y:0};const moving=leaving?['move-out','push','slide-out'].includes(t.type):['move-in','push','slide-in'].includes(t.type);return moving?{opacity:1,x:leaving?-v.x*p:v.x*(1-p),y:leaving?-v.y*p:v.y*(1-p)}:{opacity:1,x:0,y:0};}
