import {strongBidiClass} from './text-direction';
import type {TextDirection} from './text-direction';
export function validateHangingQuotes(value:unknown){if(value!==undefined&&typeof value!=='boolean')throw Error('Hanging quotation marks must be a boolean.');}
const opening=new Set(['"',"'",'“','‘','«','‹']),closing=new Set(['"',"'",'”','’','»','›']);
/** Hanging punctuation adds the marks that read as lighter than the text beside them. */
const leading=new Set([...opening,'„','‚','(','[','{','¿','¡','•','-','‐','‑','–','—']),trailing=new Set([...closing,'.',',',':',';','!','?','…','-','‐','‑','–','—',')',']','}','、','。','，','．']);
// An explicit bidi control can carry an edge character away from its line edge, so a line holding one, and any line after it, keeps ordinary placement.
const controls=/[\u200e\u200f\u061c\u202a-\u202e\u2066-\u2069]/u;
export interface HangingMode {punctuation?:boolean;bodyStart?:number;}
export function quoteParagraph(text:string,enabled:boolean|undefined,direction:TextDirection,align:string,punctuation?:boolean){if(enabled!==true&&punctuation!==true||direction==='auto'||!['left','right','center','justify'].includes(align))return {active:false,text};const trimmed=text.trimEnd(),last=trimmed.at(-1)??'';return {active:true,text:(punctuation?trailing:closing).has(last)?trimmed:text};}
/** Inside a paragraph a soft line can reorder its ends, so a line with text running the other way hangs only at the paragraph's own edges. */
const runsAgainst=(line:string,direction:'ltr'|'rtl')=>{for(const c of line){const kind=strongBidiClass(c);if(kind&&(kind==='L')!==(direction==='ltr'))return true;}return false;};
/** Hang contextual advances at line edges. Quotes alone hang at the paragraph's two ends; punctuation hangs at the end of every line. A neutral at a paragraph edge sits on that edge in either direction, so RTL mirrors the sides. */
export function quoteOverhang(text:string,from:number,to:number,active:boolean,measure:(from:number,to:number)=>number,direction:'ltr'|'rtl'='ltr',mode:HangingMode={}){if(!active||from>=to||controls.test(text.slice(0,to)))return {hangLeft:0,hangRight:0};const body=mode.bodyStart??0,inner=mode.punctuation&&!runsAgainst(text.slice(from,to),direction),starts=from===body?(mode.punctuation?leading:opening).has(text[from]):!!inner&&from>body&&leading.has(text[from]),ends=to===text.length?(mode.punctuation?trailing:closing).has(text[to-1]):!!inner&&trailing.has(text[to-1]),width=starts||ends?measure(from,to):0,hangLeft=starts?Math.max(0,width-measure(from+1,to)):0,hangRight=ends&&to-from>(hangLeft?1:0)?Math.max(0,width-measure(from,to-1)):0;return direction==='rtl'?{hangLeft:hangRight,hangRight:hangLeft}:{hangLeft,hangRight};}
