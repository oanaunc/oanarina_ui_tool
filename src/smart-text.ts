import type {DesignNode} from './model';
import {replaceRichText,replaceTextRange} from './rich-text';
/** Opt-in English punctuation for a single typed ASCII character, never bulk input. */
export function smartTypingEdit(n:DesignNode,text:string,cursor:number,options:{enabled:boolean;inputType:string;composing:boolean}){
 const plain=replaceRichText(n,text),unchanged={patch:plain,cursor,substituted:false};
 if(!options.enabled||options.composing||options.inputType!=='insertText'||!Number.isInteger(cursor)||cursor<0||cursor>text.length)return unchanged;
 let from=0,oldEnd=n.text.length,newEnd=text.length;while(from<oldEnd&&from<newEnd&&n.text[from]===text[from])from++;while(oldEnd>from&&newEnd>from&&n.text[oldEnd-1]===text[newEnd-1]){oldEnd--;newEnd--;}
 if(oldEnd!==from||newEnd-from!==1||cursor!==newEnd)return unchanged;
 const typed={...n,...plain},char=text[from],prefix=text.slice(0,cursor),previous=text[from-1]??'';let start=from,replacement='';
 if(char==='"'||char==="'"){const opening=!previous||/[\s([{<“‘]/u.test(previous);replacement=char==='"'?(opening?'“':'”'):(opening?'‘':'’');}
 else {const pair=[['(tm)','™'],['(c)','©'],['(r)','®'],['...','…'],['--','—']].find(([token])=>prefix.toLowerCase().endsWith(token));if(pair){start=cursor-pair[0].length;replacement=pair[1];}}
 if(!replacement)return unchanged;
 const run=typed.textRuns?.find(r=>r.start<=start&&r.end>start),patch=replaceTextRange(typed,start,cursor,replacement,run?[{...run,start:0,end:replacement.length}]:[]);
 return {patch,cursor:start+replacement.length,substituted:true};
}
