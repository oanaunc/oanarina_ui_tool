import type {DesignNode} from './model';
import {defaultOverlay,defaultTransition} from './prototype';
import type {PrototypeAction,PrototypeReaction,PrototypeTransition} from './prototype';
import type {Easing} from './motion';
type Raw=Record<string,unknown>;
const record=(v:unknown):Raw=>v&&typeof v==='object'&&!Array.isArray(v)?v as Raw:{};
const items=(v:unknown,max=100):Raw[]=>Array.isArray(v)?v.slice(0,max).map(record):[];
const finite=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1e6?v:fallback;
/** The public API names auto layout differently from the binary format. One translation keeps a single layout mapping. */
export function figRestLayoutFields(raw:Raw):Raw{return {stackMode:raw.layoutMode,stackSpacing:raw.itemSpacing,stackCounterSpacing:raw.counterAxisSpacing,stackHorizontalPadding:raw.paddingLeft,stackVerticalPadding:raw.paddingTop,stackPaddingRight:raw.paddingRight,stackPaddingBottom:raw.paddingBottom,stackPrimarySizing:raw.primaryAxisSizingMode==='FIXED'?'FIXED':'RESIZE_TO_FIT',stackCounterSizing:raw.counterAxisSizingMode==='FIXED'?'FIXED':'RESIZE_TO_FIT',stackPrimaryAlignItems:raw.primaryAxisAlignItems,stackCounterAlignItems:raw.counterAxisAlignItems,stackWrap:raw.layoutWrap,stackCounterAlignContent:raw.counterAxisAlignContent,stackReverseZIndex:raw.itemReverseZIndex,bordersTakeSpace:raw.strokesIncludedInLayout,stackPositioning:raw.layoutPositioning,stackChildPrimaryGrow:raw.layoutGrow,stackChildAlignSelf:raw.layoutAlign==='STRETCH'?'STRETCH':undefined,minSize:raw.minWidth!==undefined||raw.minHeight!==undefined?{x:raw.minWidth,y:raw.minHeight}:undefined,maxSize:raw.maxWidth!==undefined||raw.maxHeight!==undefined?{x:raw.maxWidth,y:raw.maxHeight}:undefined};}
export function figRestConstraints(raw:Raw):Partial<DesignNode>{const c=record(raw.constraints),x=({LEFT:'start',RIGHT:'end',CENTER:'center',LEFT_RIGHT:'stretch',SCALE:'scale'} as const)[String(c.horizontal) as 'LEFT'],y=({TOP:'start',BOTTOM:'end',CENTER:'center',TOP_BOTTOM:'stretch',SCALE:'scale'} as const)[String(c.vertical) as 'TOP'];return {...(x?{constraintX:x}:{}),...(y?{constraintY:y}:{})};}
export interface FigRestContext {target:(id:string)=>DesignNode|undefined;main:(id:string)=>string|undefined;issue:(code:string,message:string)=>void;}
const triggers:Record<string,PrototypeReaction['trigger']>={ON_CLICK:'click',ON_HOVER:'hover',ON_PRESS:'press',ON_DRAG:'drag',AFTER_TIMEOUT:'delay',MOUSE_ENTER:'mouseenter',MOUSE_LEAVE:'mouseleave',MOUSE_DOWN:'mousedown',MOUSE_UP:'mouseup'};
const easings:Record<string,Easing>={LINEAR:'linear',EASE_IN:'ease-in',EASE_OUT:'ease-out',EASE_IN_AND_OUT:'ease-in-out',GENTLE:'spring',QUICK:'spring',BOUNCY:'spring',SLOW:'spring',CUSTOM_SPRING:'spring'};
const kinds:Record<string,PrototypeTransition['type']>={DISSOLVE:'dissolve',SMART_ANIMATE:'smart-animate',SCROLL_ANIMATE:'smart-animate',MOVE_IN:'move-in',MOVE_OUT:'move-out',PUSH:'push',SLIDE_IN:'slide-in',SLIDE_OUT:'slide-out'};
function transition(raw:unknown):PrototypeTransition{const t=record(raw),out=defaultTransition();out.type=kinds[String(t.type)]??'instant';out.duration=Math.max(0,Math.min(10000,finite(t.duration,.3)*1000));const way=String(t.direction).toLowerCase();if(['left','right','top','bottom'].includes(way))out.direction=way as 'left';const easing=easings[String(record(t.easing).type)];if(easing)out.easing=easing;return out;}
function action(raw:Raw,ctx:FigRestContext):PrototypeAction|undefined{const id=crypto.randomUUID();
 if(raw.type==='BACK')return {id,type:'back'};if(raw.type==='CLOSE')return {id,type:'close-overlay'};
 if(raw.type==='URL'){const url=typeof raw.url==='string'?raw.url:'';if(/^https?:\/\/[^\s]+$/i.test(url)&&url.length<=2048)return {id,type:'open-link',url};ctx.issue('prototype','A prototype link that is not http or https was omitted.');return;}
 if(raw.type!=='NODE'){ctx.issue('prototype','Prototype variable, media and conditional actions are not imported.');return;}
 const destination=typeof raw.destinationId==='string'?raw.destinationId:'',navigation=String(raw.navigation??'NAVIGATE'),moved={transition:transition(raw.transition),...(raw.preserveScrollPosition===true?{preserveScroll:true}:{})};
 if(navigation==='CHANGE_TO'){const componentId=ctx.main(destination);if(componentId)return {id,type:'change-variant',targetScope:'self',componentId,...moved};ctx.issue('prototype','A prototype action points at a variant outside this file.');return;}
 const target=ctx.target(destination);if(!target){ctx.issue('prototype','A prototype action points at a layer on another page or outside this file.');return;}
 if(navigation==='SCROLL_TO')return {id,type:'scroll-to',targetId:target.id,...moved};if(navigation==='OVERLAY'||navigation==='SWAP')return {id,type:navigation==='SWAP'?'swap-overlay':'open-overlay',targetId:target.id,overlay:defaultOverlay(),...moved};return {id,type:'navigate',targetId:target.id,...moved};
}
const reaction=(trigger:PrototypeReaction['trigger'],actions:PrototypeAction[],delay=0):PrototypeReaction=>({id:crypto.randomUUID(),trigger,enabled:true,actions,delay,key:'',modifiers:[],gamepadButton:0});
export function figRestReactions(raw:Raw,ctx:FigRestContext):PrototypeReaction[]{
 const out:PrototypeReaction[]=[],interactions=items(raw.interactions);for(const item of interactions){const event=record(item.trigger),trigger=triggers[String(event.type)];if(!trigger){ctx.issue('prototype','Keyboard and other unsupported prototype triggers were omitted.');continue;}const actions=items(item.actions).flatMap(a=>{const mapped=action(a,ctx);return mapped?[mapped]:[];});if(actions.length)out.push(reaction(trigger,actions,trigger==='delay'?Math.max(0,finite(event.timeout,.8)*1000):0));}
 if(!interactions.length&&typeof raw.transitionNodeID==='string'){const target=ctx.target(raw.transitionNodeID);if(target){const t=defaultTransition();t.duration=Math.max(0,Math.min(10000,finite(raw.transitionDuration,300)));out.push(reaction('click',[{id:crypto.randomUUID(),type:'navigate',targetId:target.id,transition:t}]));}else ctx.issue('prototype','A prototype action points at a layer on another page or outside this file.');}
 return out;
}
