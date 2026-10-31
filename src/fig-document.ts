import {gunzipSync,unzlibSync} from 'fflate';
import {readCrdtDocument} from './fig-document-crdt';
import type {Raw} from './fig-values';
/** A spec block is a page of text in a design file. Its storage is not public, so this reads what it can prove, in order of trust:
 * the node's own text data, then any structured blocks under any field name, then text inside byte fields. Every field name
 * beyond textData is an assumption, which is why matching is by shape, and a miss falls back to the block's preview image. */
export type FigDocumentBlock={kind:'heading';level:number;text:string}|{kind:'paragraph';text:string}|{kind:'list';ordered:boolean;items:string[]};
export type FigDocumentSource='text-data'|'structured'|'crdt'|'recovered';
export interface FigDocumentContent {blocks:FigDocumentBlock[];source:FigDocumentSource;}
const LIMIT={values:200_000,depth:64,characters:1_000_000,blocks:2000,bytes:20_000_000,inflated:50_000_000,runs:500};
/** Appearance and identity, never the document's words. */
const SKIPPED=/^(name|guid|parentIndex|phase|type)$|paint|geometry|snapshot|transform|plugin|export|effect|stroke|fill|prototype|interaction|reaction|override|symbol|layout|stack|constraint|variable|annotation|measure|font|style(id|override)|size|radius|opacity|blendmode|guides?$|grid/i;
const LABELS=['type','blockType','kind','nodeType','tag','__tag','__type','nodeName','lineType','style','textStyle','listType','__listType'];
const INLINE=['content','children','runs','spans','segments','textRuns','inlines','items','blocks','nodes','lines'];
const letters=(text:string)=>(text.match(/\p{L}/gu)??[]).length;
const label=(o:Raw)=>{for(const k of LABELS){const v=o[k];if(typeof v==='string'&&v)return v;}return '';};
const levelOf=(o:Raw,name:string)=>{const a=(o.attrs&&typeof o.attrs==='object'?o.attrs:{}) as Raw,raw=o.level??a.level??o.headingLevel??a.headingLevel,digit=/([1-6])/.exec(name);const value=typeof raw==='number'?raw:digit?Number(digit[1]):/subtitle/i.test(name)?2:1;return Math.max(1,Math.min(6,value));};
function inlineText(value:unknown,depth=0):string{if(depth>LIMIT.depth)return '';if(typeof value==='string')return value;if(Array.isArray(value))return value.map(v=>inlineText(v,depth+1)).join('');if(!value||typeof value!=='object')return '';const o=value as Raw;for(const k of ['text','characters','plainText','value'])if(typeof o[k]==='string')return o[k] as string;for(const k of INLINE)if(o[k]!==undefined)return inlineText(o[k],depth+1);return '';}
class Collector {
 blocks:FigDocumentBlock[]=[];size=0;seen=0;
 add(block:FigDocumentBlock){this.size+=block.kind==='list'?block.items.join('').length:block.text.length;if(this.size>LIMIT.characters||this.blocks.length>=LIMIT.blocks)return;const last=this.blocks.at(-1);if(block.kind==='list'&&last?.kind==='list'&&last.ordered===block.ordered)last.items.push(...block.items);else this.blocks.push(block);}
 text(raw:string){const lines=raw.split(/\r\n|\r|\n|\u2028|\u2029/);for(const line of lines){const text=line.trim();if(!text)continue;const hash=/^(#{1,6})\s+(.+)$/.exec(text),bullet=/^[-*•◦]\s+(.+)$/.exec(text),numbered=/^\d{1,4}[.)]\s+(.+)$/.exec(text);if(hash)this.add({kind:'heading',level:hash[1].length,text:hash[2]});else if(bullet)this.add({kind:'list',ordered:false,items:[bullet[1]]});else if(numbered)this.add({kind:'list',ordered:true,items:[numbered[1]]});else this.add({kind:'paragraph',text});}}
 /** Reading order is the order stored, unless every sibling carries a fractional position. */
 visit(value:unknown,depth=0,ordered?:boolean):void{
  if(depth>LIMIT.depth||++this.seen>LIMIT.values||value===null||typeof value!=='object'||value instanceof Uint8Array)return;
  if(Array.isArray(value)){const all=value.every(v=>typeof (v as Raw|null)?.position==='string')&&value.length>1?[...value].sort((a,b)=>String((a as Raw).position)<String((b as Raw).position)?-1:1):value;for(const v of all)this.visit(v,depth+1,ordered);return;}
  const o=value as Raw,name=label(o),text=()=>inlineText(o).trim();
  if(/^(h[1-6]|heading.*|title|subtitle|header[1-6]?)$/i.test(name)){const t=text();if(t)this.add({kind:'heading',level:levelOf(o,name),text:t});return;}
  if(/list.?item|^li$|^(un)?ordered_?list_?item$|^check/i.test(name)){const t=text();if(t)this.add({kind:'list',ordered:ordered??false,items:[t]});return;}
  if(/list$|^[ou]l$|^list/i.test(name)){const kind=[o.listType,o.__listType,o.__tag,(o.attrs as Raw|undefined)?.listType,name].map(String).join(' '),isOrdered=/(^|[^n])ordered|number|\bol\b/i.test(kind)&&!/unordered/i.test(kind);for(const k of INLINE)if(o[k]!==undefined)this.visit(o[k],depth+1,isOrdered);return;}
  if(/^(p|paragraph|body|plain|normal|quote|blockquote|callout|code|code_?block)$/i.test(name)){const t=text();if(t)this.add({kind:'paragraph',text:t});return;}
  const nested=INLINE.some(k=>Array.isArray(o[k])&&(o[k] as unknown[]).some(v=>v&&typeof v==='object'&&label(v as Raw)&&!/^text$/i.test(label(v as Raw))));
  if(!nested){const own=['text','characters','plainText'].map(k=>o[k]).find(v=>typeof v==='string');if(typeof own==='string'){if(letters(own))this.text(own);return;}}
  for(const [k,v] of Object.entries(o)){if(depth===0&&SKIPPED.test(k))continue;if(typeof v==='string'&&depth===0&&v.length>1&&/^\s*[[{]/.test(v)){try{this.visit(JSON.parse(v),depth+1);}catch{}continue;}this.visit(v,depth+1);}
 }
 result(source:FigDocumentSource):FigDocumentContent|undefined{const total=this.blocks.reduce((sum,b)=>sum+letters(b.kind==='list'?b.items.join(''):b.text),0);return total>=2?{blocks:this.blocks,source}:undefined;}
}
const headingLevel=(size:number,base:number)=>{const ratio=size/Math.max(1,base);return ratio>=1.6?1:ratio>=1.3?2:ratio>=1.1?3:0;};
/** The same fields a TEXT layer stores: characters, per-line list types and per-character style ids. */
function fromTextData(raw:Raw):FigDocumentContent|undefined{
 const data=(raw.textData??{}) as Raw,text=typeof data.characters==='string'?data.characters:'';if(!letters(text))return;const c=new Collector(),lines=text.split('\n'),kinds=Array.isArray(data.lines)?data.lines as Raw[]:[],ids=Array.isArray(data.characterStyleIDs)?data.characterStyleIDs as number[]:[],table=new Map((Array.isArray(data.styleOverrideTable)?data.styleOverrideTable as Raw[]:[]).map(s=>[s.styleID,s])),base=typeof raw.fontSize==='number'?raw.fontSize:16;let at=0;
 lines.forEach((line,i)=>{const type=String(kinds[i]?.lineType??''),size=table.get(ids[at])?.fontSize,value=line.trim();at+=line.length+1;if(!value)return;if(/UNORDERED/.test(type))c.add({kind:'list',ordered:false,items:[value]});else if(/ORDERED/.test(type))c.add({kind:'list',ordered:true,items:[value]});else{const level=typeof size==='number'?headingLevel(size,base):0;if(level)c.add({kind:'heading',level,text:value});else c.text(value);}});
 return c.result('text-data');
}
function inflated(bytes:Uint8Array):Uint8Array{try{if(bytes[0]===0x1f&&bytes[1]===0x8b)return gunzipSync(bytes);if(bytes[0]===0x78&&(bytes[0]*256+bytes[1])%31===0)return unzlibSync(bytes);}catch{}return bytes;}
function utf8(bytes:Uint8Array){try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return undefined;}}
/** Printable sentences in undecoded bytes: last resort, with no structure, and the report says so. */
function recoveredRuns(bytes:Uint8Array,c:Collector){const seen=new Set<string>();for(const match of new TextDecoder('utf-8').decode(bytes).matchAll(/[\p{L}\p{N}\p{P}\p{Zs}]{12,}/gu)){const text=match[0].trim();if(seen.size>=LIMIT.runs||seen.has(text)||!/\s/.test(text)||letters(text)<text.length*.6)continue;seen.add(text);c.add({kind:'paragraph',text});}}
function byteFields(raw:Raw,blob:(index:number)=>Uint8Array|undefined){const out:Uint8Array[]=[];let seen=0;const walk=(value:unknown,depth:number,key:string)=>{if(depth>16||++seen>LIMIT.values||SKIPPED.test(key)&&depth===0)return;if(value instanceof Uint8Array){if(value.length<=LIMIT.bytes)out.push(value);return;}if(typeof value==='number'&&/blob/i.test(key)){const b=Number.isInteger(value)?blob(value):undefined;if(b&&b.length<=LIMIT.bytes)out.push(b);return;}if(Array.isArray(value)){if(value.length>16&&value.every(v=>Number.isInteger(v)&&(v as number)>=0&&(v as number)<256)){if(value.length<=LIMIT.bytes)out.push(Uint8Array.from(value as number[]));return;}value.forEach(v=>walk(v,depth+1,key));return;}if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))walk(v,depth+1,k);};for(const [k,v] of Object.entries(raw))walk(v,0,k);return out;}
/** Undefined means no readable text was found, which is the only case that keeps the preview image. */
export function figDocumentContent(raw:Raw,blob:(index:number)=>Uint8Array|undefined):FigDocumentContent|undefined{
 const own=fromTextData(raw);if(own)return own;
 const structured=new Collector();structured.visit(raw);const found=structured.result('structured');if(found)return found;
 const plain=new Collector();for(const [k,v] of Object.entries(raw))if(typeof v==='string'&&!SKIPPED.test(k)&&/text|content|markdown|body|characters|document/i.test(k))plain.text(v);const words=plain.result('structured');if(words)return words;
 const fields=byteFields(raw,blob).map(inflated).filter(b=>b.length<=LIMIT.inflated);
 for(const bytes of fields){const text=utf8(bytes);if(text&&/^\s*[[{]/.test(text)){try{const c=new Collector();c.visit(JSON.parse(text),1);const out=c.result('structured');if(out)return out;}catch{}}const tree=readCrdtDocument(bytes);if(tree){const c=new Collector();c.visit(tree,1);const out=c.result('crdt');if(out)return out;}}
 const recovered=new Collector();for(const bytes of fields)recoveredRuns(bytes,recovered);return recovered.result('recovered');
}
export const figDocumentMessages:Record<FigDocumentSource,string>={
 'text-data':'Spec blocks became editable text, using their own stored text and line types.',
 structured:'Spec blocks became editable headings, paragraphs and lists, in stored reading order.',
 crdt:'Spec blocks became editable text read from their stored editing history. Compare with the hidden original preview.',
 recovered:'Text in these spec blocks was recovered without its structure, so headings, lists and order may differ. Compare with the hidden original preview.',
};
