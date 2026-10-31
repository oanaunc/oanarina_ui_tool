import type {DesignDocument,DesignNode,Page} from './model';
import {editableSlotContainer} from './component-slots';
import {identity,multiply,nodeMatrix,point} from './transforms';
import type {Matrix} from './transforms';
/** Shared read-only page lookups for document audits. Every memo is linear, so 20,000-layer pages stay cheap. */
export interface AuditLayer {pageId:string;pageName:string;nodeId:string;nodeName:string;type:DesignNode['type'];locked:boolean;managed:boolean;hidden:boolean;}
export interface AuditBox {x:number;y:number;right:number;bottom:number;}
export interface PageIndex {page:Page;byId:Map<string,DesignNode>;locked:(n:DesignNode)=>boolean;visible:(n:DesignNode)=>boolean;managed:(n:DesignNode)=>boolean;opacity:(n:DesignNode)=>number;matrix:(n:DesignNode)=>Matrix;box:(n:DesignNode)=>AuditBox;order:DesignNode[];layer:(n:DesignNode)=>AuditLayer;}
export function pageIndex(page:Page):PageIndex{
 const byId=new Map(page.nodes.map(n=>[n.id,n])),children=new Map<string|null,DesignNode[]>(),lockMemo=new Map<string,boolean>(),seenMemo=new Map<string,boolean>(),managedMemo=new Map<string,boolean>(),opacityMemo=new Map<string,number>(),matrixMemo=new Map<string,Matrix>(),boxMemo=new Map<string,AuditBox>();
 for(const n of page.nodes){const key=n.parentId&&byId.has(n.parentId)?n.parentId:null,list=children.get(key)??[];list.push(n);children.set(key,list);}
 /** Parents resolve first, iteratively, so a pathological parent chain cannot overflow the stack. */
 const lineage=(n:DesignNode,done:(id:string)=>boolean)=>{const trail:DesignNode[]=[],seen=new Set<string>();let current:DesignNode|undefined=n;while(current&&!done(current.id)&&!seen.has(current.id)){seen.add(current.id);trail.push(current);current=current.parentId?byId.get(current.parentId):undefined;}return {trail:trail.reverse(),parent:current,cycle:!!current&&seen.has(current.id)};};
 const locked=(n:DesignNode)=>{const {trail,parent,cycle}=lineage(n,id=>lockMemo.has(id));let value=cycle||(parent?lockMemo.get(parent.id)??false:false);for(const item of trail){value=value||item.locked;lockMemo.set(item.id,value);}return lockMemo.get(n.id)!;};
 const visible=(n:DesignNode)=>{const {trail,parent,cycle}=lineage(n,id=>seenMemo.has(id));let value=!cycle&&(parent?seenMemo.get(parent.id)??true:true);for(const item of trail){value=value&&item.visible;seenMemo.set(item.id,value);}return seenMemo.get(n.id)!;};
 const managed=(n:DesignNode)=>{const {trail}=lineage(n,id=>managedMemo.has(id));for(const item of trail){const parent=item.parentId?byId.get(item.parentId):undefined;managedMemo.set(item.id,Boolean(item.instanceRootId)||(parent?(editableSlotContainer(parent,page.nodes)?false:parent.type==='instance'||(managedMemo.get(parent.id)??false)):false));}return managedMemo.get(n.id)!;};
 const opacity=(n:DesignNode)=>{const {trail,parent}=lineage(n,id=>opacityMemo.has(id));let value=parent?opacityMemo.get(parent.id)??1:1;for(const item of trail){value*=item.opacity;opacityMemo.set(item.id,value);}return opacityMemo.get(n.id)!;};
 const matrix=(n:DesignNode)=>{const {trail,parent}=lineage(n,id=>matrixMemo.has(id));let value:Matrix=parent?matrixMemo.get(parent.id)??identity:identity,above=parent;for(const item of trail){value=multiply(value,nodeMatrix(item,above));matrixMemo.set(item.id,value);above=item;}return matrixMemo.get(n.id)!;};
 const box=(n:DesignNode)=>{const cached=boxMemo.get(n.id);if(cached)return cached;const m=matrix(n),pts=[point(m,0,0),point(m,n.width,0),point(m,n.width,n.height),point(m,0,n.height)],value={x:Math.min(...pts.map(p=>p.x)),y:Math.min(...pts.map(p=>p.y)),right:Math.max(...pts.map(p=>p.x)),bottom:Math.max(...pts.map(p=>p.y))};boxMemo.set(n.id,value);return value;};
 const order:DesignNode[]=[],seen=new Set<string>(),pending:DesignNode[]=[...(children.get(null)??[])].reverse();
 while(pending.length){const n=pending.pop()!;if(seen.has(n.id))continue;seen.add(n.id);order.push(n);const list=children.get(n.id)??[];for(const child of n.layout!=='none'&&n.layoutStacking==='first-on-top'?list:[...list].reverse())pending.push(child);}
 return {page,byId,locked,visible,managed,opacity,matrix,box,order,layer:n=>({pageId:page.id,pageName:page.name,nodeId:n.id,nodeName:n.name,type:n.type,locked:locked(n),managed:managed(n),hidden:!visible(n)})};
}
export const documentIndexes=(d:DesignDocument)=>d.pages.map(pageIndex);
export const axisAligned=(m:Matrix)=>Math.abs(m[1])<1e-9&&Math.abs(m[2])<1e-9||Math.abs(m[0])<1e-9&&Math.abs(m[3])<1e-9;
export const hexColor=(v:unknown):v is string=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
export function hexToRgb(hex:string):[number,number,number]{if(!hexColor(hex))throw Error('Use a six-digit hexadecimal color.');return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
export const rgbToHex=(r:number,g:number,b:number)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
/** CIE L*a*b* under D65; CIE76 distance is a cheap, symmetric near-duplicate metric. */
export function hexToLab(hex:string):[number,number,number]{
 const [r,g,b]=hexToRgb(hex).map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}),x=(.4124564*r+.3575761*g+.1804375*b)/.95047,y=.2126729*r+.7151522*g+.072175*b,z=(.0193339*r+.119192*g+.9503041*b)/1.08883,f=(t:number)=>t>.008856?Math.cbrt(t):7.787*t+16/116;
 return [116*f(y)-16,500*(f(x)-f(y)),200*(f(y)-f(z))];
}
export function colorDistance(a:string,b:string){const p=hexToLab(a),q=hexToLab(b);return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);}
export function hexToHsl(hex:string):[number,number,number]{const [r,g,b]=hexToRgb(hex).map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),l=(max+min)/2,d=max-min;if(!d)return [0,0,l];const s=d/(1-Math.abs(2*l-1)),h=max===r?((g-b)/d+6)%6:max===g?(b-r)/d+2:(r-g)/d+4;return [h*60,s,l];}
export function hslToHex(h:number,s:number,l:number){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h/60%2-1)),m=l-c/2,[r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return rgbToHex((r+m)*255,(g+m)*255,(b+m)*255);}
