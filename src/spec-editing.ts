import {allBlocks,findBlock,isListBlock,isTextBlock,mapBlocks,paragraph,specId,specRows,SPEC_LIMITS,toggleDepth} from './spec';
import type {SpecBlock,SpecBlockKind,SpecToggleBlock} from './spec';
/** Pure block edits, so the page behaves the same in the editor, in tests and for an agent. Each returns a new list and where the caret lands. */
export interface SpecCaret {id:string;at:number|'end';}
export interface SpecEdit {blocks:SpecBlock[];caret?:SpecCaret;}
const at=(blocks:SpecBlock[],id:string)=>blocks.findIndex(b=>b.id===id);
const replace=(blocks:SpecBlock[],index:number,...next:SpecBlock[])=>[...blocks.slice(0,index),...next,...blocks.slice(index+1)];
const indentOf=(b:SpecBlock)=>isListBlock(b)?b.indent:undefined;
export function setText(blocks:SpecBlock[],id:string,text:string):SpecBlock[]{return mapBlocks(blocks,b=>b.id===id&&isTextBlock(b)?{...b,text}:b);}
const holder=(blocks:SpecBlock[],id:string):SpecBlock[]|undefined=>{if(blocks.some(b=>b.id===id))return blocks;for(const b of blocks)if(b.kind==='toggle'){const found=holder(b.blocks,id);if(found)return found;}return undefined;};
const ownerOf=(blocks:SpecBlock[],id:string):SpecToggleBlock|undefined=>allBlocks(blocks).find((b):b is SpecToggleBlock=>b.kind==='toggle'&&b.blocks.some(v=>v.id===id));
const swapList=(blocks:SpecBlock[],from:SpecBlock[],to:SpecBlock[]):SpecBlock[]=>blocks===from?to:blocks.map(b=>b.kind==='toggle'?{...b,blocks:swapList(b.blocks,from,to)}:b);
const blank=(b:SpecBlock|undefined)=>b?.kind==='paragraph'&&!b.text;
/** A toggle always keeps a line to write on, as a page does. */
const settle=(blocks:SpecBlock[])=>mapBlocks(blocks,b=>b.kind==='toggle'&&!b.blocks.length?{...b,blocks:[paragraph()]}:b);
const fits=(blocks:SpecBlock[])=>allBlocks(blocks).length<=SPEC_LIMITS.blocks&&toggleDepth(blocks)<=SPEC_LIMITS.nesting;
/** Runs an edit on the list a block sits in, so every edit works the same inside a toggle. A result past the page's limits leaves the page as it was. */
export function inside(blocks:SpecBlock[],id:string,edit:(list:SpecBlock[])=>SpecEdit):SpecEdit{const list=holder(blocks,id);if(!list)return {blocks};const out=edit(list),next=settle(swapList(blocks,list,out.blocks));return fits(next)?{...out,blocks:next}:{blocks,caret:{id,at:'end'}};}
/** Words carry over when the kind changes; a kind that holds no words takes the block's place and a fresh line follows it. */
export const turnInto=(blocks:SpecBlock[],id:string,kind:SpecBlockKind,level=1)=>inside(blocks,id,list=>turnLine(list,id,kind,level));
function turnLine(blocks:SpecBlock[],id:string,kind:SpecBlockKind,level=1):SpecEdit{
 const i=at(blocks,id),b=blocks[i];if(!b||b.kind==='toggle'&&kind==='toggle')return {blocks};const text=isTextBlock(b)?b.text:'',indent=indentOf(b),depth=indent?{indent}:{},held=b.kind==='toggle'?b.blocks.filter(v=>!blank(v)):[];
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
  case 'toggle':next={...base,kind,text,open:true,blocks:[paragraph()]};break;
  default:return {blocks};
 }
 return {blocks:replace(blocks,i,next,...held),caret:{id:b.id,at:text.length}};
}
/** Puts a block with no words where the line is, or after it when the line has words. */
export const insertBlock=(blocks:SpecBlock[],id:string,block:SpecBlock):SpecEdit=>holder(blocks,id)?inside(blocks,id,list=>insertLine(list,id,block)):{blocks:[...blocks,block]};
function insertLine(blocks:SpecBlock[],id:string,block:SpecBlock):SpecEdit{
 const i=at(blocks,id),b=blocks[i];if(!b)return {blocks:[...blocks,block]};const empty=isTextBlock(b)&&!b.text,list=empty?replace(blocks,i,block):[...blocks.slice(0,i+1),block,...blocks.slice(i+1)],index=at(list,block.id),after=list[index+1];
 if(after&&isTextBlock(after))return {blocks:list,caret:{id:after.id,at:0}};const line=paragraph();return {blocks:[...list.slice(0,index+1),line,...list.slice(index+1)],caret:{id:line.id,at:0}};
}
/** Enter: lists continue, an empty list item steps out, everything else opens a new paragraph. */
export const splitBlock=(blocks:SpecBlock[],id:string,start:number,end=start)=>inside(blocks,id,list=>splitLine(list,id,start,end));
function splitLine(blocks:SpecBlock[],id:string,start:number,end=start):SpecEdit{
 const i=at(blocks,id),b=blocks[i];if(!b||!isTextBlock(b))return {blocks};
 if(b.kind==='toggle'){
  if(!b.text&&b.blocks.every(blank))return {blocks:replace(blocks,i,{id,kind:'paragraph',text:''}),caret:{id,at:0}};
  const head=b.text.slice(0,start),tail=b.text.slice(end);
  if(b.open){if(!tail&&blank(b.blocks[0]))return {blocks:replace(blocks,i,{...b,text:head}),caret:{id:b.blocks[0].id,at:0}};const line=paragraph(tail);return {blocks:replace(blocks,i,{...b,text:head,blocks:[line,...b.blocks]}),caret:{id:line.id,at:0}};}
  const next:SpecBlock={id:specId(),kind:'toggle',text:tail,blocks:[paragraph()]};return {blocks:replace(blocks,i,{...b,text:head},next),caret:{id:next.id,at:0}};
 }
 if(!b.text&&isListBlock(b))return b.indent?{blocks:replace(blocks,i,{...b,indent:b.indent-1||undefined} as SpecBlock),caret:{id,at:0}}:turnLine(blocks,id,'paragraph');
 if(!b.text&&b.kind==='quote')return turnLine(blocks,id,'paragraph');
 if(blocks.length>=SPEC_LIMITS.blocks)return {blocks,caret:{id,at:start}};
 const head=b.text.slice(0,start),tail=b.text.slice(end),next:SpecBlock=isListBlock(b)?{...b,id:specId(),text:tail,...(b.kind==='todo'?{checked:false}:{})} as SpecBlock:{id:specId(),kind:'paragraph',text:tail};
 return {blocks:[...blocks.slice(0,i),{...b,text:head},next,...blocks.slice(i+1)],caret:{id:next.id,at:0}};
}
const previous=(blocks:SpecBlock[],i:number):SpecCaret|undefined=>{for(let k=Math.min(i-1,blocks.length-1);k>=0;k--)if(isTextBlock(blocks[k]))return {id:blocks[k].id,at:'end'};return undefined;};
/** Takes blocks out wherever they sit. A toggle goes with everything it holds. */
export const dropBlocks=(blocks:SpecBlock[],ids:ReadonlySet<string>):SpecBlock[]=>blocks.filter(b=>!ids.has(b.id)).map(b=>b.kind==='toggle'?{...b,blocks:dropBlocks(b.blocks,ids)}:b);
/** Backspace at the start: a styled line becomes plain first, and a plain line joins the one above it on the page. */
export function backspaceBlock(blocks:SpecBlock[],id:string):SpecEdit{
 const b=findBlock(blocks,id);if(!b||!isTextBlock(b))return {blocks};
 if(isListBlock(b)&&b.indent)return inside(blocks,id,list=>({blocks:replace(list,at(list,id),{...b,indent:b.indent!-1||undefined} as SpecBlock),caret:{id,at:0}}));
 if(b.kind!=='paragraph'){const out=turnInto(blocks,id,'paragraph');return {...out,caret:{id,at:0}};}
 const rows=specRows(blocks),here=rows.findIndex(r=>r.block.id===id),above=rows[here-1]?.block;if(!above)return {blocks,caret:{id,at:0}};
 if(!isTextBlock(above)){const list=settle(dropBlocks(blocks,new Set(b.text?[above.id]:[above.id,id])));if(b.text)return {blocks:list,caret:{id,at:0}};const near=rows.slice(0,here-1).reverse().find(r=>isTextBlock(r.block));return {blocks:list,caret:near?{id:near.block.id,at:'end'}:undefined};}
 return {blocks:settle(setText(dropBlocks(blocks,new Set([id])),above.id,above.text+b.text)),caret:{id:above.id,at:above.text.length}};
}
/** Delete at the end: the next line's words join this one. */
export function deleteForward(blocks:SpecBlock[],id:string):SpecEdit{
 const b=findBlock(blocks,id);if(!b||!isTextBlock(b))return {blocks};const rows=specRows(blocks),below=rows[rows.findIndex(r=>r.block.id===id)+1]?.block;if(!below)return {blocks};
 if(!isTextBlock(below))return {blocks:settle(dropBlocks(blocks,new Set([below.id]))),caret:{id,at:'end'}};
 const opened=below.kind==='toggle'?turnInto(blocks,below.id,'paragraph').blocks:blocks;
 return {blocks:settle(setText(dropBlocks(opened,new Set([below.id])),id,b.text+below.text)),caret:{id,at:b.text.length}};
}
export const removeBlock=(blocks:SpecBlock[],id:string)=>inside(blocks,id,list=>removeLine(list,id));
function removeLine(blocks:SpecBlock[],id:string):SpecEdit{
 const i=at(blocks,id);if(i<0)return {blocks};const list=replace(blocks,i);if(!list.length){const line=paragraph();return {blocks:[line],caret:{id:line.id,at:0}};}const near=previous(list,i)??list.find(isTextBlock);return {blocks:list,caret:near?{id:near.id,at:near.id===previous(list,i)?.id?'end':0}:undefined};
}
const freshIds=(b:SpecBlock):SpecBlock=>({...b,id:specId(),...(b.kind==='toggle'?{blocks:b.blocks.map(freshIds)}:{})});
export const duplicateBlock=(blocks:SpecBlock[],id:string)=>inside(blocks,id,list=>{const i=at(list,id);if(i<0)return {blocks:list};const copy=freshIds(structuredClone(list[i]));return {blocks:[...list.slice(0,i+1),copy,...list.slice(i+1)],caret:isTextBlock(copy)?{id:copy.id,at:'end'}:undefined};});
/** index counts positions in the list as it stands, before the block lifts out. */
export const moveBlockTo=(blocks:SpecBlock[],id:string,index:number)=>inside(blocks,id,list=>{const i=at(list,id);if(i<0)return {blocks:list};const rest=replace(list,i),to=Math.max(0,Math.min(rest.length,index>i?index-1:index));return {blocks:[...rest.slice(0,to),list[i],...rest.slice(to)]};}).blocks;
export type SpecPlace='before'|'after'|'first'|'last';
/** Moves a block next to another, or into a toggle, which opens so the block stays in view. Moving a toggle into itself changes nothing. */
export function moveBlockBeside(blocks:SpecBlock[],id:string,anchor:string,where:SpecPlace):SpecBlock[]{
 const moved=findBlock(blocks,id);if(!moved||id===anchor||allBlocks([moved]).some(b=>b.id===anchor)||!findBlock(blocks,anchor))return blocks;
 const put=(list:SpecBlock[]):SpecBlock[]=>list.flatMap(b=>{if(b.id===anchor&&where==='before')return [moved,b];if(b.id===anchor&&where==='after')return [b,moved];if(b.id===anchor&&b.kind==='toggle'){const kept=b.blocks.every(blank)?[]:b.blocks;return [{...b,open:true,blocks:where==='first'?[moved,...kept]:[...kept,moved]}];}return b.kind==='toggle'?[{...b,blocks:put(b.blocks)}]:[b];}),next=settle(put(dropBlocks(blocks,new Set([id]))));
 return fits(next)?next:blocks;
}
/** Shift-Command-Up and Down go through an open toggle and step out of the end of one. */
export function moveBlockStep(blocks:SpecBlock[],id:string,up:boolean):SpecBlock[]{
 const list=holder(blocks,id);if(!list)return blocks;const i=at(list,id),near=list[i+(up?-1:1)];if(!near){const owner=ownerOf(blocks,id);return owner?moveBlockBeside(blocks,id,owner.id,up?'before':'after'):blocks;}
 return near.kind==='toggle'&&near.open?moveBlockBeside(blocks,id,near.id,up?'last':'first'):moveBlockBeside(blocks,id,near.id,up?'before':'after');
}
/** Where a drag lands: `index` is the gap between visible rows and `depth` how far right the pointer is, which decides between the end of a toggle and the line after it. */
export function dropPlace(blocks:SpecBlock[],index:number,depth:number):{anchor:string;where:SpecPlace}|undefined{
 const rows=specRows(blocks),below=rows[index],above=rows[index-1];if(!above)return below&&{anchor:below.block.id,where:'before'};if(below&&below.depth>above.depth)return {anchor:above.block.id,where:'first'};
 const wanted=Math.max(below?.depth??0,Math.min(above.depth,depth));if(below&&wanted===below.depth)return {anchor:below.block.id,where:'before'};
 for(let i=index-1;i>=0;i--)if(rows[i].depth===wanted)return {anchor:rows[i].block.id,where:'after'};return undefined;
}
/** Tab goes into a toggle right above the line, and Shift-Tab back out of one, once a list item has no indent left to change. */
export function indentBlock(blocks:SpecBlock[],id:string,delta:number):SpecBlock[]{
 const list=holder(blocks,id);if(!list)return blocks;const i=at(list,id),next=indentLine(list,id,delta);if(next!==list)return swapList(blocks,list,next);const above=list[i-1],owner=ownerOf(blocks,id);if(delta>0)return above?.kind==='toggle'?moveBlockBeside(blocks,id,above.id,'last'):blocks;return owner?moveBlockBeside(blocks,id,owner.id,'after'):blocks;
}
function indentLine(blocks:SpecBlock[],id:string,delta:number):SpecBlock[]{
 const i=at(blocks,id),b=blocks[i];if(!b||!isListBlock(b))return blocks;const above=blocks[i-1],limit=above&&isListBlock(above)?Math.min(SPEC_LIMITS.indent,(above.indent??0)+1):0,value=Math.max(0,Math.min(limit,(b.indent??0)+delta));
 if(value===(b.indent??0))return blocks;const {indent:_,...rest}=b;return replace(blocks,i,(value?{...rest,indent:value}:rest) as SpecBlock);
}
/** Puts blocks after a line, or at the top of a toggle that is open, which is where the next line on the page is. */
export function insertAfter(blocks:SpecBlock[],id:string,...made:SpecBlock[]):SpecBlock[]{const b=findBlock(blocks,id);if(b?.kind==='toggle'&&b.open){const next=mapBlocks(blocks,v=>v.id===id&&v.kind==='toggle'?{...v,blocks:[...made,...v.blocks]}:v);return fits(next)?next:blocks;}return inside(blocks,id,list=>{const i=at(list,id);return {blocks:[...list.slice(0,i+1),...made,...list.slice(i+1)]};}).blocks;}
/** The blocks a selection covers, once each: a toggle brings what it holds. */
export const pickBlocks=(blocks:SpecBlock[],ids:ReadonlySet<string>):SpecBlock[]=>blocks.flatMap(b=>ids.has(b.id)?[b]:b.kind==='toggle'?pickBlocks(b.blocks,ids):[]);
export function toggleOpen(blocks:SpecBlock[],id:string):SpecBlock[]{return mapBlocks(blocks,b=>{if(b.id!==id||b.kind!=='toggle')return b;const {open,...rest}=b;return open?rest:{...rest,open:true};});}
export function toggleTodo(blocks:SpecBlock[],id:string):SpecBlock[]{return mapBlocks(blocks,b=>b.id===id&&b.kind==='todo'?{...b,checked:!b.checked}:b);}
export function setCell(blocks:SpecBlock[],id:string,row:number,column:number,text:string):SpecBlock[]{return mapBlocks(blocks,b=>b.id===id&&b.kind==='table'?{...b,rows:b.rows.map((r,y)=>y===row?r.map((c,x)=>x===column?text:c):r)}:b);}
export function addRow(blocks:SpecBlock[],id:string):SpecBlock[]{return mapBlocks(blocks,b=>b.id===id&&b.kind==='table'&&b.rows.length<SPEC_LIMITS.rows?{...b,rows:[...b.rows,b.rows[0].map(()=>'')]}:b);}
export function addColumn(blocks:SpecBlock[],id:string):SpecBlock[]{return mapBlocks(blocks,b=>b.id===id&&b.kind==='table'&&b.rows[0].length<SPEC_LIMITS.columns?{...b,rows:b.rows.map(r=>[...r,''])}:b);}
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
 {id:'toggle',label:'Toggle',hint:'',words:'collapse collapsible details disclosure accordion expand fold',kind:'toggle'},
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
