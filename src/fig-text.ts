import type {DesignNode} from './model';
import type {TextRun,TextStyle} from './rich-text';
import {list,number,object,optional,string} from './fig-values';
import type {Raw} from './fig-values';
const boundary=(text:string,at:number)=>at<=0||at>=text.length||!(text.charCodeAt(at)>=0xdc00&&text.charCodeAt(at)<=0xdfff&&text.charCodeAt(at-1)>=0xd800&&text.charCodeAt(at-1)<=0xdbff);
export const figFontWeight=(style:string)=>/thin/i.test(style)?100:/extra.?light|ultra.?light/i.test(style)?200:/light/i.test(style)?300:/semi.?bold|demi/i.test(style)?600:/extra.?bold|ultra.?bold/i.test(style)?800:/black|heavy/i.test(style)?900:/bold/i.test(style)?700:/medium/i.test(style)?500:400;
/** Display case is a stored attribute in the source. Forma keeps literal characters, so the shown case becomes the text. */
export function figTextCase(text:string,mode:string){const out=mode==='UPPER'?text.toUpperCase():mode==='LOWER'?text.toLowerCase():mode==='TITLE'?text.toLowerCase().replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu,(_,a:string,b:string)=>a+b.toUpperCase()):text;return out.length===text.length?out:undefined;}
export function figLetterSpacing(raw:Raw,fontSize:number){const ls=optional(raw.letterSpacing);return ls.units==='PERCENT'?number(ls.value,0)/100*fontSize:number(ls.value,0);}
export const figDecorations=(value:unknown):DesignNode['decorations']=>value==='UNDERLINE'?['underline']:value==='STRIKETHROUGH'?['line-through']:[];
/** One style per character, with zero meaning the layer's base style. Trailing characters may be omitted. */
export function figTextRuns(text:string,data:Raw,base:Pick<DesignNode,'fontSize'>,fill:(style:Raw)=>string|undefined,issue:(code:string,message:string)=>void):TextRun[]{
 const ids=list(data.characterStyleIDs,1_000_000).map(v=>number(v)),table=new Map(list(data.styleOverrideTable,10000).map(object).map(s=>[number(s.styleID,0),s]));if(!ids.some(Boolean))return [];
 const runs:TextRun[]=[],styles=new Map<number,TextStyle>(),styleFor=(id:number)=>{let out=styles.get(id);if(out)return out;out={};const s=table.get(id)??{};if(s.fontName!==undefined){const font=object(s.fontName),style=string(font.style);out.fontFamily=string(font.family,'Inter').slice(0,512);out.fontWeight=figFontWeight(style);out.fontStyle=/italic|oblique/i.test(style)?'italic':'normal';}if(s.fontSize!==undefined){const size=number(s.fontSize);if(size>0&&size<=10000)out.fontSize=size;}if(s.letterSpacing!==undefined){const spacing=figLetterSpacing(s,out.fontSize??base.fontSize);if(Math.abs(spacing)<=10000)out.letterSpacing=spacing;}if(s.textDecoration!==undefined)out.decorations=figDecorations(s.textDecoration);const color=fill(s);if(color)out.fill=color;if(s.hyperlink!==undefined){const link=optional(s.hyperlink),url=string(link.url??link.value);if(/^https?:\/\//i.test(url))out.hyperlink=url;else issue('text-link','Non-HTTP text link was omitted.');}if(s.lineHeight!==undefined||s.paragraphSpacing!==undefined)issue('text-range-paragraph','Mixed line height inside one text layer uses the layer value.');styles.set(id,out);return out;};
 let start=-1,current=0;const close=(end:number)=>{if(current&&start>=0&&end>start){const style=styleFor(current);if(Object.keys(style).length)runs.push({...structuredClone(style),start,end});}};
 for(let i=0;i<=text.length;i++){const id=i<text.length?ids[i]??0:0;if(id===current||!boundary(text,i))continue;close(i);current=id;start=i;}
 return runs;
}
