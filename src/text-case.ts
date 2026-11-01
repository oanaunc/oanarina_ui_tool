/** Letter case is a display setting. The source keeps what was typed, so turning it off gives the words back. */
export const textCases=['original','upper','lower','title'] as const;
export type TextCase=typeof textCases[number];
export const textCaseLabels:Record<TextCase,string>={original:'As typed',upper:'Uppercase',lower:'Lowercase',title:'Title case'};
export function validateTextCase(value:unknown){if(value!==undefined&&!textCases.includes(value as TextCase))throw Error('Invalid letter case.');}
const wordPart=/[\p{L}\p{N}\p{M}]/u,letter=/\p{L}/u,apostrophe=/['’]/;
/** A letter opens a word unless a letter or number sits before it. An apostrophe inside a word does not open one, so don't stays Don't. */
const opensWord=(before:string)=>{const marks=[...before],last=marks.at(-1)??'';if(!last)return true;if(wordPart.test(last))return false;return !(apostrophe.test(last)&&wordPart.test(marks.at(-2)??''));};
const titleLetter=(c:string)=>{const up=c.toUpperCase();return up.length>c.length?up[0]+up.slice(1).toLowerCase():up;};
/** The characters a mode shows. `before` is the source text ahead of this slice, so a word broken across runs or lines still has one first letter.
 * Title leaves the other letters alone, as CSS capitalize does, so a site export shows the same words. */
export function shownCase(text:string,mode:TextCase|undefined,before=''){
 if(!mode||mode==='original')return text;if(mode==='upper')return text.toUpperCase();if(mode==='lower')return text.toLowerCase();
 let out='',context=before.slice(-2);for(const c of text){out+=letter.test(c)&&opensWord(context)?titleLetter(c):c;context=(context+c).slice(-4);}return out;
}
export const cssTextTransform=(mode:TextCase|undefined)=>mode==='upper'?'uppercase':mode==='lower'?'lowercase':mode==='title'?'capitalize':'none';
export function textCaseFromCss(value:string):TextCase|undefined{const v=value.trim().toLowerCase();return v==='uppercase'?'upper':v==='lowercase'?'lower':v==='capitalize'?'title':v==='none'?'original':undefined;}
