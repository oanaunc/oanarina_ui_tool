import type {Easing} from './motion';
import type {DesignNode,Page} from './model';
import {defaultOverlay,defaultTransition} from './prototype';
import type {OverlayOptions,PrototypeAction,PrototypeFlow,PrototypeReaction,PrototypeTransition} from './prototype';
import {list,number,object,optional,reference,string} from './fig-values';
import type {Raw} from './fig-values';
export interface FigPrototypeContext {source:(id:string)=>Raw|undefined;target:(id:string)=>DesignNode|undefined;main:(id:string)=>string|undefined;issue:(code:string,message:string,raw?:Raw)=>void;}
const triggers:Record<string,PrototypeReaction['trigger']>={ON_CLICK:'click',ON_HOVER:'hover',ON_PRESS:'press',DRAG:'drag',AFTER_TIMEOUT:'delay',MOUSE_IN:'mouseenter',MOUSE_OUT:'mouseleave',MOUSE_ENTER:'mouseenter',MOUSE_LEAVE:'mouseleave',MOUSE_DOWN:'mousedown',MOUSE_UP:'mouseup'};
const easings:Record<string,Easing>={LINEAR:'linear',IN_CUBIC:'ease-in',OUT_CUBIC:'ease-out',INOUT_CUBIC:'ease-in-out',IN_BACK_CUBIC:[.36,0,.66,-.56],OUT_BACK_CUBIC:[.34,1.56,.64,1],INOUT_BACK_CUBIC:[.68,-.6,.32,1.6],SPRING:'spring',GENTLE_SPRING:'spring',SPRING_PRESET_ONE:'spring',SPRING_PRESET_TWO:'spring',SPRING_PRESET_THREE:'spring',EASE_IN:'ease-in',GENTLE:'spring',QUICK:'spring',BOUNCY:'spring',SLOW:'spring',CUSTOM_SPRING:'spring'};
const overlays:Record<string,OverlayOptions['position']>={CENTER:'center',TOP_LEFT:'top-left',TOP_RIGHT:'top-right',BOTTOM_LEFT:'bottom-left',BOTTOM_RIGHT:'bottom-right',MANUAL:'manual'};
/** Files in the wild state short times in seconds and long ones in milliseconds. The ranges do not overlap in practice. */
const milliseconds=(v:unknown,fallback:number)=>{const n=number(v,fallback);return Math.max(0,Math.min(10000,n>0&&n<20?n*1000:n));};
const channel=(v:unknown)=>Math.round(Math.max(0,Math.min(1,number(v,0)))*255).toString(16).padStart(2,'0');
/** An overlay's place and scrim are set on the frame that opens, not on the action. Older records carried the position on the action. */
function overlayOptions(raw:Raw,frame:Raw={}):OverlayOptions{
 const offset=optional(raw.overlayRelativePosition),scrim=optional(frame.overlayBackgroundAppearance),paint=optional(scrim.backgroundColor),opacity=scrim.backgroundType==='SOLID_COLOR'?number(paint.a,1):scrim.backgroundType==='NONE'?0:undefined;
 return {...defaultOverlay(),position:overlays[string(frame.overlayPositionType??raw.overlayPositionType,'CENTER')]??'center',x:number(offset.x,0),y:number(offset.y,0),...(frame.overlayBackgroundInteraction!==undefined?{closeOutside:frame.overlayBackgroundInteraction==='CLOSE_ON_CLICK_OUTSIDE'}:{}),...(opacity!==undefined?{opacity}:{}),...(scrim.backgroundType==='SOLID_COLOR'?{background:'#'+channel(paint.r)+channel(paint.g)+channel(paint.b)}:{})};
}
/** Forma records the direction of travel; the source names the side a frame arrives from. */
function transition(raw:Raw,ctx:FigPrototypeContext):PrototypeTransition{
 const out=defaultTransition(),kind=string(raw.transitionType,'INSTANT_TRANSITION'),slide=/^(SLIDE|PUSH|MOVE)_(FROM|OUT_TO)_(LEFT|RIGHT|TOP|BOTTOM)$/.exec(kind);
 out.duration=milliseconds(raw.transitionDuration,300);
 if(kind==='INSTANT_TRANSITION')out.type='instant';else if(kind==='DISSOLVE')out.type='dissolve';else if(kind==='SMART_ANIMATE')out.type='smart-animate';
 else if(slide){const [,motion,way,side]=slide,from=way==='FROM';if(motion==='PUSH')out.type='push';else if(motion==='SLIDE')out.type=from?'slide-in':'slide-out';else out.type=from?'move-in':'move-out';const opposite={LEFT:'right',RIGHT:'left',TOP:'bottom',BOTTOM:'top'} as const,same={LEFT:'left',RIGHT:'right',TOP:'top',BOTTOM:'bottom'} as const;out.direction=(from?opposite:same)[side as 'LEFT'];}
 else ctx.issue('prototype-transition','An unsupported prototype transition became an instant change.',raw);
 const easing=string(raw.easingType,'OUT_CUBIC'),custom=list(raw.easingFunction,4);if(easing==='CUSTOM_CUBIC'&&custom.length===4){const v=custom.map(n=>number(n));if(v[0]>=0&&v[0]<=1&&v[2]>=0&&v[2]<=1&&v.every(n=>Math.abs(n)<=10))out.easing=v as [number,number,number,number];}else if(easings[easing]!==undefined)out.easing=easings[easing];
 return out;
}
function action(raw:Raw,owner:Raw,ctx:FigPrototypeContext):PrototypeAction|undefined{
 const connection=string(raw.connectionType,'INTERNAL_NODE'),navigation=string(raw.navigationType,'NAVIGATE'),id=crypto.randomUUID(),moved={transition:transition(raw,ctx),...(raw.transitionPreserveScroll===true?{preserveScroll:true}:{}),...(raw.transitionResetInteractiveComponents===true?{resetState:true}:{})};
 if(connection==='BACK')return {id,type:'back'};if(connection==='CLOSE')return {id,type:'close-overlay'};if(connection==='NONE')return undefined;
 if(connection==='URL'){const url=string(raw.connectionURL);if(/^https?:\/\/[^\s]+$/i.test(url)&&url.length<=2048)return {id,type:'open-link',url};ctx.issue('prototype-link','A prototype link that is not http or https was omitted.',owner);return;}
 if(connection!=='INTERNAL_NODE'){ctx.issue('prototype-action','Prototype variable, media and conditional actions are not imported.',owner);return;}
 const destination=reference({guid:raw.transitionNodeID});if(!destination)return;
 if(navigation==='SWAP_STATE'){const componentId=ctx.main(destination);if(componentId)return {id,type:'change-variant',targetScope:'self',componentId,...moved};ctx.issue('prototype-target','A prototype action points at a variant that is not in this file.',owner);return;}
 const target=ctx.target(destination);if(!target){ctx.issue('prototype-target','A prototype action points at a layer on another page or outside this file.',owner);return;}
 if(navigation==='SCROLL_TO')return {id,type:'scroll-to',targetId:target.id,...moved};
 if(navigation==='OVERLAY'||navigation==='SWAP'){return {id,type:navigation==='SWAP'?'swap-overlay':'open-overlay',targetId:target.id,overlay:overlayOptions(raw,ctx.source(destination)),...moved};}
 return {id,type:'navigate',targetId:target.id,...moved};
}
const baseReaction=(trigger:PrototypeReaction['trigger'],actions:PrototypeAction[],delay=0):PrototypeReaction=>({id:crypto.randomUUID(),trigger,enabled:true,actions,delay,key:'',modifiers:[],gamepadButton:0});
/** Each source interaction becomes one reaction. Older single-link records use their own transition fields. */
export function figReactions(raw:Raw,ctx:FigPrototypeContext):PrototypeReaction[]{
 const out:PrototypeReaction[]=[],interactions=list(raw.prototypeInteractions,100).map(object);
 for(const interaction of interactions){if(interaction.isDeleted===true)continue;const event=optional(interaction.event),kind=string(event.interactionType,'ON_CLICK'),trigger=triggers[kind];if(!trigger){ctx.issue('prototype-trigger','Keyboard and other unsupported prototype triggers were omitted.',raw);continue;}const actions=list(interaction.actions,100).map(object).flatMap(a=>{const mapped=action(a,raw,ctx);return mapped?[mapped]:[];});if(!actions.length)continue;out.push(baseReaction(trigger,actions,trigger==='delay'?milliseconds(event.transitionTimeout,800):0));}
 if(!interactions.length&&raw.transitionNodeID!==undefined){const mapped=action({...raw,connectionType:raw.connectionType??'INTERNAL_NODE',navigationType:raw.navigationType??'NAVIGATE'},raw,ctx);if(mapped)out.push(baseReaction('click',[mapped]));}
 return out;
}
/** A marked starting frame becomes a named flow on its own page. */
export function figFlow(raw:Raw,frame:DesignNode,page:Page):PrototypeFlow|undefined{
 if(raw.prototypeStartingPoint===undefined||frame.parentId!==null&&frame.type!=='frame')return;const start=object(raw.prototypeStartingPoint),name=string(start.name,frame.name).slice(0,512);
 return (page.flows?.length??0)<1000?{id:crypto.randomUUID(),name:name||frame.name,frameId:frame.id,description:string(start.description).slice(0,4096)}:undefined;
}
