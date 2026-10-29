import {create} from 'zustand';
import {blankDocument,bounds,descendants,node,reflow,uid} from './model';
import type {DesignDocument,DesignNode,NodeKind,Tool} from './model';
import {normalizedRootSelection,updateBooleans} from './geometry';
import {applyConstraints} from './layout';
import {updateTextMetrics} from './text-layout';
import {sampleDocument} from './sample';
const clone=<T,>(a:T):T=>structuredClone(a);
interface EditorState {
 doc:DesignDocument;pageId:string;selection:string[];tool:Tool;zoom:number;pan:{x:number;y:number};
 past:DesignDocument[];future:DesignDocument[];clipboard:DesignNode[];savedAt:string;toast:string;
 fontRevision:number;grid:boolean;snap:boolean;outlines:boolean;rulers:boolean;uiHidden:boolean;mode:'design'|'prototype'|'inspect';
 vectorEditId:string|null;vectorSelection:string[];modal:string|null;leftTab:'layers'|'assets';home:boolean;search:string;theme:'dark'|'light';
 set:(p:Partial<EditorState>)=>void;edit:(fn:(doc:DesignDocument)=>void)=>void;
 undo:()=>void;redo:()=>void;patch:(ids:string[],p:Partial<DesignNode>)=>void;
 add:(type:NodeKind,props?:Partial<DesignNode>)=>string;remove:()=>void;duplicate:()=>void;copy:()=>void;paste:()=>void;
 group:(type?:NodeKind)=>void;ungroup:()=>void;align:(dir:string)=>void;order:(dir:string)=>void;
 newDocument:(sample?:boolean)=>void;load:(d:DesignDocument)=>void;addPage:()=>void;deletePage:()=>void;
 select:(id:string,extend?:boolean)=>void;fit:(selected?:boolean)=>void;move:(dx:number,dy:number)=>void;
}
let timer:ReturnType<typeof setTimeout>;
export const useEditor=create<EditorState>((set,get)=>{
 const doc=sampleDocument();
 return {doc,pageId:doc.pages[0].id,selection:[],tool:'move',zoom:.7,pan:{x:12,y:16},past:[],future:[],clipboard:[],savedAt:'',toast:'',fontRevision:0,grid:false,snap:true,outlines:false,rulers:false,uiHidden:false,mode:'design',vectorEditId:null,vectorSelection:[],modal:null,leftTab:'layers',home:false,search:'',theme:'dark',
 set:(p)=>{set(p);if(p.toast){clearTimeout(timer);timer=setTimeout(()=>set({toast:''}),4000);}},
 edit:(fn)=>{const s=get(),d=clone(s.doc);fn(d);d.pages.forEach(p=>{applyConstraints(p.nodes,s.doc.pages.find(old=>old.id===p.id)?.nodes??[]);updateTextMetrics(p.nodes);reflow(p.nodes);updateBooleans(p.nodes);});d.updatedAt=new Date().toISOString();set({doc:d,past:[...s.past.slice(-99),s.doc],future:[]});},
 undo:()=>{const s=get();if(!s.past.length)return;const d=s.past.at(-1)!;set({doc:d,pageId:d.pages.some(p=>p.id===s.pageId)?s.pageId:d.pages[0].id,past:s.past.slice(0,-1),future:[s.doc,...s.future],selection:[]});},
 redo:()=>{const s=get();if(!s.future.length)return;const d=s.future[0];set({doc:d,pageId:d.pages.some(p=>p.id===s.pageId)?s.pageId:d.pages[0].id,past:[...s.past,s.doc],future:s.future.slice(1),selection:[]});},
 patch:(ids,p)=>get().edit(d=>{const ns=d.pages.find(p=>p.id===get().pageId)!.nodes;for(const n of ns)if(ids.includes(n.id)){const dx=p.x===undefined?0:p.x-n.x,dy=p.y===undefined?0:p.y-n.y;if(n.type==='path'&&(p.width!==undefined||p.height!==undefined)){n.pathWidth??=n.width;n.pathHeight??=n.height;}Object.assign(n,p);if(dx||dy)for(const c of ns)if(c.id!==n.id&&descendants(ns,[n.id]).includes(c.id)){c.x+=dx;c.y+=dy;}}}),
 add:(type,props={})=>{const n=node(type,props);get().edit(d=>d.pages.find(p=>p.id===get().pageId)!.nodes.push(n));set({selection:[n.id]});return n.id;},
 remove:()=>{const s=get();s.edit(d=>{const p=d.pages.find(p=>p.id===s.pageId)!;const ids=descendants(p.nodes,s.selection);p.nodes=p.nodes.filter(n=>!ids.includes(n.id));});set({selection:[]});},
 copy:()=>{const s=get(),ns=s.doc.pages.find(p=>p.id===s.pageId)!.nodes;set({clipboard:clone(ns.filter(n=>descendants(ns,s.selection).includes(n.id)))});},
 paste:()=>{const s=get();if(!s.clipboard.length)return;const map=new Map(s.clipboard.map(n=>[n.id,uid()]));const cp=s.clipboard.map(n=>({...clone(n),id:map.get(n.id)!,parentId:map.get(n.parentId??'')??null,x:n.x+24,y:n.y+24}));s.edit(d=>d.pages.find(p=>p.id===s.pageId)!.nodes.push(...cp));set({selection:cp.filter(n=>!n.parentId).map(n=>n.id)});},
 duplicate:()=>{get().copy();get().paste();},
 group:(type='group')=>{const s=get(),ns=s.doc.pages.find(p=>p.id===s.pageId)!.nodes,selected=ns.filter(n=>s.selection.includes(n.id));if(!selected.length)return;
 const roots=selected.filter(n=>!selected.some(p=>p.id!==n.id&&descendants(ns,[p.id]).includes(n.id)));const b=bounds(roots),g=node(type,{...b,name:type==='component'?'Component 1':'Group',fill:'none',parentId:roots.every(n=>n.parentId===roots[0].parentId)?roots[0].parentId:null});
 s.edit(d=>{const p=d.pages.find(p=>p.id===s.pageId)!;p.nodes.splice(p.nodes.findIndex(n=>n.id===roots[0].id),0,g);p.nodes.filter(n=>roots.some(r=>r.id===n.id)).forEach(n=>n.parentId=g.id);});set({selection:[g.id]});},
 ungroup:()=>{const s=get();s.edit(d=>{const p=d.pages.find(p=>p.id===s.pageId)!;for(const id of s.selection){const g=p.nodes.find(n=>n.id===id);if(g&&(['group','frame','component','instance'].includes(g.type)||g.booleanOp)){p.nodes.forEach(n=>{if(n.parentId===id)n.parentId=g.parentId;});p.nodes=p.nodes.filter(n=>n.id!==id);}}});set({selection:[]});},
 align:(dir)=>{const s=get();s.edit(d=>{const ns=d.pages.find(p=>p.id===s.pageId)!.nodes,sel=normalizedRootSelection(ns,s.selection),b=bounds(sel);if(sel.length<2)return;const sorted=[...sel].sort((a,b)=>dir==='distribute-x'?a.x-b.x:a.y-b.y);const total=sel.reduce((sum,n)=>sum+(dir==='distribute-x'?n.width:n.height),0),gap=((dir==='distribute-x'?b.width:b.height)-total)/(sel.length-1);let pos=dir==='distribute-x'?b.x:b.y;
 for(const n of dir.startsWith('distribute')?sorted:sel){let x=n.x,y=n.y;if(dir==='left')x=b.x;if(dir==='center')x=b.x+(b.width-n.width)/2;if(dir==='right')x=b.x+b.width-n.width;if(dir==='top')y=b.y;if(dir==='middle')y=b.y+(b.height-n.height)/2;if(dir==='bottom')y=b.y+b.height-n.height;if(dir==='distribute-x'){x=pos;pos+=n.width+gap;}if(dir==='distribute-y'){y=pos;pos+=n.height+gap;}const dx=x-n.x,dy=y-n.y;ns.filter(c=>descendants(ns,[n.id]).includes(c.id)).forEach(c=>{c.x+=dx;c.y+=dy;});}});},
 order:(dir)=>{const s=get();s.edit(d=>{const p=d.pages.find(p=>p.id===s.pageId)!,selected=new Set(normalizedRootSelection(p.nodes,s.selection).map(n=>n.id)),groups=new Map<string|null,DesignNode[]>();for(const n of p.nodes){const a=groups.get(n.parentId)??[];a.push(n);groups.set(n.parentId,a);}for(const [parent,items] of groups){if(dir==='front')groups.set(parent,[...items.filter(n=>!selected.has(n.id)),...items.filter(n=>selected.has(n.id))]);else if(dir==='back')groups.set(parent,[...items.filter(n=>selected.has(n.id)),...items.filter(n=>!selected.has(n.id))]);else if(dir==='forward'){for(let i=items.length-2;i>=0;i--)if(selected.has(items[i].id)&&!selected.has(items[i+1].id))[items[i],items[i+1]]=[items[i+1],items[i]];}else{for(let i=1;i<items.length;i++)if(selected.has(items[i].id)&&!selected.has(items[i-1].id))[items[i],items[i-1]]=[items[i-1],items[i]];}}
 const sorted:DesignNode[]=[];const append=(parent:string|null)=>{for(const n of groups.get(parent)??[]){sorted.push(n);append(n.id);}};append(null);p.nodes=sorted;});},
 newDocument:(sample=false)=>{const d=sample?sampleDocument():blankDocument();set({doc:d,pageId:d.pages[0].id,selection:[],vectorEditId:null,vectorSelection:[],past:[],future:[],home:false,savedAt:'',pan:{x:12,y:16},zoom:.7});},
 load:(d)=>set({doc:d,pageId:d.pages[0].id,selection:[],vectorEditId:null,vectorSelection:[],past:[],future:[],home:false,savedAt:'',pan:{x:12,y:16},zoom:.7}),
 addPage:()=>{const id=uid();get().edit(d=>d.pages.push({id,name:`Page ${d.pages.length+1}`,nodes:[],comments:[]}));set({pageId:id,selection:[]});},
 deletePage:()=>{const s=get();if(s.doc.pages.length<=1)return;s.edit(d=>{d.pages=d.pages.filter(p=>p.id!==s.pageId);});set({pageId:get().doc.pages[0].id,selection:[]});},
 select:(id,extend=false)=>set(s=>({selection:extend?s.selection.includes(id)?s.selection.filter(a=>a!==id):[...s.selection,id]:[id]})),
 fit:(selected=false)=>{const s=get(),ns=s.doc.pages.find(p=>p.id===s.pageId)!.nodes.filter(n=>n.visible&&(!selected||s.selection.includes(n.id))),b=bounds(ns);const el=document.querySelector('[data-canvas]'),w=el?.clientWidth??1000,h=el?.clientHeight??750,z=Math.max(.05,Math.min(Math.max(80,w-60)/(b.width||1),Math.max(80,h-120)/(b.height||1),2));set({zoom:z,pan:{x:(w-b.width*z)/2-b.x*z,y:(h-b.height*z)/2-b.y*z-20}});},
 move:(dx,dy)=>{const s=get();s.edit(d=>{const ns=d.pages.find(p=>p.id===s.pageId)!.nodes,ids=descendants(ns,s.selection);ns.filter(n=>ids.includes(n.id)).forEach(n=>{n.x+=dx;n.y+=dy;});});}
 };
});
export const currentPage=()=>{const s=useEditor.getState();return s.doc.pages.find(p=>p.id===s.pageId)!;};
