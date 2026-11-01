import type {DesignNode} from './model';
import type {ParagraphOverride} from './paragraphs';
import type {TextRun,TextStyle,UnderlineStyle} from './rich-text';
import {color,flag,list,number,object,optional,string} from './fig-values';
import type {Raw} from './fig-values';
const boundary=(text:string,at:number)=>at<=0||at>=text.length||!(text.charCodeAt(at)>=0xdc00&&text.charCodeAt(at)<=0xdfff&&text.charCodeAt(at-1)>=0xd800&&text.charCodeAt(at-1)<=0xdbff);
export const figFontWeight=(style:string)=>/thin/i.test(style)?100:/extra.?light|ultra.?light/i.test(style)?200:/light/i.test(style)?300:/semi.?bold|demi/i.test(style)?600:/extra.?bold|ultra.?bold/i.test(style)?800:/black|heavy/i.test(style)?900:/bold/i.test(style)?700:/medium/i.test(style)?500:400;
/** Display case is a stored attribute in the source. Forma keeps literal characters, so the shown case becomes the text. */
export function figTextCase(text:string,mode:string){const out=mode==='UPPER'?text.toUpperCase():mode==='LOWER'?text.toLowerCase():mode==='TITLE'?text.toLowerCase().replace(/(^|[^\p{L}\p{N}'’])(\p{L})/gu,(_,a:string,b:string)=>a+b.toUpperCase()):text;return out.length===text.length?out:undefined;}
export function figLetterSpacing(raw:Raw,fontSize:number){const ls=optional(raw.letterSpacing);return ls.units==='PERCENT'?number(ls.value,0)/100*fontSize:number(ls.value,0);}
export const figDecorations=(value:unknown):DesignNode['decorations']=>value==='UNDERLINE'?['underline']:value==='STRIKETHROUGH'?['line-through']:[];
/** A length the source states in pixels, as a share of the font, or as a multiple of it. An unwritten one means automatic. */
const figLength=(value:unknown,size:number)=>{const o=optional(value);if(o.value===undefined)return;const v=number(o.value);return o.units==='PIXELS'?v:o.units==='PERCENT'?v/100*size:v*size;};
/** Only an underline the source shapes needs a record: the plain one, skipping ink, is the default in both apps. */
export function figUnderline(raw:Raw,size:number,fill:string):UnderlineStyle|undefined{
 if(raw.textDecoration!=='UNDERLINE')return;const kind=string(raw.textDecorationStyle,'SOLID'),skipInk=flag(raw.textDecorationSkipInk,true),thickness=figLength(raw.textDecorationThickness,size),offset=figLength(raw.textUnderlineOffset,size),paint=list(raw.textDecorationFillPaints,100).map(object).find(p=>p.type==='SOLID'&&p.visible!==false);
 if(kind==='SOLID'&&skipInk&&thickness===undefined&&offset===undefined&&!paint)return;
 return {style:kind==='DOTTED'?'dotted':kind==='WAVY'?'wavy':'solid',thickness:Math.max(0,Math.min(100,thickness??Math.max(1,size/14))),offset:Math.max(-1000,Math.min(1000,offset??2)),color:paint?color(paint.color).hex:/^#[\da-f]{6}$/i.test(fill)?fill:'#000000',skipInk};
}
/** Each saved line is one paragraph, in order. Only list lines need a record. */
export function figParagraphs(text:string,data:Raw,issue:(code:string,message:string)=>void):ParagraphOverride[]{
 const lines=list(data.lines,100_000).map(object),out:ParagraphOverride[]=[];let start=0,previous='';
 text.split('\n').forEach((part,i)=>{const line=lines[i]??{},type=string(line.lineType,'PLAIN'),listStyle=type==='ORDERED_LIST'?'number' as const:type==='UNORDERED_LIST'||type==='CHECKLIST'?'bullet' as const:undefined;if(type==='CHECKLIST')issue('text-checklist','Checklist lines became bullets; their checked state is not retained.');if(listStyle){const offset=number(line.listStartOffset,0),restart=line.isFirstLineOfList===true||previous!==type;out.push({start,listStyle,listLevel:Math.max(0,Math.min(8,number(line.indentationLevel,1)-1)),...(restart&&offset>0&&offset<999999?{listStart:offset+1}:{})});}previous=type;start+=part.length+1;});
 return out;
}
/** Case set on part of a text layer. Forma keeps literal characters, so the shown case becomes the text, where that keeps its length. */
export function figRangeCase(text:string,data:Raw){
 const ids=list(data.characterStyleIDs,1_000_000).map(v=>number(v)),table=new Map(list(data.styleOverrideTable,10000).map(object).map(s=>[number(s.styleID,0),s]));let out=text,start=0;
 for(let i=1;i<=text.length;i++){if(i<text.length&&(ids[i]??0)===(ids[start]??0))continue;const mode=string(table.get(ids[start]??0)?.textCase,'ORIGINAL');if(mode==='UPPER'||mode==='LOWER'||mode==='TITLE'){const shown=figTextCase(text.slice(start,i),mode);if(shown!==undefined)out=out.slice(0,start)+shown+out.slice(i);}start=i;}
 return out;
}
/** The stored size stands until the text is edited, and a layout saved for these characters says where its lines wrapped.
 * A start after a hard return is a paragraph already. Anything inconsistent keeps the size and leaves wrapping to local fonts. */
export function figSavedStarts(text:string,derived:Raw):number[]|undefined{
 const baselines=list(derived.baselines,100_000).map(object);if(!baselines.length)return;const out:number[]=[];let previous=-1;
 for(const line of baselines){const at=line.firstCharacter;if(typeof at!=='number'||!Number.isInteger(at)||at<0||at>=Math.max(1,text.length)||at<=previous||(previous<0&&at!==0)||!boundary(text,at))return;previous=at;if(at>0&&text[at-1]!=='\n')out.push(at);}
 return out;
}
/** One style per character, with zero meaning the layer's base style. Trailing characters may be omitted. */
export function figTextRuns(text:string,data:Raw,base:Pick<DesignNode,'fontSize'|'fill'>,fill:(style:Raw)=>string|undefined,issue:(code:string,message:string)=>void):TextRun[]{
 const ids=list(data.characterStyleIDs,1_000_000).map(v=>number(v)),table=new Map(list(data.styleOverrideTable,10000).map(object).map(s=>[number(s.styleID,0),s]));if(!ids.some(Boolean))return [];
 const runs:TextRun[]=[],styles=new Map<number,TextStyle>(),styleFor=(id:number)=>{let out=styles.get(id);if(out)return out;out={};const s=table.get(id)??{};if(s.fontName!==undefined){const font=object(s.fontName),style=string(font.style);out.fontFamily=string(font.family,'Inter').slice(0,512);out.fontWeight=figFontWeight(style);out.fontStyle=/italic|oblique/i.test(style)?'italic':'normal';}if(s.fontSize!==undefined){const size=number(s.fontSize);if(size>0&&size<=10000)out.fontSize=size;}if(s.letterSpacing!==undefined){const spacing=figLetterSpacing(s,out.fontSize??base.fontSize);if(Math.abs(spacing)<=10000)out.letterSpacing=spacing;}if(s.textDecoration!==undefined){out.decorations=figDecorations(s.textDecoration);const underline=figUnderline(s,out.fontSize??base.fontSize,fill(s)??base.fill??'');if(underline)out.underline=underline;}if(s.textCase!==undefined)out.smallCaps=s.textCase==='SMALL_CAPS'||s.textCase==='SMALL_CAPS_FORCED';const paint=fill(s);if(paint)out.fill=paint;if(s.hyperlink!==undefined){const link=optional(s.hyperlink),url=string(link.url??link.value);if(/^https?:\/\//i.test(url))out.hyperlink=url;else issue('text-link','Non-HTTP text link was omitted.');}if(s.lineHeight!==undefined||s.paragraphSpacing!==undefined)issue('text-range-paragraph','Mixed line height inside one text layer uses the layer value.');styles.set(id,out);return out;};
 let start=-1,current=0;const close=(end:number)=>{if(current&&start>=0&&end>start){const style=styleFor(current);if(Object.keys(style).length)runs.push({...structuredClone(style),start,end});}};
 for(let i=0;i<=text.length;i++){const id=i<text.length?ids[i]??0:0;if(id===current||!boundary(text,i))continue;close(i);current=id;start=i;}
 return runs;
}
