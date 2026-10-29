export type NodeKind = 'frame'|'section'|'slice'|'rectangle'|'ellipse'|'line'|'arrow'|'polygon'|'star'|'text'|'path'|'image'|'group'|'component'|'instance';
export type Tool = NodeKind|'move'|'hand'|'scale'|'pen'|'pencil'|'comment';
export interface DesignNode {
  id:string; type:NodeKind; name:string; parentId:string|null;
  x:number; y:number; width:number; height:number; rotation:number;
  fill:string; stroke:string; strokeWidth:number; opacity:number; radius:number;
  visible:boolean; locked:boolean; text:string; fontSize:number; fontFamily:string; fontWeight:number;
  textAlign:'left'|'center'|'right'; lineHeight:number; letterSpacing:number;
  path:string; points:{x:number;y:number}[]; image:string; shadow:boolean; blur:number;
  layout:'none'|'horizontal'|'vertical'|'grid'; gap:number; padding:number; columns:number;
  clip:boolean; componentId:string|null; targetId:string|null; gradient:boolean;
}
export interface Comment {id:string; x:number;y:number; text:string; resolved:boolean;}
export interface Page {id:string;name:string;nodes:DesignNode[];comments:Comment[];}
export interface DesignDocument {format:'oanarina-ui';version:1;id:string;name:string;pages:Page[];colors:{name:string;value:string}[];updatedAt:string;fonts?:{family:string;weight:string;data:string}[];}
export const uid = () => crypto.randomUUID();
export const containers:NodeKind[]=['frame','group','section','component','instance'];
export function node(type:NodeKind, props:Partial<DesignNode>={}):DesignNode {
  return {id:uid(),type,name:type[0].toUpperCase()+type.slice(1),parentId:null,x:0,y:0,width:160,height:100,rotation:0,
    fill:type==='text'?'#202027':type==='frame'?'#ffffff':'#d8c9f2',stroke:type==='line'||type==='arrow'||type==='path'?'#2b2935':'',strokeWidth:2,opacity:1,radius:0,
    visible:true,locked:false,text:'Your text',fontSize:24,fontFamily:'Inter',fontWeight:400,textAlign:'left',lineHeight:1.3,letterSpacing:0,path:'',points:[],image:'',shadow:false,blur:0,
    layout:'none',gap:16,padding:24,columns:3,clip:type==='frame',componentId:null,targetId:null,gradient:false,...props};
}
export function blankDocument():DesignDocument {return {format:'oanarina-ui',version:1,id:uid(),name:'Untitled',pages:[{id:uid(),name:'Page 1',nodes:[],comments:[]}],colors:[{name:'Rose',value:'#edb5d3'},{name:'Ink',value:'#282631'},{name:'Lavender',value:'#c8b9ee'},{name:'Sky',value:'#addce2'}],updatedAt:new Date().toISOString()};}
export function descendants(nodes:DesignNode[], ids:string[]):string[] {
  const found=new Set(ids);let changed=true;
  while(changed){changed=false;for(const n of nodes)if(n.parentId&&found.has(n.parentId)&&!found.has(n.id)){found.add(n.id);changed=true;}}
  return [...found];
}
export function bounds(nodes:DesignNode[]) {
  if(!nodes.length)return {x:0,y:0,width:1440,height:1000};
  const x=Math.min(...nodes.map(n=>n.x)),y=Math.min(...nodes.map(n=>n.y));
  return {x,y,width:Math.max(1,...nodes.map(n=>n.x+n.width-x)),height:Math.max(1,...nodes.map(n=>n.y+n.height-y))};
}
export function effectiveVisible(n:DesignNode,nodes:DesignNode[]):boolean {
  const visited=new Set<string>();let current:DesignNode|undefined=n;
  while(current){if(!current.visible||visited.has(current.id))return false;visited.add(current.id);current=nodes.find(a=>a.id===current!.parentId);}return true;
}
export function isLocked(n:DesignNode,nodes:DesignNode[]):boolean {let current:DesignNode|undefined=n;const seen=new Set<string>();while(current){if(current.locked||seen.has(current.id))return true;seen.add(current.id);current=nodes.find(a=>a.id===current!.parentId);}return false;}
export function reflow(nodes:DesignNode[]):void {
  // Inner containers first, then translate each child's complete subtree together.
  const arranged=nodes.filter(n=>n.layout!=='none').reverse();
  for(const p of arranged){let x=p.x+p.padding,y=p.y+p.padding,rowHeight=0;let col=0;
    for(const n of nodes.filter(n=>n.parentId===p.id&&n.visible)){
      const dx=x-n.x,dy=y-n.y;for(const c of nodes.filter(c=>descendants(nodes,[n.id]).includes(c.id))){c.x+=dx;c.y+=dy;}
      if(p.layout==='horizontal')x+=n.width+p.gap;
      else if(p.layout==='vertical')y+=n.height+p.gap;
      else {rowHeight=Math.max(rowHeight,n.height);col++;x+=n.width+p.gap;if(col>=p.columns){col=0;x=p.x+p.padding;y+=rowHeight+p.gap;rowHeight=0;}}
    }
  }
}
export function parseDocument(raw:string):DesignDocument {
  if(raw.length>50_000_000)throw Error('This file exceeds the 50 MB project limit.');
  const d=JSON.parse(raw);
  if(d.format!=='oanarina-ui'||d.version!==1||!Array.isArray(d.pages)||!d.pages.length||typeof d.name!=='string')throw Error('Choose an Oanarina .oui file or a Figma Bridge .oui file. Direct .fig files are not supported yet.');
  if(d.pages.length>1000)throw Error('Too many pages.');
  const ids=new Set<string>();
  for(const p of d.pages){if(typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||!Array.isArray(p.nodes)||!Array.isArray(p.comments)||p.nodes.length>20000)throw Error('Invalid page.');ids.add(p.id);
    const nodeIds=new Set<string>();for(const n of p.nodes){if(typeof n.id!=='string'||nodeIds.has(n.id)||!['frame','section','slice','rectangle','ellipse','line','arrow','polygon','star','text','path','image','group','component','instance'].includes(n.type))throw Error('Invalid or duplicate layer.');nodeIds.add(n.id);
      for(const k of ['x','y','width','height','rotation','opacity','fontSize','strokeWidth','radius','gap','padding','columns','lineHeight','letterSpacing','blur'])if(!Number.isFinite(n[k]))throw Error(`Invalid layer property: ${k}`);
      if(n.width<0||n.height<0||n.width>1e6||n.height>1e6||n.fontSize<=0||n.opacity<0||n.opacity>1||n.columns<1)throw Error('Layer values out of range.');
      for(const k of ['name','fill','stroke','text','fontFamily','path','image'])if(typeof n[k]!=='string')throw Error('Invalid text property.');
      if(n.image&&!/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,/.test(n.image))throw Error('Only embedded images are supported.');
      if(!Array.isArray(n.points)||n.points.some((pt:{x:number;y:number})=>!Number.isFinite(pt.x)||!Number.isFinite(pt.y)))throw Error('Invalid path points.');
    }
    for(const c of p.comments)if(typeof c.id!=='string'||typeof c.text!=='string'||typeof c.resolved!=='boolean'||!Number.isFinite(c.x)||!Number.isFinite(c.y))throw Error('Invalid comment.');
    for(const n of p.nodes){if(!(n.parentId===null||typeof n.parentId==='string')||!['none','horizontal','vertical','grid'].includes(n.layout)||!['left','center','right'].includes(n.textAlign))throw Error('Invalid layer settings.');for(const k of ['visible','locked','clip','gradient','shadow'] as const)if(typeof n[k]!=='boolean')throw Error('Invalid layer flag.');
      const seen=new Set([n.id]);let id=n.parentId;while(id){if(seen.has(id))throw Error('Cyclic layer hierarchy.');seen.add(id);const parent=p.nodes.find((a:DesignNode)=>a.id===id);if(!parent)throw Error('Missing parent layer.');id=parent.parentId;}}
  }
  if(!Array.isArray(d.colors)||d.colors.some((c:{name:string;value:string})=>typeof c.name!=='string'||!/^#[0-9a-f]{6}$/i.test(c.value)))throw Error('Invalid color styles.');
  if(d.fonts&&(!Array.isArray(d.fonts)||d.fonts.some((f:{family:string;weight:string;data:string})=>typeof f.family!=='string'||!/^\d+(?: \d+)?$/.test(f.weight)||!/^data:font\/(?:ttf|woff2);base64,/.test(f.data))))throw Error('Invalid embedded fonts.');
  return d as DesignDocument;
}
export const polygonPoints=(n:DesignNode)=>Array.from({length:n.type==='star'?10:6},(_,i)=>{const a=i*Math.PI*2/(n.type==='star'?10:6)-Math.PI/2,r=n.type==='star'&&i%2?0.43:1;return `${n.width/2+Math.cos(a)*n.width/2*r},${n.height/2+Math.sin(a)*n.height/2*r}`;}).join(' ');
