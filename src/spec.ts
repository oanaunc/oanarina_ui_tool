import type {TextRun} from './rich-text';
/** A spec is one layer holding a page of blocks. The blocks are the document; what the canvas paints is derived from them. */
export type SpecBlock={id:string}&({kind:'paragraph';text:string}|{kind:'heading';level:number;text:string}|{kind:'bullet'|'number';text:string;indent?:number}|{kind:'todo';text:string;checked:boolean;indent?:number}|{kind:'quote';text:string}|{kind:'code';text:string;language?:string}|{kind:'divider'}|{kind:'table';rows:string[][]}|{kind:'image';src:string;width:number;height:number}|{kind:'frame';nodeId:string;pageId?:string;name?:string});
export type SpecBlockKind=SpecBlock['kind'];
export type SpecTextBlock=Extract<SpecBlock,{text:string}>;
export type SpecListBlock=Extract<SpecBlock,{kind:'bullet'|'number'|'todo'}>;
export interface SpecDocument {version:1;blocks:SpecBlock[];}
export const SPEC_LIMITS={blocks:4000,characters:1_000_000,indent:6,rows:200,columns:30,imageBytes:20_000_000};
export const specId=()=>crypto.randomUUID();
export const specBlock=(block:Omit<SpecBlock,'id'>|{kind:SpecBlockKind;[key:string]:unknown}):SpecBlock=>({id:specId(),...block}) as SpecBlock;
export const paragraph=(text=''):SpecBlock=>({id:specId(),kind:'paragraph',text});
export const blankSpec=():SpecDocument=>({version:1,blocks:[{id:specId(),kind:'heading',level:1,text:''},paragraph()]});
export const isTextBlock=(block:SpecBlock):block is SpecTextBlock=>'text' in block;
export const isListBlock=(block:SpecBlock):block is SpecListBlock=>block.kind==='bullet'||block.kind==='number'||block.kind==='todo';
const IMAGE=/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]*$/;
const fail=(detail:string):never=>{throw Error('Invalid spec: '+detail+'.');};
const keys=(block:Record<string,unknown>,allowed:string[])=>{for(const key of Object.keys(block))if(!allowed.includes(key))fail('unknown block field '+key.slice(0,40));};
const text=(value:unknown)=>{if(typeof value!=='string')fail('block text must be a string');return (value as string).length;};
const indent=(value:unknown)=>{if(value!==undefined&&(!Number.isInteger(value)||(value as number)<0||(value as number)>SPEC_LIMITS.indent))fail('list indent out of range');};
export function validateSpec(value:unknown):asserts value is SpecDocument{
 const spec=value as SpecDocument;if(!spec||typeof spec!=='object'||spec.version!==1||!Array.isArray(spec.blocks))fail('it needs version 1 and a block list');if(spec.blocks.length>SPEC_LIMITS.blocks)fail('too many blocks');for(const key of Object.keys(spec))if(key!=='version'&&key!=='blocks')fail('unknown field '+key.slice(0,40));
 const ids=new Set<string>();let size=0;
 for(const raw of spec.blocks as (SpecBlock&Record<string,unknown>)[]){
  if(!raw||typeof raw!=='object'||typeof raw.id!=='string'||!raw.id||raw.id.length>64||ids.has(raw.id))fail('every block needs its own id');ids.add(raw.id);
  switch(raw.kind){
   case 'paragraph':keys(raw,['id','kind','text']);size+=text(raw.text);break;
   case 'heading':keys(raw,['id','kind','level','text']);if(!Number.isInteger(raw.level)||raw.level<1||raw.level>6)fail('heading level out of range');size+=text(raw.text);break;
   case 'bullet':case 'number':keys(raw,['id','kind','text','indent']);indent(raw.indent);size+=text(raw.text);break;
   case 'todo':keys(raw,['id','kind','text','checked','indent']);indent(raw.indent);if(typeof raw.checked!=='boolean')fail('a to-do needs a checked state');size+=text(raw.text);break;
   case 'quote':keys(raw,['id','kind','text']);size+=text(raw.text);break;
   case 'code':keys(raw,['id','kind','text','language']);if(raw.language!==undefined&&(typeof raw.language!=='string'||raw.language.length>40))fail('code language is invalid');size+=text(raw.text);break;
   case 'divider':keys(raw,['id','kind']);break;
   case 'table':keys(raw,['id','kind','rows']);if(!Array.isArray(raw.rows)||!raw.rows.length||raw.rows.length>SPEC_LIMITS.rows)fail('a table needs between 1 and 200 rows');for(const row of raw.rows){if(!Array.isArray(row)||!row.length||row.length>SPEC_LIMITS.columns)fail('a table row needs between 1 and 30 cells');for(const cell of row)size+=text(cell);}break;
   case 'image':keys(raw,['id','kind','src','width','height']);if(typeof raw.src!=='string'||raw.src.length>SPEC_LIMITS.imageBytes*1.4||raw.src&&!IMAGE.test(raw.src))fail('only embedded images are supported');for(const v of [raw.width,raw.height])if(!Number.isFinite(v)||v<0||v>1e5)fail('image size out of range');break;
   case 'frame':keys(raw,['id','kind','nodeId','pageId','name']);for(const v of [raw.nodeId,raw.pageId,raw.name])if(v!==undefined&&(typeof v!=='string'||v.length>512))fail('frame reference is invalid');break;
   default:fail('unknown block kind');
  }
  if(size>SPEC_LIMITS.characters)fail('it holds too much text');
 }
}
/** Older builds have no spec layer; the file format itself is unchanged. */
export function validateDocumentSpecs(d:{pages:{nodes:{type:string;spec?:unknown}[]}[]}){for(const page of d.pages)for(const n of page.nodes){if(n.type==='spec')validateSpec(n.spec);else if(n.spec!==undefined)fail('only spec layers hold blocks');}}
/** Inline marks stay literal markdown in the block, as real spec pages store them, and are shown as formatting. */
const MARKS=/\*\*(.+?)\*\*|(?<![\w*])\*(?!\s)(.+?)\*(?![\w*])|(?<!\w)_(?!\s)(.+?)_(?!\w)|~~(.+?)~~|`(.+?)`|\[([^\]\n]+)\]\((https?:[^)\s]+)\)/g;
export function specInlineMarks(source:string,mono:string):{text:string;runs:TextRun[]}{
 const runs:TextRun[]=[];let text='',at=0;
 for(const m of source.matchAll(MARKS)){text+=source.slice(at,m.index);at=m.index+m[0].length;const inner=m[1]??m[2]??m[3]??m[4]??m[5]??m[6],start=text.length;text+=inner;const end=text.length;if(m[1]!==undefined)runs.push({start,end,fontWeight:700});else if(m[2]!==undefined||m[3]!==undefined)runs.push({start,end,fontStyle:'italic'});else if(m[4]!==undefined)runs.push({start,end,decorations:['line-through']});else if(m[5]!==undefined)runs.push({start,end,fontFamily:mono});else runs.push({start,end,hyperlink:m[7],decorations:['underline']});}
 return {text:text+source.slice(at),runs};
}
export const FRAME_LINK=/^\[([^\]\n]*)\]\(forma:\/\/layer\/([^)\s]+)\)$/;
export const IMAGE_LINK=/^!\[[^\]\n]*\]\((forma:\/\/image\/[^)\s]+|data:image\/[^)\s]+)\)$/;
const pad=(level=0)=>'  '.repeat(level);
const cell=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\|/g,'\\|').replace(/\n/g,' ');
/** Plain markdown an agent or a person can read. Frames and images keep a forma:// reference so a round trip can find them again. */
export function specMarkdown(blocks:SpecBlock[],options:{images?:boolean}={}){
 const out:string[]=[];let counter:number[]=[];
 const push=(line:string,tight:boolean)=>{if(out.length&&!tight)out.push('');out.push(line);};
 blocks.forEach((b,i)=>{const prev=blocks[i-1],tight=!!prev&&isListBlock(prev)&&isListBlock(b);
  if(b.kind!=='number')counter=b.kind==='bullet'||b.kind==='todo'?counter:[];
  switch(b.kind){
   case 'paragraph':if(b.text)push(b.text,false);break;
   case 'heading':push('#'.repeat(b.level)+' '+b.text,false);break;
   case 'bullet':push(pad(b.indent)+'- '+b.text,tight);break;
   case 'number':{const level=b.indent??0;counter=counter.slice(0,level+1);counter[level]=(counter[level]??0)+1;push(pad(level)+counter[level]+'. '+b.text,tight);break;}
   case 'todo':push(pad(b.indent)+'- ['+(b.checked?'x':' ')+'] '+b.text,tight);break;
   case 'quote':push(b.text.split('\n').map(line=>'> '+line).join('\n'),false);break;
   case 'code':push('```'+(b.language??'')+'\n'+b.text+'\n```',false);break;
   case 'divider':push('---',false);break;
   case 'table':{const width=Math.max(...b.rows.map(r=>r.length)),row=(cells:string[])=>'| '+Array.from({length:width},(_,c)=>cell(cells[c]??'')).join(' | ')+' |';push([row(b.rows[0]),'| '+Array(width).fill('---').join(' | ')+' |',...b.rows.slice(1).map(row)].join('\n'),false);break;}
   case 'image':push(`![Image](${options.images?b.src:'forma://image/'+b.id})`,false);break;
   case 'frame':push(`[${(b.name??'Frame').replace(/[\[\]]/g,'')}](forma://layer/${b.nodeId})`,false);break;
  }
 });
 return out.join('\n');
}
const tableRow=(line:string)=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(v=>v.trim().replace(/\\\|/g,'|').replace(/\\\\/g,'\\'));
/** Reads markdown into blocks, one block per line of ordinary text. Passing the current blocks keeps the images and frames a round trip refers to. */
export function markdownBlocks(source:string,existing:SpecBlock[]=[]):SpecBlock[]{
 const lines=source.replace(/\r\n?/g,'\n').split('\n'),out:SpecBlock[]=[];let i=0;
 const put=(block:Record<string,unknown>)=>{if(out.length>=SPEC_LIMITS.blocks)fail('too many blocks');out.push({id:specId(),...block} as SpecBlock);};
 while(i<lines.length){
  const line=lines[i],trim=line.trim();let m:RegExpExecArray|null;
  if(!trim){i++;continue;}
  if((m=/^```\s*([\w+-]{0,40})\s*$/.exec(trim))){const body:string[]=[];i++;while(i<lines.length&&!/^```\s*$/.test(lines[i].trim()))body.push(lines[i++]);i++;put({kind:'code',text:body.join('\n'),...(m[1]?{language:m[1]}:{})});continue;}
  if((m=/^(#{1,6})\s+(.*)$/.exec(trim))){put({kind:'heading',level:m[1].length,text:m[2].trim()});i++;continue;}
  if(/^(-{3,}|\*{3,}|_{3,})$/.test(trim)){put({kind:'divider'});i++;continue;}
  if(trim.startsWith('>')){const body:string[]=[];while(i<lines.length&&lines[i].trim().startsWith('>'))body.push(lines[i++].trim().replace(/^>\s?/,''));put({kind:'quote',text:body.join('\n')});continue;}
  if(trim.startsWith('|')&&i+1<lines.length&&/^\|?[\s:|-]+\|?$/.test(lines[i+1].trim())&&lines[i+1].includes('-')){const rows=[tableRow(trim)];i+=2;while(i<lines.length&&lines[i].trim().startsWith('|'))rows.push(tableRow(lines[i++]));put({kind:'table',rows:rows.slice(0,SPEC_LIMITS.rows).map(r=>r.slice(0,SPEC_LIMITS.columns))});continue;}
  const lead=/^[ \t]*/.exec(line)![0].replace(/\t/g,'  ').length,level=Math.min(SPEC_LIMITS.indent,Math.floor(lead/2)),depth=level?{indent:level}:{};
  if((m=/^[-*+]\s+\[([ xX]?)\]\s*(.*)$/.exec(trim))){put({kind:'todo',text:m[2],checked:/x/i.test(m[1]),...depth});i++;continue;}
  if((m=/^[-*+]\s+(.*)$/.exec(trim))){put({kind:'bullet',text:m[1],...depth});i++;continue;}
  if((m=/^\d{1,9}[.)]\s+(.*)$/.exec(trim))){put({kind:'number',text:m[1],...depth});i++;continue;}
  if((m=IMAGE_LINK.exec(trim))){const ref=m[1],kept=ref.startsWith('forma:')?existing.find(b=>b.kind==='image'&&b.id===ref.slice('forma://image/'.length)):undefined;if(kept)out.push(structuredClone(kept));else if(ref.startsWith('data:'))put({kind:'image',src:ref,width:0,height:0});else fail('an image reference points at no block');i++;continue;}
  if((m=FRAME_LINK.exec(trim))){const id=m[2],kept=existing.find(b=>b.kind==='frame'&&b.nodeId===id);put(kept?{...structuredClone(kept),id:specId()}:{kind:'frame',nodeId:id,name:m[1]});i++;continue;}
  put({kind:'paragraph',text:line.trimEnd()});i++;
 }
 return out.length?out:[paragraph()];
}
