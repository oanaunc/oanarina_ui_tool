import {describe,expect,it} from 'vitest';
import {node} from '../src/model';
import {bidiLineContext,resolveTextDirection,strongBidiClass} from '../src/text-direction';
import {textLines} from '../src/text-layout';
const RLM='‏',LRM='‎',ALM='؜';
describe('strong classes come from Unicode scripts',()=>{
 it('classifies Hebrew and relatives as R, Arabic and relatives as AL, others as L, and digits and punctuation as weak',()=>{for(const c of ['ש','ࠀ','𐤀','ߊ'])expect(strongBidiClass(c),c).toBe('R');for(const c of ['ب','ܐ','ހ','ﷺ'])expect(strongBidiClass(c),c).toBe('AL');for(const c of ['a','я','日','Ⅷ'])expect(strongBidiClass(c),c).toBe('L');for(const c of ['1','٣',' ','(','-','.'])expect(strongBidiClass(c),c).toBeUndefined();expect(strongBidiClass(LRM)).toBe('L');expect(strongBidiClass(RLM)).toBe('R');expect(strongBidiClass(ALM)).toBe('AL');});
 it('headless first-strong reads past digits and punctuation, in scripts the old ranges missed',()=>{expect(resolveTextDirection('123 (שלום)')).toBe('rtl');expect(resolveTextDirection('"مرحبا"')).toBe('rtl');expect(resolveTextDirection('𞤀𞤣𞤤𞤢𞤥')).toBe('rtl');expect(resolveTextDirection('123 abc')).toBe('ltr');expect(resolveTextDirection('1234')).toBe('ltr');expect(resolveTextDirection(LRM+'שלום')).toBe('ltr');expect(resolveTextDirection(RLM+'abc')).toBe('rtl');});
});
describe('line context across soft wraps',()=>{
 it('adds nothing to Latin paragraphs, whole paragraphs, or lines that begin and end on strong letters',()=>{expect(bidiLineContext('abc def, ghi',4,12,'ltr')).toEqual({prefix:'',suffix:''});expect(bidiLineContext('שלום abc',0,8,'rtl')).toEqual({prefix:'',suffix:''});expect(bidiLineContext('שלום abc def',5,8,'rtl')).toEqual({prefix:'',suffix:''});});
 it('a line starting on a neutral inherits the opposing strong letter before it',()=>{expect(bidiLineContext('abc (123) שלום',4,14,'rtl').prefix).toBe(LRM);expect(bidiLineContext('שלום (123) abc',5,14,'ltr').prefix).toBe(RLM);});
 it('a line starting on digits after Arabic keeps Arabic number context, Hebrew does not',()=>{expect(bidiLineContext('مرحبا 123 abc',6,13,'rtl').prefix).toBe(ALM);expect(bidiLineContext('שלום 123 abc',5,12,'rtl').prefix).toBe('');});
 it('a line ending on a neutral sees the strong letter after it',()=>{expect(bidiLineContext('abc ... שלום',0,7,'ltr').suffix).toBe(RLM);expect(bidiLineContext('שלום ... abc',0,8,'rtl').suffix).toBe(LRM);});
 it('reopens embeddings and isolates that span the wrap, and closed ones stay closed',()=>{const text='a‫שלום עולם‬ b';expect(bidiLineContext(text,7,text.length,'ltr').prefix).toBe('‫');expect(bidiLineContext(text,text.length-1,text.length,'ltr').prefix).toBe('');const isolate='a⁧שלום עולם⁩ b';expect(bidiLineContext(isolate,7,isolate.length,'ltr').prefix).toBe('⁧');const first='a⁨שלום עולם⁩ b';expect(bidiLineContext(first,7,first.length,'ltr').prefix).toBe('⁧');});
 it('wrapped layout attaches context to the second line and keeps source offsets',()=>{const text='שלום עולם ... (123) abc',n=node('text',{text,width:70,height:400,fontSize:16,textDirection:'ltr'}),lines=textLines(n);expect(lines.length).toBeGreaterThan(1);expect(lines.map(l=>l.text).join('').replace(/ /g,'')).toBe(text.replace(/ /g,''));const plain=textLines(node('text',{text:'plain Latin text that wraps',width:70,height:400,fontSize:16}));expect(plain.every(l=>!l.bidi)).toBe(true);});
});
