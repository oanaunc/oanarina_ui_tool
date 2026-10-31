import type {TextDirection} from './text-direction';
export function validateHangingQuotes(value:unknown){if(value!==undefined&&typeof value!=='boolean')throw Error('Hanging quotation marks must be a boolean.');}
const opening=new Set(['"',"'",'“','‘','«','‹']),closing=new Set(['"',"'",'”','’','»','›']);
// Explicit bidi controls and tabs can move an edge character away from its line edge, so those keep ordinary placement.
const unsupported=/[\u200e\u200f\u061c\u202a-\u202e\u2066-\u2069\t]/u;
export function quoteParagraph(text:string,enabled:boolean|undefined,direction:TextDirection,align:string,list:string){if(enabled!==true||direction==='auto'||!['left','right','center','justify'].includes(align)||list!=='none')return {active:false,text};const trimmed=text.trimEnd(),visual=closing.has(trimmed.at(-1)??'')?trimmed:text,active=!unsupported.test(visual);return {active,text:active?visual:text};}
/** Hang contextual quote advances only at the original paragraph boundaries. A neutral at a paragraph edge sits on that edge in either direction, so RTL mirrors the sides. */
export function quoteOverhang(text:string,from:number,to:number,active:boolean,measure:(from:number,to:number)=>number,direction:'ltr'|'rtl'='ltr'){if(!active||from>=to)return {hangLeft:0,hangRight:0};const width=measure(from,to),hangLeft=from===0&&opening.has(text[from])?Math.max(0,width-measure(from+1,to)):0,hangRight=to===text.length&&closing.has(text[to-1])&&to-from>(hangLeft?1:0)?Math.max(0,width-measure(from,to-1)):0;return direction==='rtl'?{hangLeft:hangRight,hangRight:hangLeft}:{hangLeft,hangRight};}
