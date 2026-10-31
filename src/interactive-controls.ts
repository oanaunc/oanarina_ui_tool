import {combineVariants,insertInstance} from './components-model';
import {node} from './model';
import type {DesignDocument,DesignNode} from './model';
import {createReaction} from './prototype';
import type {PrototypeReaction,PrototypeTrigger} from './prototype';
/** Ready-made controls: a real component set whose variants answer clicks, hover and press, so each instance keeps its own state in a prototype. */
export const INTERACTIVE_CONTROLS=['button','toggle','checkbox','radio'] as const;
export type InteractiveControl=typeof INTERACTIVE_CONTROLS[number];
const ACCENT='#5b3fb5',SOFT='#c9c3d3',DARK='#3f2a85';
const step=(trigger:PrototypeTrigger,target:string):PrototypeReaction=>({...createReaction(trigger),actions:[{id:crypto.randomUUID(),type:'change-variant',targetScope:'self',componentId:target,transition:{type:'smart-animate',duration:140,easing:'ease-out',direction:'left'}}]});
type Parts=(x:number,y:number,id:string)=>DesignNode[];
interface Variant {name:string;width:number;height:number;fill:string;radius:number;parts:Parts;stroke?:string;on:(ids:Record<string,string>)=>PrototypeReaction[];}
const label=(text:string):Parts=>(x,y,id)=>[node('text',{name:'Label',parentId:id,x:x+16,y:y+10,width:88,height:20,text,fontSize:14,fontWeight:600,fill:'#ffffff',textAlign:'center',textResize:'fixed'})];
const knob=(left:number):Parts=>(x,y,id)=>[node('ellipse',{name:'Knob',parentId:id,x:x+left,y:y+2,width:20,height:20,fill:'#ffffff'})];
const check=(opacity:number):Parts=>(x,y,id)=>[node('path',{name:'Mark',parentId:id,x:x+4,y:y+5,width:14,height:11,points:[{x:0,y:6},{x:5,y:11},{x:14,y:0}],closed:false,pathWidth:14,pathHeight:11,fill:'none',stroke:'#ffffff',strokeWidth:2,opacity})];
const dot=(opacity:number):Parts=>(x,y,id)=>[node('ellipse',{name:'Dot',parentId:id,x:x+6,y:y+6,width:10,height:10,fill:ACCENT,opacity})];
const plans:Record<InteractiveControl,Variant[]>={
 button:[{name:'Default',width:120,height:40,fill:ACCENT,radius:8,parts:label('Button'),on:v=>[step('hover',v.Hover),step('press',v.Pressed)]},{name:'Hover',width:120,height:40,fill:'#4d33a0',radius:8,parts:label('Button'),on:v=>[step('press',v.Pressed)]},{name:'Pressed',width:120,height:40,fill:DARK,radius:8,parts:label('Button'),on:()=>[]}],
 toggle:[{name:'Off',width:44,height:24,fill:SOFT,radius:12,parts:knob(2),on:v=>[step('click',v.On)]},{name:'On',width:44,height:24,fill:ACCENT,radius:12,parts:knob(22),on:v=>[step('click',v.Off)]}],
 checkbox:[{name:'Off',width:22,height:22,fill:'#ffffff',radius:5,stroke:'#8f8999',parts:check(0),on:v=>[step('click',v.On)]},{name:'On',width:22,height:22,fill:ACCENT,radius:5,stroke:ACCENT,parts:check(1),on:v=>[step('click',v.Off)]}],
 radio:[{name:'Off',width:22,height:22,fill:'#ffffff',radius:11,stroke:'#8f8999',parts:dot(0),on:v=>[step('click',v.On)]},{name:'On',width:22,height:22,fill:'#ffffff',radius:11,stroke:ACCENT,parts:dot(1),on:v=>[step('click',v.Off)]}],
};
const titles:Record<InteractiveControl,string>={button:'Button',toggle:'Toggle',checkbox:'Checkbox',radio:'Radio'};
/** Adds the set beside existing artwork and one instance where asked. Returns the instance. */
export function insertInteractiveControl(d:DesignDocument,pageId:string,kind:InteractiveControl,place:{x:number;y:number;parentId?:string|null}){const page=d.pages.find(p=>p.id===pageId);if(!page)throw Error('Choose a page first.');const plan=plans[kind],right=page.nodes.reduce((max,n)=>n.parentId?max:Math.max(max,n.x+n.width),0),top=page.nodes.reduce((min,n)=>n.parentId?min:Math.min(min,n.y),0),ids=Object.fromEntries(plan.map(v=>[v.name,crypto.randomUUID()]));let x=right+120;for(const v of plan){const id=ids[v.name];page.nodes.push(node('component',{id,name:titles[kind]+'/'+v.name,x,y:top,width:v.width,height:v.height,fill:v.fill,radius:v.radius,...(v.stroke?{stroke:v.stroke,strokeWidth:1.5}:{}),clip:false,reactions:v.on(ids)}),...v.parts(x,top,id));x+=v.width+40;}combineVariants(d,pageId,plan.map(v=>ids[v.name]),titles[kind]);return insertInstance(d,pageId,ids[plan[0].name],{name:titles[kind],x:place.x,y:place.y,parentId:place.parentId??null});}
