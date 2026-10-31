import type {FigDocumentBlock,FigDocumentContent} from './fig-document';
import {reflow} from './layout';
import {node} from './model';
import type {DesignNode} from './model';
import {createPaint} from './paints';
import type {Paint} from './paints';
import {updateTextMetrics} from './text-layout';
const INK='#1e1e1e',MARGIN=48,GAP=12;
const heading=[[32,700],[26,700],[22,600],[18,600],[16,600],[14,600]];
function textLayer(block:FigDocumentBlock,parent:DesignNode,family:string){
 const [fontSize,fontWeight]=block.kind==='heading'?heading[block.level-1]:[16,400],text=block.kind==='list'?block.items.join('\n'):block.text,width=Math.max(1,parent.width-MARGIN*2);
 return node('text',{name:text.slice(0,60).trim()||'Text',parentId:parent.id,x:parent.x+MARGIN,y:parent.y+MARGIN,width,height:fontSize*1.4,text,fontFamily:family,fontSize,fontWeight,lineHeight:block.kind==='heading'?1.25:1.5,letterSpacing:0,textAlign:'left',textResize:'auto-height',fill:INK,paints:[createPaint(INK)],sizingX:'fill',...(block.kind==='list'?{listStyle:block.ordered?'number' as const:'bullet' as const}:{})});
}
/** Turns a page frame into a paper sheet of editable text. It keeps its stored size and grows only when the text needs more room. */
export function figDocumentLayers(frame:DesignNode,content:FigDocumentContent,family:string,preview:Paint[]){
 Object.assign(frame,{layout:'vertical',gap:GAP,padding:MARGIN,paddings:[MARGIN,MARGIN,MARGIN,MARGIN],alignItems:'start',justifyContent:'start',sizingX:'fixed',sizingY:'fixed',clip:false});
 if(!frame.paints?.length){frame.paints=[createPaint('#ffffff')];frame.fill='#ffffff';}
 const layers=content.blocks.map(block=>textLayer(block,frame,family)),sheet=[frame,...layers];updateTextMetrics(layers);reflow(sheet);
 const bottom=Math.max(...layers.map(n=>n.y+n.height))+MARGIN;if(bottom>frame.y+frame.height){frame.sizingY='hug';reflow(sheet);}
 if(preview.length)layers.push(node('image',{name:'Original preview',parentId:frame.id,x:frame.x,y:frame.y,width:frame.width,height:frame.height,visible:false,ignoreLayout:true,fill:'none',paints:preview,text:''}));
 return layers;
}
