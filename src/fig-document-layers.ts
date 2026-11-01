import type {FigDocumentBlock,FigDocumentContent} from './fig-document';
import {reflow} from './layout';
import {node} from './model';
import type {DesignNode} from './model';
import {createPaint} from './paints';
import type {Paint} from './paints';
import {updateTextMetrics} from './text-layout';
const INK='#1e1e1e',MARGIN=48,GAP=12;
const heading=[[32,700],[26,700],[22,600],[18,600],[16,600],[14,600]];
const solid=(color:string)=>({fill:color,paints:[createPaint(color)]});
type TextOptions={fontSize:number;fontWeight:number;lineHeight:number;fontFamily:string};
function textNode(text:string,parent:DesignNode,width:number,o:TextOptions,extra:Partial<DesignNode>={}){return node('text',{name:text.slice(0,60).trim()||'Text',parentId:parent.id,x:parent.x,y:parent.y,width,height:o.fontSize*o.lineHeight,text,fontFamily:o.fontFamily,fontSize:o.fontSize,fontWeight:o.fontWeight,lineHeight:o.lineHeight,letterSpacing:0,textAlign:'left',textResize:'auto-height',sizingX:'fill',...solid(INK),...extra});}
/** One block as the layers that draw it. Only spec pages hold the richer kinds, and those become Spec layers. */
function blockLayers(block:FigDocumentBlock,parent:DesignNode,width:number,family:string):DesignNode[]{
 const body:TextOptions={fontSize:16,fontWeight:400,lineHeight:1.5,fontFamily:family};
 if(block.kind==='heading'){const [fontSize,fontWeight]=heading[block.level-1];return [textNode(block.text,parent,width,{...body,fontSize,fontWeight,lineHeight:1.25})];}
 if(block.kind==='paragraph')return [textNode(block.text,parent,width,body)];
 if(block.kind==='list')return [textNode(block.items.join('\n'),parent,width,body,{listStyle:block.ordered?'number':'bullet'})];
 return [];
}
/** Turns a page frame into a paper sheet of editable text. It keeps its stored size and grows only when the text needs more room. */
export function figDocumentLayers(frame:DesignNode,content:FigDocumentContent,family:string,preview:Paint[]){
 Object.assign(frame,{layout:'vertical',gap:GAP,padding:MARGIN,paddings:[MARGIN,MARGIN,MARGIN,MARGIN],alignItems:'start',justifyContent:'start',sizingX:'fixed',sizingY:'fixed',clip:false});
 if(!frame.paints?.length){frame.paints=[createPaint('#ffffff')];frame.fill='#ffffff';}
 const width=Math.max(1,frame.width-MARGIN*2),layers=content.blocks.flatMap(block=>blockLayers(block,frame,width,family)),sheet=[frame,...layers],text=layers.filter(n=>n.type==='text');updateTextMetrics(text);
 reflow(sheet);
 const bottom=Math.max(...layers.map(n=>n.y+n.height))+MARGIN;if(bottom>frame.y+frame.height){frame.sizingY='hug';reflow(sheet);}
 if(preview.length)layers.push(node('image',{name:'Original preview',parentId:frame.id,x:frame.x,y:frame.y,width:frame.width,height:frame.height,visible:false,ignoreLayout:true,fill:'none',paints:preview,text:''}));
 return layers;
}
