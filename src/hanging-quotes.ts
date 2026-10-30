import type {TextDirection} from './text-direction';
export function validateHangingQuotes(value:unknown){if(value!==undefined&&typeof value!=='boolean')throw Error('Hanging quotation marks must be a boolean.');}
const opening=new Set(['"',"'",'“','‘','«','‹']),closing=new Set(['"',"'",'”','’','»','›']);
// Unknown visual ordering deliberately retains ordinary placement, rather than reversing source.
const unsupported=/[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff\u200e\u200f\u202a-\u202e\u2066-\u2069\u{10800}-\u{10fff}\u{1e800}-\u{1e95f}\t]/u;
export function quoteParagraph(text:string,enabled:boolean|undefined,direction:TextDirection,align:string,list:string){if(enabled!==true||direction!=='ltr'||!['left','right'].includes(align)||list!=='none')return {active:false,text};const trimmed=text.trimEnd(),visual=closing.has(trimmed.at(-1)??'')?trimmed:text,active=!unsupported.test(visual);return {active,text:active?visual:text};}
/** Hang contextual quote advances only at the original paragraph boundaries. */
export function quoteOverhang(text:string,from:number,to:number,active:boolean,measure:(from:number,to:number)=>number){if(!active||from>=to)return {hangLeft:0,hangRight:0};const width=measure(from,to),hangLeft=from===0&&opening.has(text[from])?Math.max(0,width-measure(from+1,to)):0,hangRight=to===text.length&&closing.has(text[to-1])&&to-from>(hangLeft?1:0)?Math.max(0,width-measure(from,to-1)):0;return {hangLeft,hangRight};}
