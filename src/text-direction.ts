import type {DesignNode} from './model';
export type TextDirection='auto'|'ltr'|'rtl';
export type ResolvedTextDirection='ltr'|'rtl';
export function validateTextDirection(value:unknown){if(value!==undefined&&!['auto','ltr','rtl'].includes(value as string))throw Error('Text direction must be Auto, LTR or RTL.');}
// Browser dir=auto is the shaping engine's first-strong oracle; no source reversal.
let probe:HTMLElement|undefined;
const cache=new Map<string,ResolvedTextDirection>();
/** Bidi class AL: letters whose following European digits read as Arabic numbers. */
const arabicLetter=/[\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Hanifi_Rohingya}\p{Script=Sogdian}\p{Script=Old_Sogdian}\p{Script=Chorasmian}]/u;
/** Bidi class R, by the scripts Unicode writes right to left. */
const hebrewLetter=/[\p{Script=Hebrew}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}\p{Script=Adlam}\p{Script=Mende_Kikakui}\p{Script=Imperial_Aramaic}\p{Script=Phoenician}\p{Script=Lydian}\p{Script=Kharoshthi}\p{Script=Old_South_Arabian}\p{Script=Old_North_Arabian}\p{Script=Avestan}\p{Script=Inscriptional_Parthian}\p{Script=Inscriptional_Pahlavi}\p{Script=Psalter_Pahlavi}\p{Script=Old_Turkic}\p{Script=Old_Hungarian}\p{Script=Cypriot}\p{Script=Meroitic_Hieroglyphs}\p{Script=Meroitic_Cursive}\p{Script=Nabataean}\p{Script=Palmyrene}\p{Script=Hatran}\p{Script=Manichaean}\p{Script=Elymaic}]/u;
export type BidiStrong='L'|'R'|'AL';
/** The strong bidi class of one code point, or undefined for weak and neutral ones. */
export function strongBidiClass(c:string):BidiStrong|undefined{if(c==='\u200e')return 'L';if(c==='\u200f')return 'R';if(c==='\u061c')return 'AL';if(!/[\p{Letter}\p{Letter_Number}]/u.test(c))return undefined;return arabicLetter.test(c)?'AL':hebrewLetter.test(c)?'R':'L';}
const OPENERS:Record<string,BidiStrong|'FSI'>={'\u202a':'L','\u202b':'R','\u202d':'L','\u202e':'R','\u2066':'L','\u2067':'R','\u2068':'FSI'};
const ISOLATE_OPENERS='\u2066\u2067\u2068',mark=(c:BidiStrong)=>c==='L'?'\u200e':c==='R'?'\u200f':'\u061c',base=(c:BidiStrong|undefined,fallback:BidiStrong)=>c==='AL'?'R':c??fallback;
const rtlHint=/[\u0590-\u08ff\ufb1d-\ufdff\ufe70-\ufeff\u200e\u200f\u202a-\u202e\u2066-\u2069\u{10800}-\u{10fff}\u{1e800}-\u{1eeff}]/u;
function firstStrong(text:string,from:number){for(const c of text.slice(from)){if(c==='\u2069')break;const s=strongBidiClass(c);if(s)return s;}return 'L' as BidiStrong;}
/**
 * The bidi algorithm resolves a whole paragraph, then cuts lines; each SVG line is shaped alone. Invisible marks restore what a
 * line would otherwise lose at a soft wrap: open embeddings, and the strong neighbours that decide its edge neutrals.
 */
export function bidiLineContext(text:string,from:number,to:number,direction:ResolvedTextDirection){
 if(direction==='ltr'&&!rtlHint.test(text)||!from&&to>=text.length)return {prefix:'',suffix:''};
 const paragraph:BidiStrong=direction==='rtl'?'R':'L',stack:{control:string;level:BidiStrong;last?:BidiStrong}[]=[{control:'',level:paragraph}];
 for(let i=0;i<from;){const c=String.fromCodePoint(text.codePointAt(i)!);i+=c.length;const opener=OPENERS[c];if(opener){const level=opener==='FSI'?base(firstStrong(text,i),'L'):opener;stack.push({control:opener==='FSI'?(level==='L'?'\u2066':'\u2067'):c,level});continue;}if(c==='\u202c'){if(stack.length>1&&!ISOLATE_OPENERS.includes(stack.at(-1)!.control))stack.pop();continue;}if(c==='\u2069'){while(stack.length>1&&!ISOLATE_OPENERS.includes(stack.at(-1)!.control))stack.pop();if(stack.length>1)stack.pop();continue;}const strong=strongBidiClass(c);if(strong)stack.at(-1)!.last=strong;}
 const current=stack.at(-1)!,line=text.slice(from,to),visible=[...line].filter(c=>!OPENERS[c]&&c!=='\u202c'&&c!=='\u2069'),start=visible[0],trimmed=line.trimEnd(),end=[...trimmed].at(-1);let prefix=stack.slice(1).map(v=>v.control).join('');
 if(start&&!strongBidiClass(start)&&current.last&&current.last!==current.level)prefix+=mark(current.last);
 let suffix='';if(end&&!strongBidiClass(end)){for(const c of text.slice(to)){if(OPENERS[c]||c==='\u202c'||c==='\u2069')break;const strong=strongBidiClass(c);if(strong){if(strong!==current.level)suffix=mark(strong);break;}}}
 return {prefix,suffix};
}
export function resolveTextDirection(text:string,direction:TextDirection='auto'):ResolvedTextDirection{if(direction!=='auto')return direction;const cached=cache.get(text);if(cached)return cached;let result:ResolvedTextDirection='ltr';if(typeof document!=='undefined'&&document.body){if(!probe||probe.ownerDocument!==document||!probe.isConnected){probe=document.createElement('bdi');probe.setAttribute('dir','auto');probe.setAttribute('aria-hidden','true');probe.style.display='none';document.body.appendChild(probe);}probe.textContent=text;result=getComputedStyle(probe).direction==='rtl'?'rtl':'ltr';}else{for(const c of text){if(c==='\u200f'||c==='\u061c'){result='rtl';break;}if(c==='\u200e'){break;}const strong=strongBidiClass(c);if(strong){result=strong==='L'?'ltr':'rtl';break;}}}if(text.length<=2048){if(cache.size>=2048)cache.clear();cache.set(text,result);}return result;}
/** Physical alignment remains physical when the logical writing direction changes. */
export function textLinePlacement(width:number,line:{x:number;hangLeft?:number;hangRight?:number;rightInset?:number;width:number;textAlign:DesignNode['textAlign'];direction:ResolvedTextDirection;paragraphEnd?:boolean}){const left=line.x,right=width-(line.rightInset??0),available=Math.max(0,right-left),justify=line.textAlign==='justify'&&!line.paragraphEnd,inkWidth=justify?available:Math.max(0,line.width-(line.hangLeft??0)-(line.hangRight??0)),inkLeft=line.textAlign==='center'?left+(available-inkWidth)/2:line.textAlign==='right'||line.textAlign==='justify'&&line.direction==='rtl'?right-inkWidth:left;return {left,right,available,inkLeft,inkWidth,x:line.textAlign==='center'?(left+right)/2+((line.hangRight??0)-(line.hangLeft??0))/2:line.textAlign==='right'?right+(line.hangRight??0):line.textAlign==='justify'&&line.direction==='rtl'?right+(line.hangRight??0):left-(line.hangLeft??0),justified:available+(line.hangLeft??0)+(line.hangRight??0),anchor:line.textAlign==='center'?'middle' as const:line.textAlign==='right'?(line.direction==='rtl'?'start':'end') as 'start'|'end':line.textAlign==='justify'?(line.direction==='rtl'?'start':'start') as 'start':(line.direction==='rtl'?'end':'start') as 'start'|'end'};}
