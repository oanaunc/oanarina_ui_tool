import {refusePassThroughPlayback,validateDocumentPassThrough} from './pass-through';
import {validateDocumentPrototypeAudio} from './prototype-audio';
import {validateDocumentNetworks} from './vector-network';
import {validateDocumentPrototypeInputs} from './prototype-input';
import {refuseBackgroundBlurPlayback,validateDocumentBackgroundBlur} from './background-blur';
import {applyPresentedVariants,previewComponentIds,validateInteractiveScope,validatePresentedVariantPlan} from './interactive-variants';
import {validateDocumentTextPaths} from './text-path';
import {hasDynamicStroke,validateDocumentDynamicStrokes} from './dynamic-stroke';
import {hasCalligraphicStroke,validateDocumentCalligraphicStrokes} from './calligraphic-stroke';
import {validateDocumentProgressiveBlur} from './progressive-blur';
import type {DesignDocument,DesignNode,Page} from './model';
import {descendants,reflow} from './model';
import {applyConstraints} from './layout';
import {updateTextMetrics} from './text-layout';
import {updateBooleans} from './geometry';
import {applyDesignSystems,modesFor,resolveVariable} from './design-systems';
import {synchronizeComponents} from './components-model';
import {easingValue} from './motion';
import type {Easing} from './motion';
import {fillsFor} from './paints';
import {worldMatrix} from './transforms';

export const prototypeTriggers=['click','drag','hover','press','mouseenter','mouseleave','mousedown','mouseup','delay','key','gamepad','scroll'] as const;
export type PrototypeTrigger=typeof prototypeTriggers[number];
export const prototypeActions=['navigate','back','open-link','open-overlay','swap-overlay','close-overlay','scroll-to','change-variant','set-variable','conditional'] as const;
export const transitionTypes=['instant','dissolve','smart-animate','move-in','move-out','push','slide-in','slide-out'] as const;
export interface PrototypeTransition {type:typeof transitionTypes[number];duration:number;easing:Easing;direction:'left'|'right'|'top'|'bottom';}
export interface OverlayOptions {position:'center'|'manual'|'top-left'|'top-right'|'bottom-left'|'bottom-right';x:number;y:number;background:string;opacity:number;closeOutside:boolean;overflow:boolean;}
export interface PrototypeAction {
 id:string;type:typeof prototypeActions[number];targetId?:string;targetScope?:'self';componentId?:string;url?:string;variableId?:string;expression?:string;
 transition?:PrototypeTransition;overlay?:OverlayOptions;preserveScroll?:boolean;resetState?:boolean;
 branches?:{condition:string;actions:PrototypeAction[]}[];
}
export interface PrototypeReaction {id:string;trigger:PrototypeTrigger;enabled:boolean;actions:PrototypeAction[];delay:number;key:string;modifiers:('meta'|'control'|'shift'|'alt')[];gamepadButton:number;}
export interface PrototypeFlow {id:string;name:string;frameId:string;description:string;}
export interface PrototypeSettings {device:'none'|'phone'|'tablet'|'desktop';orientation:'portrait'|'landscape';background:string;scale:'fit'|'actual'|'fill';hotspots:boolean;reducedMotion:boolean;}
export interface PrototypeState {frameId:string;history:string[];overlays:{frameId:string;options:OverlayOptions;transition:PrototypeTransition}[];values:Record<string,string|number|boolean>;variants:Record<string,string>;}
export interface PrototypeEffect {type:'open-link'|'scroll-to';url?:string;targetId?:string;duration?:number;easing?:PrototypeTransition['easing'];}
export const defaultTransition=():PrototypeTransition=>({type:'instant',duration:300,easing:'ease-out',direction:'left'});
export const defaultOverlay=():OverlayOptions=>({position:'center',x:0,y:0,background:'#000000',opacity:.35,closeOutside:true,overflow:false});
export const defaultPrototypeSettings=():PrototypeSettings=>({device:'none',orientation:'portrait',background:'#17161b',scale:'fit',hotspots:false,reducedMotion:false});
export function createReaction(trigger:PrototypeTrigger='click'):PrototypeReaction{return {id:crypto.randomUUID(),trigger,enabled:true,delay:800,key:'Enter',modifiers:[],gamepadButton:0,actions:[{id:crypto.randomUUID(),type:'navigate',transition:defaultTransition()}]};}
export function reactionsFor(n:DesignNode):PrototypeReaction[]{return n.reactions??(n.targetId?[{...createReaction(),id:'legacy-'+n.id,actions:[{id:'legacy-action-'+n.id,type:'navigate',targetId:n.targetId,transition:defaultTransition()}]}]:[]);}

// Expressions are parsed into a small AST. No JavaScript source is evaluated.
type Expr={kind:'literal';value:string|number|boolean}|{kind:'name';value:string}|{kind:'unary';op:string;arg:Expr}|{kind:'binary';op:string;left:Expr;right:Expr}|{kind:'call';name:string;args:Expr[]};
interface Token {kind:'number'|'string'|'name'|'op';text:string;}
const precedence:Record<string,number>={'||':1,'&&':2,'==':3,'!=':3,'===':3,'!==':3,'>':4,'<':4,'>=':4,'<=':4,'+':5,'-':5,'*':6,'/':6,'%':6};
export function parseExpression(source:string):Expr {
 if(typeof source!=='string'||!source.trim()||source.length>4096)throw Error('Enter an expression of 1–4,096 characters.');
 const tokens:Token[]=[];let pos=0;
 while(pos<source.length){if(/\s/.test(source[pos])){pos++;continue;}const rest=source.slice(pos);let match:RegExpMatchArray|null;
  if(source[pos]==='"'){match=rest.match(/^"(?:[^"\\]|\\.)*"/);if(!match)throw Error('Unclosed string. Use double quotes.');JSON.parse(match[0]);tokens.push({kind:'string',text:match[0]});}
  else if(match=rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/))tokens.push({kind:'number',text:match[0]});
  else if(match=rest.match(/^[A-Za-z_$][A-Za-z0-9_$]*/))tokens.push({kind:'name',text:match[0]});
  else if(match=rest.match(/^(?:===|!==|==|!=|>=|<=|&&|\|\||[+\-*/%><!(),])/))tokens.push({kind:'op',text:match[0]});
  else throw Error('Unexpected expression character at '+(pos+1)+'.');
  pos+=match![0].length;if(tokens.length>512)throw Error('Expression has too many terms.');
 }
 let index=0,depth=0;
 const primary=():Expr=>{if(++depth>32)throw Error('Expression is too deeply nested.');const t=tokens[index++];if(!t)throw Error('Incomplete expression.');let result:Expr;
  if(t.text==='!'||t.text==='-'||t.text==='+')result={kind:'unary',op:t.text,arg:primary()};
  else if(t.text==='('){result=read(1);if(tokens[index++]?.text!==')')throw Error('Expected closing parenthesis.');}
  else if(t.kind==='number'){const value=Number(t.text);if(!Number.isFinite(value))throw Error('Number is out of range.');result={kind:'literal',value};}
  else if(t.kind==='string')result={kind:'literal',value:JSON.parse(t.text)};
  else if(t.kind==='name'){
   if(t.text==='true'||t.text==='false')result={kind:'literal',value:t.text==='true'};
   else if(tokens[index]?.text==='('){index++;const args:Expr[]=[];if(tokens[index]?.text!==')'){do{args.push(read(1));if(tokens[index]?.text!==',')break;index++;}while(index<tokens.length);}if(tokens[index++]?.text!==')')throw Error('Expected closing function parenthesis.');if(!['var','min','max','round','abs','length','concat'].includes(t.text))throw Error('Unknown expression function: '+t.text);result={kind:'call',name:t.text,args};}
   else result={kind:'name',value:t.text};
  }else throw Error('Expected a value.');depth--;return result;
 };
 const read=(minimum:number):Expr=>{let left=primary();while(index<tokens.length&&(precedence[tokens[index].text]??0)>=minimum){const op=tokens[index++].text,right=read(precedence[op]+1);left={kind:'binary',op,left,right};}return left;};
 const result=read(1);if(index!==tokens.length)throw Error('Unexpected expression term: '+tokens[index].text);return result;
}
export function evaluateExpression(source:string,lookup:(name:string)=>string|number|boolean):string|number|boolean {
 const numeric=(v:string|number|boolean)=>{if(typeof v!=='number'||!Number.isFinite(v))throw Error('This operation needs a number.');return v;};
 const bounded=(value:string|number|boolean)=>{if(typeof value==='number'&&(!Number.isFinite(value)||Math.abs(value)>1e12))throw Error('Expression result is out of range.');if(typeof value==='string'&&value.length>100000)throw Error('Expression result is too long.');return value;};
 const run=(e:Expr):string|number|boolean=>bounded(compute(e));
 const compute=(e:Expr):string|number|boolean=>{
  if(e.kind==='literal')return e.value;if(e.kind==='name')return lookup(e.value);
  if(e.kind==='unary'){const a=run(e.arg);return e.op==='!'?!a:e.op==='-'?-numeric(a):numeric(a);}
  if(e.kind==='call'){const args=e.args.map(run);if(e.name==='var'){if(args.length!==1||typeof args[0]!=='string')throw Error('var() needs a variable name or ID in quotes.');return lookup(args[0]);}
   if(e.name==='concat')return args.map(String).join('');if(e.name==='length'){if(args.length!==1)throw Error('length() needs one value.');return String(args[0]).length;}
   if(!args.length||['round','abs'].includes(e.name)&&args.length!==1)throw Error('Invalid number of function arguments.');const ns=args.map(numeric);return e.name==='min'?Math.min(...ns):e.name==='max'?Math.max(...ns):e.name==='round'?Math.round(ns[0]):Math.abs(ns[0]);
  }
  const a=run(e.left);if(e.op==='&&')return !!a&&!!run(e.right);if(e.op==='||')return !!a||!!run(e.right);const b=run(e.right);
  if(e.op==='=='||e.op==='===')return a===b;if(e.op==='!='||e.op==='!==')return a!==b;
  if(e.op==='+')return typeof a==='string'||typeof b==='string'?String(a)+String(b):numeric(a)+numeric(b);
  if(e.op==='>'||e.op==='<'||e.op==='>='||e.op==='<='){if(typeof a!==typeof b||typeof a==='boolean')throw Error('Compare two numbers or two strings.');return e.op==='>'?a>b:e.op==='<'?a<b:e.op==='>='?a>=b:a<=b;}
  const x=numeric(a),y=numeric(b);if((e.op==='/'||e.op==='%')&&y===0)throw Error('Cannot divide by zero.');return e.op==='-'?x-y:e.op==='*'?x*y:e.op==='/'?x/y:x%y;
 };
 const result=run(parseExpression(source));if(typeof result==='number'&&(!Number.isFinite(result)||Math.abs(result)>1e12))throw Error('Expression result is out of range.');if(typeof result==='string'&&result.length>100000)throw Error('Expression result is too long.');return result;
}
export function validateTransition(t:PrototypeTransition|undefined){if(!t)return;if(!transitionTypes.includes(t.type)||!Number.isFinite(t.duration)||t.duration<0||t.duration>10000||!['left','right','top','bottom'].includes(t.direction))throw Error('Invalid prototype transition.');const e=t.easing;if(Array.isArray(e)){if(e.length!==4||e.some(v=>!Number.isFinite(v)||Math.abs(v)>10)||e[0]<0||e[0]>1||e[2]<0||e[2]>1)throw Error('Invalid prototype bezier.');}else if(!['linear','ease-in','ease-out','ease-in-out','spring','step'].includes(e))throw Error('Invalid prototype easing.');}
export function validateActions(actions:PrototypeAction[],depth=0,budget={count:0}){if(!Array.isArray(actions)||actions.length>100||depth>16||(budget.count+=actions.length)>1000)throw Error('Invalid prototype actions.');const ids=new Set<string>();for(const a of actions){if(!a||typeof a.id!=='string'||ids.has(a.id)||!prototypeActions.includes(a.type))throw Error('Invalid prototype action.');ids.add(a.id);validateInteractiveScope(a);for(const k of ['targetId','variableId','componentId'] as const)if(a[k]!==undefined&&typeof a[k]!=='string')throw Error('Invalid action reference.');if(a.url!==undefined&&(typeof a.url!=='string'||a.url!==''&&!/^https?:\/\/[^\s]+$/i.test(a.url)))throw Error('Use an http or https prototype link.');if(a.expression!==undefined)parseExpression(a.expression);validateTransition(a.transition);
 if(a.overlay){const o=a.overlay;if(!['center','manual','top-left','top-right','bottom-left','bottom-right'].includes(o.position)||![o.x,o.y,o.opacity].every(Number.isFinite)||Math.abs(o.x)>1e6||Math.abs(o.y)>1e6||o.opacity<0||o.opacity>1||!/^#[0-9a-f]{6}$/i.test(o.background)||typeof o.closeOutside!=='boolean'||typeof o.overflow!=='boolean')throw Error('Invalid overlay options.');}
 for(const k of ['preserveScroll','resetState'] as const)if(a[k]!==undefined&&typeof a[k]!=='boolean')throw Error('Invalid prototype action flag.');
 if(a.branches!==undefined){if(!Array.isArray(a.branches)||a.branches.length>32)throw Error('Invalid conditional branches.');for(const b of a.branches){if(typeof b.condition!=='string')throw Error('Invalid branch condition.');if(b.condition)parseExpression(b.condition);validateActions(b.actions,depth+1,budget);}}
 }}
export function validatePrototype(d:DesignDocument){for(const p of d.pages){if(p.flows!==undefined){if(!Array.isArray(p.flows)||p.flows.length>1000||new Set(p.flows.map(f=>f.id)).size!==p.flows.length)throw Error('Invalid prototype flows.');for(const f of p.flows)for(const k of ['id','name','frameId','description'] as const)if(typeof f[k]!=='string')throw Error('Invalid prototype flow.');}
 if(p.prototypeSettings){const a=p.prototypeSettings;if(!['none','phone','tablet','desktop'].includes(a.device)||!['portrait','landscape'].includes(a.orientation)||!['fit','actual','fill'].includes(a.scale)||!/^#[0-9a-f]{6}$/i.test(a.background)||typeof a.hotspots!=='boolean'||typeof a.reducedMotion!=='boolean')throw Error('Invalid prototype settings.');}
 for(const n of p.nodes){if(n.reactions!==undefined){if(!Array.isArray(n.reactions)||n.reactions.length>100||new Set(n.reactions.map(r=>r.id)).size!==n.reactions.length)throw Error('Invalid prototype interactions.');for(const r of n.reactions){if(typeof r.id!=='string'||!prototypeTriggers.includes(r.trigger)||typeof r.enabled!=='boolean'||!Number.isFinite(r.delay)||r.delay<0||r.delay>600000||typeof r.key!=='string'||r.key.length>100||!Array.isArray(r.modifiers)||r.modifiers.some(m=>!['meta','control','shift','alt'].includes(m))||!Number.isInteger(r.gamepadButton)||r.gamepadButton<0||r.gamepadButton>31)throw Error('Invalid prototype trigger.');validateActions(r.actions);}}
 if(n.prototypeScroll!==undefined&&!['none','horizontal','vertical','both'].includes(n.prototypeScroll))throw Error('Invalid scroll setting.');if(n.prototypePosition!==undefined&&!['normal','fixed','sticky'].includes(n.prototypePosition))throw Error('Invalid prototype positioning.');
 }}}
export function prototypeFrames(p:Page){return p.nodes.filter(n=>{if(n.type!=='frame')return false;let parent=p.nodes.find(a=>a.id===n.parentId);const seen=new Set([n.id]);while(parent&&!seen.has(parent.id)){if(parent.type==='frame')return false;seen.add(parent.id);parent=p.nodes.find(a=>a.id===parent!.parentId);}return true;});}
export function resolveDestination(p:Page,id:string|undefined){const n=p.nodes.find(n=>n.id===id);if(n?.type==='frame')return n;if(n?.type==='section')return p.nodes.find(x=>x.type==='frame'&&descendants(p.nodes,[n.id]).includes(x.id));return undefined;}
export function createPrototypeState(p:Page,selected?:string,flowId?:string):PrototypeState {refuseBackgroundBlurPlayback(p.nodes);refusePassThroughPlayback(p.nodes);const flow=p.flows?.find(f=>f.id===flowId)??p.flows?.[0];let containing=resolveDestination(p,selected),current=p.nodes.find(n=>n.id===selected);const seen=new Set<string>();if(!containing)while(current&&!seen.has(current.id)){seen.add(current.id);if(current.type==='frame')containing=current;current=p.nodes.find(n=>n.id===current!.parentId);}const frame=containing??resolveDestination(p,flow?.frameId)??prototypeFrames(p)[0];return {frameId:frame?.id??'',history:[],overlays:[],values:{},variants:{}};}
export function prototypeDocument(d:DesignDocument,state:PrototypeState){validateDocumentPrototypeAudio(d);validateDocumentPassThrough(d);validateDocumentNetworks(d);validateDocumentPrototypeInputs(d);validatePresentedVariantPlan(d,state.variants);const copy=structuredClone(d);for(const v of copy.variables??[])if(Object.hasOwn(state.values,v.id))for(const mode of Object.keys(v.values))v.values[mode]=state.values[v.id];const ids=previewComponentIds(d);synchronizeComponents(copy,ids);applyPresentedVariants(copy,state.variants,ids);applyDesignSystems(copy);for(const page of copy.pages){applyConstraints(page.nodes,d.pages.find(p=>p.id===page.id)?.nodes??[]);updateTextMetrics(page.nodes);reflow(page.nodes);updateBooleans(page.nodes);}validateDocumentBackgroundBlur(copy);validateDocumentPassThrough(copy);validateDocumentProgressiveBlur(copy);validateDocumentDynamicStrokes(copy);validateDocumentTextPaths(copy);validateDocumentCalligraphicStrokes(copy);validateDocumentNetworks(copy);validateDocumentPrototypeInputs(copy);validateDocumentPrototypeAudio(copy);return copy;}
export function executeActions(d:DesignDocument,pageId:string,initial:PrototypeState,actions:PrototypeAction[]){
 validateActions(actions);const state=structuredClone(initial),effects:PrototypeEffect[]=[];let transition:PrototypeTransition|undefined,preserveScroll=false;
 const page=d.pages.find(p=>p.id===pageId);if(!page)throw Error('Prototype page is missing.');
 const lookup=(name:string)=>{const copy=prototypeDocument(d,state),v=copy.variables?.find(v=>v.id===name||v.name===name);if(!v)throw Error('Unknown variable: '+name);const currentPage=copy.pages.find(p=>p.id===pageId)!,frame=currentPage.nodes.find(n=>n.id===(state.overlays.at(-1)?.frameId??state.frameId));return resolveVariable(copy,v.id,frame?modesFor(copy,frame,currentPage.nodes):{}).value;};
 const run=(list:PrototypeAction[])=>{for(const a of list){const dest=()=>{const n=resolveDestination(page,a.targetId);if(!n)throw Error('This interaction has a missing destination.');return n.id;};
  if(a.type==='navigate'){const target=dest();if(target!==state.frameId){state.history.push(state.frameId);state.history=state.history.slice(-200);}state.frameId=target;state.overlays=[];if(a.resetState)state.variants={};transition=a.transition??defaultTransition();preserveScroll=!!a.preserveScroll;}
  else if(a.type==='back'){const closed=state.overlays.length?state.overlays.pop():undefined;if(!closed&&state.history.length)state.frameId=state.history.pop()!;transition=a.transition??closed?.transition??defaultTransition();}
  else if(a.type==='open-link'){if(!a.url)throw Error('Enter a link destination.');effects.push({type:'open-link',url:a.url});}
  else if(a.type==='open-overlay'||a.type==='swap-overlay'){const frameId=dest();if(state.overlays.length>=20&&a.type==='open-overlay')throw Error('Too many nested overlays.');const previous=state.overlays.at(-1);if(a.type==='swap-overlay'&&previous)state.overlays.pop();state.overlays.push({frameId,options:a.overlay??previous?.options??defaultOverlay(),transition:a.transition??defaultTransition()});}
  else if(a.type==='close-overlay'){const closed=state.overlays.pop();transition=a.transition??closed?.transition;}
  else if(a.type==='scroll-to'){if(!page.nodes.some(n=>n.id===a.targetId))throw Error('Scroll destination is missing.');effects.push({type:'scroll-to',targetId:a.targetId,duration:a.transition?.type==='instant'?0:a.transition?.duration??300,easing:a.transition?.easing??'ease-out'});}
  else if(a.type==='change-variant'){if(a.targetScope)throw Error('Resolve the interactive action from its receiving instance first.');const current=prototypeDocument(d,state),instance=current.pages.find(p=>p.id===pageId)!.nodes.find(n=>n.id===a.targetId),component=current.pages.flatMap(p=>p.nodes).find(n=>n.id===a.componentId&&n.type==='component');if(!instance||instance.type!=='instance'||!component)throw Error('Choose an instance and a component state.');state.variants={...state.variants,[instance.id]:component.id};transition=a.transition??defaultTransition();}
  else if(a.type==='set-variable'){const v=d.variables?.find(v=>v.id===a.variableId);if(!v)throw Error('Choose a variable.');const value=evaluateExpression(a.expression??'',lookup);if(v.type==='number'?typeof value!=='number'||Math.abs(value)>1e6:v.type==='boolean'?typeof value!=='boolean':typeof value!=='string'||v.type==='color'&&!/^#[0-9a-f]{6}$/i.test(value))throw Error('Expression does not match '+v.name+' ('+v.type+').');state.values={...state.values,[v.id]:value};}
  else if(a.type==='conditional'){for(const b of a.branches??[])if(!b.condition||evaluateExpression(b.condition,lookup)){run(b.actions);break;}}
 }};
 run(actions);validatePrototypeStateChange(d,pageId,initial,state,transition);return {state,effects,transition,preserveScroll};
}
export function keyMatches(r:PrototypeReaction,e:Pick<KeyboardEvent,'key'|'metaKey'|'ctrlKey'|'altKey'|'shiftKey'>){return r.key.toLowerCase()===e.key.toLowerCase()&&e.metaKey===r.modifiers.includes('meta')&&e.ctrlKey===r.modifiers.includes('control')&&e.shiftKey===r.modifiers.includes('shift')&&e.altKey===r.modifiers.includes('alt');}
export function brokenConnections(p:Page){const flatten=(actions:PrototypeAction[]):PrototypeAction[]=>actions.flatMap(a=>[a,...(a.branches??[]).flatMap(b=>flatten(b.actions))]);return p.nodes.flatMap(n=>reactionsFor(n).flatMap(r=>flatten(r.actions).filter(a=>['navigate','open-overlay','swap-overlay'].includes(a.type)&&!resolveDestination(p,a.targetId)).map(a=>({nodeId:n.id,reactionId:r.id,actionId:a.id,name:n.name}))));}
function normalizedNodes(p:Page,frameId:string){const frame=p.nodes.find(n=>n.id===frameId);if(!frame)return [];const ids=new Set(descendants(p.nodes,[frameId]));return p.nodes.filter(n=>ids.has(n.id)).map(n=>({...n,x:n.x-frame.x,y:n.y-frame.y,parentId:n.id===frame.id?null:n.parentId}));}
function pathKeys(nodes:DesignNode[]){const keys=new Map<string,string>();const walk=(parent:string|null,path:string)=>{const counts=new Map<string,number>();for(const n of nodes.filter(n=>n.parentId===parent)){const base=n.name+':'+n.type,index=counts.get(base)??0;counts.set(base,index+1);const key=parent===null?'':path+'/'+base+':'+index;keys.set(n.id,key);walk(n.id,key);}};walk(null,'');return keys;}
/** Geometric interpolation and spring overshoot are not preflightable with fixed filter-region budgets. */
export function validateProgressiveSmartAnimate(from:Page,fromId:string,to:Page,toId:string){for(const [page,id] of [[from,fromId],[to,toId]] as const){const ids=new Set(descendants(page.nodes,[id]));if(page.nodes.some(n=>ids.has(n.id)&&n.vectorNetwork))throw Error('Vector networks do not support Smart animate. Flatten them or choose a static transition.');if(page.nodes.some(n=>ids.has(n.id)&&hasCalligraphicStroke(n)))throw Error('Calligraphic strokes do not yet support Smart animate. Choose a static transition instead.');if(page.nodes.some(n=>ids.has(n.id)&&n.textPath))throw Error('Text on path does not yet support Smart animate. Choose a static transition instead.');if(page.nodes.some(n=>ids.has(n.id)&&hasDynamicStroke(n)))throw Error('Dynamic strokes do not yet support Smart animate. Choose an instant, dissolve, or move transition instead.');if(page.nodes.some(n=>ids.has(n.id)&&n.effects?.some(e=>e.type==='progressive-blur')))throw Error('Progressive blur does not yet support Smart animate. Choose an instant, dissolve, or move transition instead.');}}
/** Derive and validate before a presenter publishes either the state or its transition. */
export function validatePrototypeStateChange(d:DesignDocument,pageId:string,before:PrototypeState,next:PrototypeState,transition?:PrototypeTransition){const after=prototypeDocument(d,next),a=after.pages.find(p=>p.id===pageId);if(!a)throw Error('Prototype page is missing.');const overlayChanged=JSON.stringify(before.overlays)!==JSON.stringify(next.overlays),t=transition??(overlayChanged?next.overlays.at(-1)?.transition??before.overlays.at(-1)?.transition:undefined);if(t?.type==='smart-animate'&&t.duration>0){const b=prototypeDocument(d,before).pages.find(p=>p.id===pageId)!;validateProgressiveSmartAnimate(b,before.frameId,a,next.frameId);for(let i=0;i<Math.max(before.overlays.length,next.overlays.length);i++)validateProgressiveSmartAnimate(b,before.overlays[i]?.frameId??'',a,next.overlays[i]?.frameId??'');}return after;}
export function smartAnimate(from:Page,fromId:string,to:Page,toId:string,progress:number){refuseBackgroundBlurPlayback(from.nodes);refusePassThroughPlayback(from.nodes);refuseBackgroundBlurPlayback(to.nodes);refusePassThroughPlayback(to.nodes);
 validateProgressiveSmartAnimate(from,fromId,to,toId);
 const a=normalizedNodes(from,fromId),b=normalizedNodes(to,toId),ka=pathKeys(a),kb=pathKeys(b),byKey=new Map(a.map(n=>[ka.get(n.id),n])),mapping=new Map<string,string>(),used=new Set<string>();
 for(const n of b){const before=byKey.get(kb.get(n.id));if(before){mapping.set(before.id,n.id);used.add(before.id);}}
 const color=(a:string,b:string,t:number)=>/^#[0-9a-f]{6}$/i.test(a)&&/^#[0-9a-f]{6}$/i.test(b)?'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,Math.round(parseInt(a.slice(i,i+2),16)+(parseInt(b.slice(i,i+2),16)-parseInt(a.slice(i,i+2),16))*t))).toString(16).padStart(2,'0')).join(''):b;
 const fade=Math.max(0,Math.min(1,progress)),lerp=(a:number,b:number)=>a+(b-a)*progress;
 const result=b.map(n=>{const before=byKey.get(kb.get(n.id));if(!before){const enteringParent=n.parentId&&b.some(parent=>parent.id===n.parentId&&!byKey.has(kb.get(parent.id)));return {...n,opacity:n.opacity*(enteringParent?1:fade)};}const out={...n};for(const k of ['x','y','width','height','rotation','opacity','radius'] as const)out[k]=lerp(before[k],n[k]);out.width=Math.max(.01,out.width);out.height=Math.max(.01,out.height);out.opacity=Math.max(0,Math.min(1,lerp(before.visible?before.opacity:0,n.visible?n.opacity:0)));out.visible=progress>=1?n.visible:before.visible||n.visible;out.radius=Math.max(0,out.radius);out.fill=color(before.fill,n.fill,progress);
 const oldPaints=fillsFor(before),newPaints=fillsFor(n);
 if(oldPaints.length===newPaints.length&&oldPaints.every((p,i)=>p.type===newPaints[i].type&&p.stops.length===newPaints[i].stops.length&&(p.type!=='image'||p.image===newPaints[i].image&&p.scaleMode===newPaints[i].scaleMode)))out.paints=newPaints.map((p,i)=>{const old=oldPaints[i],paint={...structuredClone(p),color:color(old.color,p.color,progress),visible:progress>=1?p.visible:old.visible||p.visible,opacity:Math.max(0,Math.min(1,lerp(old.visible?old.opacity:0,p.visible?p.opacity:0)))};for(const key of ['angle','cx','cy','radius'] as const)paint[key]=lerp(old[key],p[key]);paint.radius=Math.max(.001,paint.radius);if(p.type==='image'){for(const key of ['scale','offsetX','offsetY'] as const)if(old[key]!==undefined||p[key]!==undefined)paint[key]=lerp(old[key]??(key==='scale'?1:0),p[key]??(key==='scale'?1:0));if(paint.scale!==undefined)paint.scale=Math.max(.001,paint.scale);}paint.stops=p.stops.map((stop,j)=>({...stop,position:Math.max(0,Math.min(1,lerp(old.stops[j].position,stop.position))),color:color(old.stops[j].color,stop.color,progress),opacity:Math.max(0,Math.min(1,lerp(old.stops[j].opacity,stop.opacity)))}));return paint;});
 else out.paints=[...oldPaints.map(p=>({...structuredClone(p),opacity:p.opacity*(1-fade)})),...newPaints.map(p=>({...structuredClone(p),id:'entering-'+p.id,opacity:p.opacity*fade}))];return out;});
 for(const n of a)if(!used.has(n.id)){const exitingParent=n.parentId&&!used.has(n.parentId);result.push({...n,id:'exiting-'+n.id,parentId:n.parentId?mapping.get(n.parentId)??'exiting-'+n.parentId:null,opacity:n.opacity*(exitingParent?1:1-fade)});}
 return result;
}
export function transitionProgress(t:PrototypeTransition,elapsed:number){return t.type==='instant'||t.duration===0?1:easingValue(t.easing,Math.max(0,Math.min(1,elapsed/t.duration)));}

/** Materialize fixed and sticky layers without changing the saved document. */
export function prototypeScrollNodes(nodes:DesignNode[],frameId:string,offset:{x:number;y:number}){refuseBackgroundBlurPlayback(nodes);refusePassThroughPlayback(nodes);
 const frame=nodes.find(n=>n.id===frameId);if(!frame||!offset.x&&!offset.y)return nodes;const copy=structuredClone(nodes),inside=new Set(descendants(nodes,[frameId])),positioned=nodes.filter(n=>n.id!==frameId&&inside.has(n.id)&&n.prototypePosition&&n.prototypePosition!=='normal');
 const contentRight=Math.max(frame.x+frame.width,...nodes.filter(n=>inside.has(n.id)).map(n=>n.x+n.width)),contentBottom=Math.max(frame.y+frame.height,...nodes.filter(n=>inside.has(n.id)).map(n=>n.y+n.height));
 for(const n of positioned){let ancestor=nodes.find(p=>p.id===n.parentId),nested=false;const seen=new Set<string>();while(ancestor&&ancestor.id!==frameId&&!seen.has(ancestor.id)){seen.add(ancestor.id);if(ancestor.prototypePosition&&ancestor.prototypePosition!=='normal'){nested=true;break;}ancestor=nodes.find(p=>p.id===ancestor!.parentId);}if(nested)continue;
 const parent=nodes.find(p=>p.id===n.parentId),right=parent&&parent.id!==frameId?parent.x+parent.width:contentRight,bottom=parent&&parent.id!==frameId?parent.y+parent.height:contentBottom;
 let dx=n.prototypePosition==='fixed'?offset.x:Math.max(0,Math.min(offset.x-(n.x-frame.x),right-n.x-n.width)),dy=n.prototypePosition==='fixed'?offset.y:Math.max(0,Math.min(offset.y-(n.y-frame.y),bottom-n.y-n.height));
 if(parent){const matrix=worldMatrix(parent,nodes),det=matrix[0]*matrix[3]-matrix[1]*matrix[2];if(Math.abs(det)>1e-10){const x=(matrix[3]*dx-matrix[2]*dy)/det,y=(-matrix[1]*dx+matrix[0]*dy)/det;dx=x;dy=y;}}const moved=new Set(descendants(copy,[n.id]));for(const child of copy)if(moved.has(child.id)){child.x+=dx;child.y+=dy;}
 }return copy;
}
