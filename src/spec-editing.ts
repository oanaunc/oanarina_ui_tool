import {isListBlock,isTextBlock,paragraph,specId,SPEC_LIMITS} from './spec';
import type {SpecBlock,SpecBlockKind,SpecTextBlock} from './spec';
/** Pure block edits, so the page behaves the same in the editor, in tests and for an agent. Each returns a new list and where the caret lands. */
export interface SpecCaret {id:string;at:number|'end';}
export interface SpecEdit {blocks:SpecBlock[];caret?:SpecCaret;}
const at=(blocks:SpecBlock[],id:string)=>blocks.findIndex(b=>b.id===id);
const replace=(blocks:SpecBlock[],index:number,...next:SpecBlock[])=>[...blocks.slice(0,index),...next,...blocks.slice(index+1)];
const indentOf=(b:SpecBlock)=>isListBlock(b)?b.indent:undefined;
export function setText(blocks:SpecBlock[],id:string,text:string):SpecBlock[]{return blocks.map(b=>b.id===id&&isTextBlock(b)?{...b,text}:b);}
/** Words carry over when the kind changes; a kind that holds no words takes the block's place and a fresh line follows it. */
export function turnInto(blocks:SpecBlock[],id:string,kind:SpecBlockKind,level=1):SpecEdit{
 const i=at(blocks,id),b=blocks[i];if(!b)return {blocks};const text=isTextBlock(b)?b.text:'',indent=indentOf(b),depth=indent?{indent}:{};
 const base={id:b.id};let next:SpecBlock;
 switch(kind){
  case 'paragraph':next={...base,kind,text};break;
  case 'heading':next={...base,kind,level,text};break;
  case 'bullet':case 'number':next={...base,kind,text,...depth};break;
  case 'todo':next={...base,kind,text,checked:false,...depth};break;
  case 'quote':next={...base,kind,text};break;
  case 'code':next={...base,kind,text};break;
  case 'divider':{const after=blocks[i+1],line=after&&isTextBlock(after)?undefined:paragraph();return {blocks:replace(blocks,i,{...base,kind},...(line?[line]:[])),caret:{id:(line??after).id,at:0}};}
  case 'table':{const after=blocks[i+1],line=after&&isTextBlock(after)?undefined:paragraph();return {blocks:replace(blocks,i,{...base,kind,rows:[[text,''],['','']]},...(line?[line]:[])),caret:{id:(line??after).id,at:0}};}
  default:return {blocks};
 }
 return {blocks:replace(blocks,i,next),caret:{id:b.id,at:text.length}};
}
/** Puts a block with no words where the line is, or after it when the line has words. */
export function insertBlock(blocks:SpecBlock[],id:string,block:SpecBlock):SpecEdit{
 const i=at(blocks,id),b=blocks[i];if(!b)return {blocks:[...blocks,block]};const empty=isTextBlock(b)&&!b.text,list=empty?replace(blocks,i,block):[...blocks.slice(0,i+1),block,...blocks.slice(i+1)],index=at(list,block.id),after=list[index+1];
 if(after&&isTextBlock(after))return {blocks:list,caret:{id:after.id,at:0}};const line=paragraph();return {blocks:[...list.slice(0,index+1),line,...list.slice(index+1)],caret:{id:line.id,at:0}};
}
/** Enter: lists continue, an empty list item steps out, everything else opens a new paragraph. */
export function splitBlock(blocks:SpecBlock[],id:string,start:number,end=start):SpecEdit{
 const i=at(blocks,id),b=blocks[i];if(!b||!isTextBlock(b))return {blocks};
 if(!b.text&&isListBlock(b))return b.indent?{blocks:replace(blocks,i,{...b,indent:b.indent-1||undefined} as SpecBlock),caret:{id,at:0}}:turnInto(blocks,id,'paragraph');
 if(!b.text&&b.kind==='quote')return turnInto(blocks,id,'paragraph');
 if(blocks.length>=SPEC_LIMITS.blocks)return {blocks,caret:{id,at:start}};
 const head=b.text.slice(0,start),tail=b.text.slice(end),next:SpecBlock=isListBlock(b)?{...b,id:specId(),text:tail,...(b.kind==='todo'?{checked:false}:{})} as SpecBlock:{id:specId(),kind:'paragraph',text:tail};
 return {blocks:[...blocks.slice(0,i),{...b,text:head},next,...blocks.slice(i+1)],caret:{id:next.id,at:0}};
}
/** Backspace at the start: a styled line becomes plain first, and a plain line joins the one above. */
export function backspaceBlock(blocks:SpecBlock[],id:string):SpecEdit{
 const i=at(blocks,id),b=blocks[i];if(!b||!isTextBlock(b))return {blocks};
 if(isListBlock(b)&&b.indent)return {blocks:replace(blocks,i,{...b,indent:b.indent-1||undefined} as SpecBlock),caret:{id,at:0}};
 if(b.kind!=='paragraph'){const out=turnInto(blocks,id,'paragraph');return {...out,caret:{id,at:0}};}
 const above=blocks[i-1];if(!above)return {blocks,caret:{id,at:0}};
 if(!isTextBlock(above)){const list=replace(blocks,i-1);return b.text?{blocks:list,caret:{id,at:0}}:{blocks:replace(list,i-1),caret:previous(list,i-1)};}
 return {blocks:replace(replace(blocks,i),i-1,{...above,text:above.text+b.text} as SpecTextBlock),caret:{id:above.id,at:above.text.length}};
}
const previous=(blocks:SpecBlock[],i:number):SpecCaret|undefined=>{for(let k=Math.min(i-1,blocks.length-1);k>=0;k--)if(isTextBlock(blocks[k]))return {id:blocks[k].id,at:'end'};return undefined;};
/** Delete at the end: the next line's words join this one. */
export function deleteForward(blocks:SpecBlock[],id:string):SpecEdit{
 const i=at(blocks,id),b=blocks[i],below=blocks[i+1];if(!b||!isTextBlock(b)||!below)return {blocks};
 if(!isTextBlock(below))return {blocks:replace(blocks,i+1),caret:{id,at:'end'}};
 return {blocks:replace(replace(blocks,i+1),i,{...b,text:b.text+below.text} as SpecTextBlock),caret:{id,at:b.text.length}};
}
export function removeBlock(blocks:SpecBlock[],id:string):SpecEdit{
 const i=at(blocks,id);if(i<0)return {blocks};const list=replace(blocks,i);if(!list.length){const line=paragraph();return {blocks:[line],caret:{id:line.id,at:0}};}const near=previous(list,i)??list.find(isTextBlock);return {blocks:list,caret:near?{id:near.id,at:near.id===previous(list,i)?.id?'end':0}:undefined};
}
export function duplicateBlock(blocks:SpecBlock[],id:string):SpecEdit{const i=at(blocks,id);if(i<0||blocks.length>=SPEC_LIMITS.blocks)return {blocks};const copy={...structuredClone(blocks[i]),id:specId()};return {blocks:[...blocks.slice(0,i+1),copy,...blocks.slice(i+1)],caret:isTextBlock(copy)?{id:copy.id,at:'end'}:undefined};}
/** index counts positions in the list as it stands, before the block lifts out. */
export function moveBlockTo(blocks:SpecBlock[],id:string,index:number):SpecBlock[]{const i=at(blocks,id);if(i<0)return blocks;const list=replace(blocks,i),to=Math.max(0,Math.min(list.length,index>i?index-1:index));return [...list.slice(0,to),blocks[i],...list.slice(to)];}
export function indentBlock(blocks:SpecBlock[],id:string,delta:number):SpecBlock[]{
 const i=at(blocks,id),b=blocks[i];if(!b||!isListBlock(b))return blocks;const above=blocks[i-1],limit=above&&isListBlock(above)?Math.min(SPEC_LIMITS.indent,(above.indent??0)+1):0,value=Math.max(0,Math.min(limit,(b.indent??0)+delta));
 if(value===(b.indent??0))return blocks;const {indent:_,...rest}=b;return replace(blocks,i,(value?{...rest,indent:value}:rest) as SpecBlock);
}
export function toggleTodo(blocks:SpecBlock[],id:string):SpecBlock[]{return blocks.map(b=>b.id===id&&b.kind==='todo'?{...b,checked:!b.checked}:b);}
export function setCell(blocks:SpecBlock[],id:string,row:number,column:number,text:string):SpecBlock[]{return blocks.map(b=>b.id===id&&b.kind==='table'?{...b,rows:b.rows.map((r,y)=>y===row?r.map((c,x)=>x===column?text:c):r)}:b);}
export function addRow(blocks:SpecBlock[],id:string):SpecBlock[]{return blocks.map(b=>b.id===id&&b.kind==='table'&&b.rows.length<SPEC_LIMITS.rows?{...b,rows:[...b.rows,b.rows[0].map(()=>'')]}:b);}
export function addColumn(blocks:SpecBlock[],id:string):SpecBlock[]{return blocks.map(b=>b.id===id&&b.kind==='table'&&b.rows[0].length<SPEC_LIMITS.columns?{...b,rows:b.rows.map(r=>[...r,''])}:b);}
/** What a markdown prefix turns a line into, as soon as it is typed at the start of the line. */
export function markdownShortcut(typed:string):{kind:SpecBlockKind;level?:number;checked?:boolean}|undefined{
 const heading=/^(#{1,6}) $/.exec(typed);if(heading)return {kind:'heading',level:heading[1].length};
 if(/^[-*+] $/.test(typed))return {kind:'bullet'};if(/^\d{1,9}[.)] $/.test(typed))return {kind:'number'};if(typed==='> ')return {kind:'quote'};
 if(/^\[ ?\] $/.test(typed))return {kind:'todo'};if(/^\[x\] $/i.test(typed))return {kind:'todo',checked:true};if(typed==='```')return {kind:'code'};if(typed==='---'||typed==='***')return {kind:'divider'};
 return undefined;
}
export interface SpecCommand {id:string;label:string;hint:string;words:string;kind:SpecBlockKind|'image-file'|'frame-picker';level?:number;}
export const SPEC_COMMANDS:SpecCommand[]=[
 {id:'text',label:'Text',hint:'Plain writing',words:'paragraph plain body',kind:'paragraph'},
 {id:'h1',label:'Heading 1',hint:'#',words:'title big h1',kind:'heading',level:1},
 {id:'h2',label:'Heading 2',hint:'##',words:'subtitle h2',kind:'heading',level:2},
 {id:'h3',label:'Heading 3',hint:'###',words:'small h3',kind:'heading',level:3},
 {id:'bullet',label:'Bulleted list',hint:'-',words:'unordered ul points',kind:'bullet'},
 {id:'number',label:'Numbered list',hint:'1.',words:'ordered ol steps',kind:'number'},
 {id:'todo',label:'To-do',hint:'[]',words:'checkbox task check',kind:'todo'},
 {id:'quote',label:'Quote',hint:'>',words:'blockquote callout',kind:'quote'},
 {id:'code',label:'Code',hint:'```',words:'snippet pre mono',kind:'code'},
 {id:'divider',label:'Divider',hint:'---',words:'rule line separator hr',kind:'divider'},
 {id:'table',label:'Table',hint:'',words:'grid rows columns',kind:'table'},
 {id:'image',label:'Image',hint:'',words:'picture photo upload',kind:'image-file'},
 {id:'frame',label:'Frame',hint:'Live',words:'embed canvas design layer screen',kind:'frame-picker'},
];
/** Hyphens never decide a match, so todo finds To-do. */
const plain=(value:string)=>value.toLowerCase().replace(/-/g,'');
export const matchCommands=(query:string)=>{const q=plain(query.trim());return q?SPEC_COMMANDS.filter(c=>plain(c.label+' '+c.words).includes(q)):SPEC_COMMANDS;};
/** The slash a menu answers to: at the start of a line or after a space, with no space since. */
export function slashQuery(before:string){const m=/(?:^|\s)\/([^\s/]{0,24})$/.exec(before);return m?{start:before.length-m[1].length-1,query:m[1]}:undefined;}
/** Wraps a selection in a mark, or takes the mark off when it is already there. */
export function wrapMark(value:string,start:number,end:number,mark:string){
 const before=value.slice(0,start),inside=value.slice(start,end),after=value.slice(end);
 if(before.endsWith(mark)&&after.startsWith(mark))return {value:before.slice(0,-mark.length)+inside+after.slice(mark.length),start:start-mark.length,end:end-mark.length};
 return {value:before+mark+inside+mark+after,start:start+mark.length,end:end+mark.length};
}
