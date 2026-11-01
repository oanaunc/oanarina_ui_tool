import type {FigDocumentBlock,FigDocumentContent} from './fig-document';
import {figInlineMarks} from './fig-spec-document';
import {reflow} from './layout';
import {node} from './model';
import type {DesignNode} from './model';
import {createPaint} from './paints';
import type {Paint} from './paints';
import {updateTextMetrics} from './text-layout';
const INK='#1e1e1e',RULE='#e6e6e6',SHADE='#f5f5f5',MONO='JetBrains Mono',MARGIN=48,GAP=12,SPEC_GAP=16,LIST_STEP=24,LIST_MARGIN=8,LIST_SPACING=8,LINE_HEIGHT=1.65;
const heading=[[32,700],[26,700],[22,600],[18,600],[16,600],[14,600]],specHeading=[[40,700],[30,700],[24,600],[20,600],[16,600],[14,600]];
const solid=(color:string)=>({fill:color,paints:[createPaint(color)]});
type TextOptions={fontSize:number;fontWeight:number;lineHeight:number;marks:boolean;fontFamily:string};
function textNode(source:string,parent:DesignNode,width:number,o:TextOptions,extra:Partial<DesignNode>={}){
 const lines=o.marks?source.split('\n').map(line=>figInlineMarks(line,MONO)):undefined;let at=0;const text=lines?lines.map(l=>l.text).join('\n'):source,runs=lines?.flatMap(l=>{const out=l.runs.map(r=>({...r,start:r.start+at,end:r.end+at}));at+=l.text.length+1;return out;});
 return node('text',{name:text.slice(0,60).trim()||'Text',parentId:parent.id,x:parent.x,y:parent.y,width,height:o.fontSize*o.lineHeight,text,fontFamily:o.fontFamily,fontSize:o.fontSize,fontWeight:o.fontWeight,lineHeight:o.lineHeight,letterSpacing:0,textAlign:'left',textResize:'auto-height',sizingX:'fill',...solid(INK),...(runs?.length?{textRuns:runs}:{}),...extra});
}
const box=(name:string,parent:DesignNode,width:number,extra:Partial<DesignNode>)=>node('frame',{name,parentId:parent.id,x:parent.x,y:parent.y,width,height:1,fill:'none',stroke:'',text:'',sizingX:'fill',sizingY:'hug',clip:false,...extra});
/** One block as the layers that draw it; the first is the block's direct child of the page. */
function blockLayers(block:FigDocumentBlock,parent:DesignNode,width:number,family:string,spec:boolean,image:(hash:string)=>Paint[]):DesignNode[]{
 const body:TextOptions={fontSize:16,fontWeight:400,lineHeight:spec?LINE_HEIGHT:1.5,marks:spec,fontFamily:family};
 switch(block.kind){
  case 'heading':{const [fontSize,fontWeight]=(spec?specHeading:heading)[block.level-1];return [textNode(block.text,parent,width,{...body,fontSize,fontWeight,lineHeight:1.25})];}
  case 'paragraph':return [textNode(block.text,parent,width,body)];
  case 'list':{const indent=block.indent??0;return [textNode(block.items.join('\n'),parent,width,body,{listStyle:block.ordered?'number':'bullet',...(spec?{paragraphIndent:LIST_MARGIN+LIST_STEP*indent,markerGap:LIST_STEP-LIST_MARGIN,listHanging:true,listItemSpacing:LIST_SPACING}:{})})];}
  case 'rule':return [node('rectangle',{name:'Divider',parentId:parent.id,x:parent.x,y:parent.y,width,height:1,stroke:'',text:'',sizingX:'fill',...solid(RULE)})];
  case 'spacer':return [box('Empty line',parent,width,{height:body.fontSize*body.lineHeight,sizingY:'fixed'})];
  case 'code':{const frame=box('Code',parent,width,{layout:'vertical',padding:12,paddings:[12,12,12,12],radius:6,...solid(SHADE)});return [frame,textNode(block.text,frame,width-24,{...body,fontSize:13,lineHeight:1.5,marks:false,fontFamily:MONO})];}
  case 'quote':{const frame=box('Quote',parent,width,{layout:'horizontal',gap:12,alignItems:'stretch'});return [frame,node('rectangle',{name:'Quote bar',parentId:frame.id,x:parent.x,y:parent.y,width:3,height:1,stroke:'',text:'',sizingY:'fill',...solid(RULE)}),textNode(block.text,frame,width-15,body)];}
  case 'image':{const scale=block.width>width?width/block.width:1,w=(block.width||width)*scale,h=(block.height||width*.5625)*scale;return [node('image',{name:'Image',parentId:parent.id,x:parent.x,y:parent.y,width:w,height:h,fill:'none',stroke:'',text:'',paints:image(block.hash)})];}
  case 'table':{const table=box('Table',parent,width,{layout:'vertical',gap:1,padding:1,paddings:[1,1,1,1],...solid(RULE)}),out:DesignNode[]=[table],columns=Math.max(1,...block.rows.map(r=>r.length)),cell=(width-2-(columns-1))/columns;
   for(const cells of block.rows){const row=box('Row',table,width-2,{layout:'horizontal',gap:1,alignItems:'stretch'});out.push(row);for(let i=0;i<columns;i++){const frame=box('Cell',row,cell,{layout:'vertical',padding:8,paddings:[8,8,8,8],...solid('#ffffff')});out.push(frame,textNode(cells[i]??'',frame,cell-16,{...body,fontSize:14,lineHeight:1.5}));}}
   return out;}
 }
}
/** Turns a page frame into a paper sheet of editable text. It keeps its stored size and grows only when the text needs more room. */
export function figDocumentLayers(frame:DesignNode,content:FigDocumentContent,family:string,preview:Paint[],image:(hash:string)=>Paint[]=()=>[]){
 const spec=content.source==='spec',gap=spec?SPEC_GAP:GAP;
 Object.assign(frame,{layout:'vertical',gap,padding:MARGIN,paddings:[MARGIN,MARGIN,MARGIN,MARGIN],alignItems:'start',justifyContent:'start',sizingX:'fixed',sizingY:'fixed',clip:false});
 if(!frame.paints?.length){frame.paints=[createPaint('#ffffff')];frame.fill='#ffffff';}
 const width=Math.max(1,frame.width-MARGIN*2),layers=content.blocks.flatMap(block=>blockLayers(block,frame,width,family,spec,image)),sheet=[frame,...layers],text=layers.filter(n=>n.type==='text');updateTextMetrics(text);
 if(spec&&frame.height){frame.minHeight=frame.height;frame.sizingY='hug';}
 reflow(sheet);
 if(!spec){const bottom=Math.max(...layers.map(n=>n.y+n.height))+MARGIN;if(bottom>frame.y+frame.height){frame.sizingY='hug';reflow(sheet);}}
 if(preview.length)layers.push(node('image',{name:'Original preview',parentId:frame.id,x:frame.x,y:frame.y,width:frame.width,height:frame.height,visible:false,ignoreLayout:true,fill:'none',paints:preview,text:''}));
 return layers;
}
