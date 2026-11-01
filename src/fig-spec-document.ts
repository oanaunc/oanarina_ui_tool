import type {FigDocumentBlock,FigDocumentContent} from './fig-document';
import {paragraph,specInlineMarks} from './spec';
import type {SpecBlock} from './spec';
import type {Raw} from './fig-values';
/** A spec page as real files store it: a DOCUMENT block whose child blocks each name their kind in specBlockType and keep their words in specBlockContent. */
const LIMIT={ops:200_000,characters:1_000_000,blocks:4000,depth:32};
const object=(v:unknown)=>(v&&typeof v==='object'&&!Array.isArray(v)?v:{}) as Raw;
const list=(v:unknown)=>(Array.isArray(v)?v:[]) as Raw[];
const span=(v:unknown)=>{const r=object(v),start=r.startIndex,end=r.endIndexExclusive;return Number.isInteger(start)&&Number.isInteger(end)&&(start as number)>=0&&(end as number)>=(start as number)?{start:start as number,end:end as number}:undefined;};
/** Ranges count UTF-16 units or whole characters; an insert's own length shows which, and a file that fits neither is not guessed at. */
function apply(atoms:string[],ops:{type:unknown;range:{start:number;end:number};content?:string}[],split:(text:string)=>string[]):string|undefined{for(const op of ops){if(op.type==='INSERT'){const added=split(op.content??'');if(op.range.start>atoms.length||added.length!==op.range.end-op.range.start)return;atoms.splice(op.range.start,0,...added);}else if(op.type==='DELETE'){if(op.range.end>atoms.length)return;atoms.splice(op.range.start,op.range.end-op.range.start);}else return;if(atoms.length>LIMIT.characters)return;}return atoms.join('');}
/** The block's text: its resolved snapshot when stored, otherwise its edit history replayed in order. Undefined means the history could not be proven. */
export function collaborativeText(value:unknown):string|undefined{
 const c=object(value);if(typeof c.snapshotText==='string'&&c.snapshotText)return c.snapshotText;
 const history=list(c.historyOpsWithLoc),pending=list(c.changesToAppend),buffer=c.historyStringContentBuffer instanceof Uint8Array?c.historyStringContentBuffer:new Uint8Array();if(history.length+pending.length>LIMIT.ops)return;if(!history.length&&!pending.length)return '';
 const decoder=new TextDecoder('utf-8',{fatal:true}),ops:{type:unknown;range:{start:number;end:number};content?:string}[]=[];
 try{for(const raw of history){const range=span(raw.rebasedRange??raw.range);if(!range)return;if(raw.type==='DELETE'){ops.push({type:raw.type,range});continue;}const bytes=span(raw.contentBytesInBuffer);if(!bytes||bytes.end>buffer.length||raw.rangeShouldBeIteratedInReverse===true)return;ops.push({type:raw.type,range,content:decoder.decode(buffer.subarray(bytes.start,bytes.end))});}}catch{return;}
 for(const raw of pending){const range=span(raw.rebasedRange??raw.range);if(!range||raw.type==='INSERT'&&typeof raw.content!=='string')return;ops.push({type:raw.type,range,content:raw.content as string|undefined});}
 return apply([],ops,text=>text.split(''))??apply([],ops,text=>[...text]);
}
export const figInlineMarks=specInlineMarks;
const headingLevel=(type:string)=>Number(/^HEADING_([1-6])$/.exec(type)?.[1]??0);
const depth=(indent:number|undefined)=>{const value=Math.min(6,Math.max(0,indent??0));return value?{indent:value}:{};};
/** The page as Spec layer blocks. Images and embedded canvases resolve through the caller, which owns the file's assets and layers. */
export function figSpecBlocks(content:FigDocumentContent,image:(hash:string)=>{src:string;width:number;height:number},canvas:(block:Extract<FigDocumentBlock,{kind:'canvas'}>)=>{nodeId:string;pageId?:string;name?:string}):SpecBlock[]{
 const out:SpecBlock[]=[],id=()=>crypto.randomUUID();
 for(const b of content.blocks)switch(b.kind){
  case 'heading':out.push({id:id(),kind:'heading',level:b.level,text:b.text});break;
  case 'paragraph':out.push({id:id(),kind:'paragraph',text:b.text});break;
  case 'list':for(const text of b.items)out.push({id:id(),kind:b.ordered?'number':'bullet',text,...depth(b.indent)});break;
  case 'todo':out.push({id:id(),kind:'todo',text:b.text,checked:b.checked,...depth(b.indent)});break;
  case 'quote':out.push({id:id(),kind:'quote',text:b.text});break;
  case 'code':out.push({id:id(),kind:'code',text:b.text});break;
  case 'rule':out.push({id:id(),kind:'divider'});break;
  case 'spacer':out.push(paragraph());break;
  case 'table':{const width=Math.min(30,Math.max(1,...b.rows.map(r=>r.length)));out.push({id:id(),kind:'table',rows:b.rows.slice(0,200).map(r=>Array.from({length:width},(_,i)=>r[i]??''))});break;}
  case 'image':{const found=image(b.hash);out.push({id:id(),kind:'image',src:found.src,width:b.width||found.width,height:b.height||found.height});break;}
  case 'canvas':out.push({id:id(),kind:'frame',...canvas(b)});break;
 }
 return out.length?out:[paragraph()];
}
/** Reads a spec page in stored order. Undefined means some text could not be proven, so the caller keeps the stored preview instead of showing partial words. */
export function figSpecContent(root:Raw,kids:(block:Raw)=>Raw[]):FigDocumentContent|undefined{
 const blocks:FigDocumentBlock[]=[];let omitted=0,size=0,failed=false,seen=0;
 const words=(block:Raw)=>{const text=collaborativeText(block.specBlockContent);if(text===undefined){failed=true;return '';}size+=text.length;if(size>LIMIT.characters)failed=true;return text;};
 const nested=(block:Raw,depth:number):string=>depth>LIMIT.depth?'':[words(block),...kids(block).map(k=>nested(k,depth+1))].filter(Boolean).join('\n');
 const add=(block:FigDocumentBlock)=>{const last=blocks.at(-1);if(block.kind==='list'&&last?.kind==='list'&&last.ordered===block.ordered&&(last.indent??0)===(block.indent??0))last.items.push(...block.items);else blocks.push(block);};
 const visit=(block:Raw,indent:number,depth:number)=>{
  if(depth>LIMIT.depth||++seen>LIMIT.blocks){failed=true;return;}
  const type=String(block.specBlockType??'DEFAULT'),level=headingLevel(type);
  if(type==='TABLE'){const rows=kids(block).map(row=>kids(row).map(cell=>nested(cell,depth+1)));if(rows.length)add({kind:'table',rows});return;}
  if(type==='HORIZONTAL_RULE'){add({kind:'rule'});return;}
  if(type==='IMAGE'){const hash=block.specImageHash;if(typeof hash==='string'&&/^[\da-f]{40}$/i.test(hash))add({kind:'image',hash:hash.toLowerCase(),width:Number(block.specWidth)||0,height:Number(block.specHeight)||0});else omitted++;return;}
  if(type==='EMBED'||type==='VIDEO'){const url=block.specEmbedUrl;if(typeof url==='string'&&/^https?:\/\//i.test(url))add({kind:'paragraph',text:`[${url}](${url})`});else omitted++;return;}
  if(type==='EMBEDDED_CANVAS'){const layers=kids(block).filter(k=>k.type!=='SPEC_BLOCK');if(!layers.length)omitted++;blocks.push({kind:'canvas',width:Number(block.specWidth)||0,height:Number(block.specHeight)||0,layers});return;}
  const text=words(block);
  if(type==='CODE_BLOCK')add({kind:'code',text});
  else if(type==='BLOCK_QUOTE'){if(text)add({kind:'quote',text});}
  else if(level){if(text.trim())add({kind:'heading',level,text:text.trim()});}
  else if(type==='ORDERED_LIST_ITEM'||type==='UNORDERED_LIST_ITEM')add({kind:'list',ordered:type==='ORDERED_LIST_ITEM',items:[text],indent:indent+Number(block.specBlockIndentLevel||0)});
  else if(type==='TODO_LIST_ITEM_CHECKED'||type==='TODO_LIST_ITEM_UNCHECKED')add({kind:'todo',text,checked:type==='TODO_LIST_ITEM_CHECKED',indent:indent+Number(block.specBlockIndentLevel||0)});
  else if(type!=='DOCUMENT')for(const line of text.split('\n'))add(line.trim()?{kind:'paragraph',text:line}:{kind:'spacer'});
  for(const child of kids(block))visit(child,type==='DOCUMENT'?indent:indent+1,depth+1);
 };
 visit(root,0,0);
 while(blocks.at(-1)?.kind==='spacer')blocks.pop();while(blocks[0]?.kind==='spacer')blocks.shift();
 return failed?undefined:{blocks,source:'spec',omitted};
}
