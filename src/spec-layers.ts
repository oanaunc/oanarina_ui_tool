import {descendants,node} from './model';
import type {DesignNode,Page} from './model';
import {createPaint} from './paints';
import {allBlocks,isListBlock,specInlineMarks,specRows} from './spec';
import type {SpecBlock} from './spec';
import {textLines,updateTextMetrics} from './text-layout';
/** What the canvas paints for a spec: ordinary layers derived from its blocks, so every export path keeps working. They never enter the document. */
export const SPEC_PAGE={margin:48,mono:'JetBrains Mono',body:16,line:1.65,code:13,step:24,marker:24,codePad:12,quotePad:15,cellPad:8,minWidth:320,defaultWidth:850,defaultHeight:1100};
const HEADING=[[40,700],[30,700],[24,600],[20,600],[16,600],[14,600]],RULE='#e6e6e6',SHADE='#f5f5f5',MUTED='#8f8f8f',ACCENT='#0d99ff';
/** The triangle beside a toggle, in a 16 box, the same on the canvas and in the editor. */
export const SPEC_TOGGLE_CLOSED='M5.5 3.5L11.5 8L5.5 12.5Z',SPEC_TOGGLE_OPEN='M3.5 5.5L12.5 5.5L8 11.5Z';
export interface SpecFrameEmbed {block:string;x:number;y:number;width:number;height:number;scale:number;root:DesignNode;nodes:DesignNode[];}
export interface SpecLayout {layers:DesignNode[];frames:SpecFrameEmbed[];height:number;}
type FrameBlock=Extract<SpecBlock,{kind:'frame'}>;
export type SpecLookup=(block:FrameBlock)=>{root:DesignNode;nodes:DesignNode[]}|undefined;
/** Frames resolve on every read, so an edit to the design shows up in the spec. Specs never show inside each other, which also rules out cycles. */
export function specLookup(pages:Pick<Page,'id'|'nodes'>[],current:DesignNode[]=[]):SpecLookup{
 return block=>{const own=block.pageId?pages.find(p=>p.id===block.pageId)?.nodes:undefined,hold=[own,current,...pages.map(p=>p.nodes)].find(nodes=>nodes?.some(n=>n.id===block.nodeId));if(!hold)return undefined;const root=hold.find(n=>n.id===block.nodeId)!;if(root.type==='spec')return undefined;const ids=new Set(descendants(hold,[root.id]));return {root,nodes:hold.filter(n=>ids.has(n.id)&&n.type!=='spec')};};
}
const ink=(fill:string)=>{const m=/^#([\da-f]{2})([\da-f]{2})([\da-f]{2})/i.exec(fill);if(!m)return '#1e1e1e';const [r,g,b]=m.slice(1).map(v=>parseInt(v,16));return .299*r+.587*g+.114*b<128?'#f2f2f2':'#1e1e1e';};
const solid=(color:string)=>({fill:color,paints:[createPaint(color)]});
export const specBlockGap=(block:SpecBlock,above?:SpecBlock)=>!above?0:block.kind==='heading'?(block.level<=2?28:20):isListBlock(block)&&isListBlock(above)?6:12;
const remember=new Map<string,{key:string;layout:Omit<SpecLayout,'frames'>&{frames:Omit<SpecFrameEmbed,'root'|'nodes'>[]}}>();
function build(n:DesignNode,find:SpecLookup){
 const {margin}=SPEC_PAGE,color=ink(n.fill),full=Math.max(1,n.width-margin*2),family=n.fontFamily||'Inter',layers:DesignNode[]=[],frames:Omit<SpecFrameEmbed,'root'|'nodes'>[]=[];let y=margin,serial=0;
 const key=(block:SpecBlock)=>`${n.id}-${block.id}-${serial++}`;
 const text=(block:SpecBlock,source:string,x:number,top:number,w:number,o:{size?:number;weight?:number;line?:number;mono?:boolean;marks?:boolean;fill?:string}={})=>{const marked=o.marks===false?{text:source,runs:[]}:specInlineMarks(source,SPEC_PAGE.mono),t=node('text',{id:key(block),name:'Text',x,y:top,width:w,height:o.size??SPEC_PAGE.body,text:marked.text,fontFamily:o.mono?SPEC_PAGE.mono:family,fontSize:o.size??SPEC_PAGE.body,fontWeight:o.weight??400,lineHeight:o.line??SPEC_PAGE.line,textLineBox:true,letterSpacing:0,textAlign:'left',textResize:'auto-height',...solid(o.fill??color),...(marked.runs.length?{textRuns:marked.runs}:{})});updateTextMetrics([t]);t.height=Math.max(1,textLines(t,false).length)*t.fontSize*t.lineHeight;layers.push(t);return t;};
 const box=(block:SpecBlock,x:number,top:number,w:number,h:number,paint:string,extra:Partial<DesignNode>={})=>{const r=node('rectangle',{id:key(block),name:'Shape',x,y:top,width:w,height:h,stroke:'',strokeWidth:0,text:'',...solid(paint),...extra});layers.push(r);return r;};
 for(const {block,depth,number,above} of specRows(n.spec?.blocks??[])){
  y+=specBlockGap(block,above);const left=margin+SPEC_PAGE.step*depth,width=Math.max(1,full-SPEC_PAGE.step*depth),listLeft=isListBlock(block)?left+SPEC_PAGE.step*(block.indent??0):left;
  switch(block.kind){
   case 'paragraph':y+=text(block,block.text,left,y,width).height;break;
   case 'heading':{const [size,weight]=HEADING[block.level-1];y+=text(block,block.text,left,y,width,{size,weight,line:1.25}).height;break;}
   case 'bullet':text(block,'•',listLeft+6,y,SPEC_PAGE.marker,{marks:false});y+=text(block,block.text,listLeft+SPEC_PAGE.marker,y,width-(listLeft-left)-SPEC_PAGE.marker).height;break;
   case 'number':text(block,number+'.',listLeft,y,SPEC_PAGE.marker,{marks:false});y+=text(block,block.text,listLeft+SPEC_PAGE.marker,y,width-(listLeft-left)-SPEC_PAGE.marker).height;break;
   case 'todo':{const top=y+5;box(block,listLeft,top,16,16,block.checked?ACCENT:'#ffffff',{radius:3,...(block.checked?{}:{stroke:MUTED,strokeWidth:1})});if(block.checked)text(block,'✓',listLeft+3,y+1,14,{size:12,weight:700,marks:false,fill:'#ffffff'});y+=text(block,block.text,listLeft+SPEC_PAGE.marker,y,width-(listLeft-left)-SPEC_PAGE.marker,block.checked?{fill:MUTED}:{}).height;break;}
   case 'toggle':layers.push(node('path',{id:key(block),name:'Toggle',x:left,y:y+5,width:16,height:16,pathWidth:16,pathHeight:16,path:block.open?SPEC_TOGGLE_OPEN:SPEC_TOGGLE_CLOSED,stroke:'',strokeWidth:0,text:'',...solid(MUTED)}));y+=text(block,block.text,left+SPEC_PAGE.marker,y,width-SPEC_PAGE.marker).height;break;
   case 'quote':{const t=text(block,block.text,left+SPEC_PAGE.quotePad,y,width-SPEC_PAGE.quotePad);box(block,left,y,3,t.height,RULE);y+=t.height;break;}
   case 'code':{const shade=box(block,left,y,width,1,SHADE,{radius:6}),t=text(block,block.text,left+SPEC_PAGE.codePad,y+SPEC_PAGE.codePad,width-SPEC_PAGE.codePad*2,{size:SPEC_PAGE.code,line:1.5,mono:true,marks:false});shade.height=t.height+SPEC_PAGE.codePad*2;y+=shade.height;break;}
   case 'divider':box(block,left,y+6,width,1,RULE);y+=13;break;
   case 'table':{const columns=Math.max(...block.rows.map(r=>r.length)),cell=width/columns,start=y,grid=box(block,left,y,width,1,RULE),pad=SPEC_PAGE.cellPad;y+=1;for(const cells of block.rows){const shades=Array.from({length:columns},(_,c)=>box(block,left+c*cell+(c?0:1),y,cell-(c?1:2),1,'#ffffff')),tall=Array.from({length:columns},(_,c)=>text(block,cells[c]??'',left+c*cell+pad,y+pad,cell-pad*2,{size:14,line:1.5}).height);const h=Math.max(...tall)+pad*2;for(const shade of shades)shade.height=h;y+=h+1;}grid.height=y-start;break;}
   case 'image':{const shown=Math.min(width,block.width||width),h=block.width?shown*(block.height/block.width):width*.5625;if(block.src){const paint=createPaint('#000000');Object.assign(paint,{type:'image',image:block.src,imageWidth:block.width,imageHeight:block.height,scaleMode:'fit'});layers.push(node('image',{id:key(block),name:'Image',x:left,y,width:shown,height:h,fill:'none',stroke:'',text:'',paints:[paint]}));}else{box(block,left,y,shown,h,SHADE,{radius:6});text(block,'Image not available',left+SPEC_PAGE.codePad,y+SPEC_PAGE.codePad,shown-SPEC_PAGE.codePad*2,{size:13,fill:MUTED,marks:false});}y+=h;break;}
   case 'frame':{const found=find(block),root=found?.root,scale=root&&root.width?Math.min(1,width/root.width):1,h=root?Math.max(1,root.height*scale):96;if(root)frames.push({block:block.id,x:left,y,width:root.width*scale,height:h,scale});else{box(block,left,y,width,h,SHADE,{radius:6});text(block,block.name?`“${block.name}” is not available`:'This frame is not available',left+SPEC_PAGE.codePad,y+SPEC_PAGE.codePad,width-SPEC_PAGE.codePad*2,{size:13,fill:MUTED,marks:false});}y+=h;break;}
  }
 }
 return {layers,frames,height:y+margin};
}
/** Words are measured with the fonts of the moment, so a font arriving late has to measure them again. */
export const forgetSpecLayouts=()=>remember.clear();
/** Copies a frame's live layers under ids of their own, because the original stays painted on its page. */
function embedded(owner:string,block:string,source:{nodes:DesignNode[]}){const name=(id:string)=>`${owner}-${block}-${id}`,ids=new Set(source.nodes.map(n=>n.id));return source.nodes.map(n=>({...n,id:name(n.id),parentId:n.parentId&&ids.has(n.parentId)?name(n.parentId):null}));}
/** Layout is measured once per page content and width; frame contents are read fresh, so they stay live. */
export function layoutSpec(n:DesignNode,find:SpecLookup):SpecLayout{
 const sizes=specRows(n.spec?.blocks??[]).flatMap(({block:b})=>{if(b.kind!=='frame')return [];const root=find(b)?.root;return [root?[root.width,root.height]:0];}),key=JSON.stringify([n.spec?.blocks,n.width,n.fontFamily,n.fill,sizes]);let held=remember.get(n.id);
 if(held?.key!==key){if(remember.size>256)remember.clear();held={key,layout:build(n,find)};remember.set(n.id,held);}
 const blocks=allBlocks(n.spec?.blocks??[]),frames=held.layout.frames.flatMap(f=>{const block=blocks.find(b=>b.id===f.block) as FrameBlock,source=find(block);return source?[{...f,root:source.root,nodes:embedded(n.id,f.block,source)}]:[];});
 return {layers:held.layout.layers,frames,height:Math.max(n.minHeight??0,held.layout.height)};
}
/** A spec is as tall as its words, down to the page height it was given. A drag on its height changes that floor. */
export function settleSpecs(doc:{pages:Page[]},previous?:{pages:Pick<Page,'id'|'nodes'>[]}){
 const lookup=specLookup(doc.pages);
 for(const page of doc.pages){const before=previous?.pages.find(p=>p.id===page.id)?.nodes;for(const n of page.nodes){if(n.type!=='spec')continue;n.width=Math.max(SPEC_PAGE.minWidth,n.width);const old=before?.find(v=>v.id===n.id);if(old&&old.height!==n.height&&JSON.stringify(old.spec)===JSON.stringify(n.spec))n.minHeight=n.height;const height=layoutSpec(n,lookup).height;if(n.height!==height)n.height=height;}}
}
/** Keeps real layers for the outputs that walk layers themselves. Same-id frame, so links and selections still resolve. */
export function flattenSpecs(nodes:DesignNode[],pages:Pick<Page,'id'|'nodes'>[]):DesignNode[]{
 if(!nodes.some(n=>n.type==='spec'))return nodes;const lookup=specLookup(pages,nodes),out:DesignNode[]=[];
 for(const n of nodes){if(n.type!=='spec'){out.push(n);continue;}const {spec:_,...rest}=n,layout=layoutSpec(n,lookup);out.push({...rest,type:'frame',clip:true});for(const layer of layout.layers)out.push({...layer,parentId:n.id,x:layer.x+n.x,y:layer.y+n.y});}
 return out;
}
