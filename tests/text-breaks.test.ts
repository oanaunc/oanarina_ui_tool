import {describe,expect,it} from 'vitest';
import {lineBreakTokens,lineBreakUnits} from '../src/text-breaks';
import {reflow} from '../src/layout';
import {node} from '../src/model';
import {textLines,updateTextMetrics} from '../src/text-layout';
const pieces=(text:string)=>lineBreakTokens(text).filter(t=>t.trim());
const wrapped=(text:string,width:number,extra:object={})=>textLines(node('text',{text,fontSize:10,width,height:100,textResize:'auto-height',textLayoutVersion:2,...extra} as never)).map(l=>l.text);
describe('line break opportunities',()=>{
 it('keeps plain text as words and spaces',()=>{expect(lineBreakTokens('One two  three')).toEqual(['One',' ','two','  ','three']);expect(lineBreakTokens('')).toEqual(['']);});
 it('breaks after a hyphen inside a word, not before a number or after a leading one',()=>{expect(pieces('state-of-the-art')).toEqual(['state-','of-','the-','art']);expect(pieces('2020-2021')).toEqual(['2020-2021']);expect(pieces('-flag')).toEqual(['-flag']);expect(pieces('a --flag')).toEqual(['a','--','flag']);});
 it('breaks after a slash, keeps a URL scheme whole and leaves fractions alone',()=>{expect(pieces('and/or')).toEqual(['and/','or']);expect(pieces('https://forma.app/guide')).toEqual(['https://','forma.app/','guide']);expect(pieces('1/2')).toEqual(['1/2']);expect(pieces('/usr/local')).toEqual(['/usr/','local']);});
 it('breaks around an em dash and after an en dash',()=>{expect(pieces('word—word')).toEqual(['word','—','word']);expect(pieces('word–word')).toEqual(['word–','word']);expect(pieces('word——word')).toEqual(['word','——','word']);});
 it('holds no-break spaces and joiners together',()=>{expect(pieces('ten px')).toEqual(['ten px']);expect(pieces('a⁠/b')).toEqual(['a⁠/','b']);expect(pieces('ab​cd')).toEqual(['ab​','cd']);});
 it('breaks between Chinese characters and keeps punctuation off the line start',()=>{expect(pieces('你好，世界。')).toEqual(['你','好，','世','界。']);expect(pieces('他说：“好”')).toEqual(['他','说：','“好”']);expect(pieces('（中文）字')).toEqual(['（中','文）','字']);expect(pieces('《书》')).toEqual(['《书》']);});
 it('follows Japanese line start rules for small kana and marks',()=>{expect(pieces('ちょっと')).toEqual(['ちょっ','と']);expect(pieces('コーヒー')).toEqual(['コー','ヒー']);expect(pieces('人々')).toEqual(['人々']);expect(pieces('はい！')).toEqual(['は','い！']);expect(pieces('テスト・ケース')).toEqual(['テ','ス','ト・','ケー','ス']);});
 it('keeps Latin words whole beside CJK and breaks between them',()=>{expect(pieces('使用Forma设计')).toEqual(['使','用','Forma','设','计']);});
 it('breaks Korean between words, as Korean setting does',()=>{expect(pieces('한글 글꼴 설정')).toEqual(['한글','글꼴','설정']);});
 it('finds Thai word boundaries with a segmenter',()=>{const out=pieces('ภาษาไทยง่าย');expect(out.length).toBeGreaterThan(1);expect(out.join('')).toBe('ภาษาไทยง่าย');});
 it('never splits a cluster',()=>{expect(pieces('👩‍💻字')).toEqual(['👩‍💻','字']);expect(lineBreakTokens('é-a').join('')).toBe('é-a');});
 it('reports ranges for the pieces that hold words',()=>{expect(lineBreakUnits('ab cd-ef')).toEqual([{from:0,to:2},{from:3,to:6},{from:6,to:8}]);});
});
describe('wrapping current text',()=>{
 it('ends a line after a hyphen or slash that fits',()=>{expect(wrapped('well-known word',45)).toEqual(['well-','known','word']);expect(wrapped('design/build',45)).toEqual(['design/','build']);});
 it('wraps CJK with kinsoku',()=>{const lines=wrapped('一二三四五，六七八九',30);expect(lines.every(l=>!/^[，。]/.test(l))).toBe(true);expect(lines.join('')).toBe('一二三四五，六七八九');expect(lines.length).toBeGreaterThan(1);});
 it('falls back to characters for a word wider than the line',()=>{expect(wrapped('Averyveryverylongword',40).length).toBeGreaterThan(1);});
 it('keeps balance working at the new breaks',()=>{const lines=wrapped('alpha-beta gamma-delta epsilon-zeta',100,{textWrap:'balance'});expect(lines.join(' ').replaceAll('- ','-')).toBe('alpha-beta gamma-delta epsilon-zeta');expect(lines.length).toBeGreaterThan(1);});
 it('leaves saved text breaking at spaces only',()=>{const old=node('text',{text:'well-known word',fontSize:10,width:60,height:100} as never);expect(textLines(old).map(l=>l.text)).toEqual(['well-known','word']);const narrow=node('text',{text:'well-known word',fontSize:10,width:45,height:100} as never);expect(textLines(narrow).some(l=>l.text==='well-')).toBe(false);});
});
describe('max width on hugging text',()=>{
 const hug=(extra:object={})=>node('text',{text:'One two three four five six',fontSize:10,width:1,height:1,textResize:'auto-width',textLayoutVersion:2,textLineBox:true,...extra} as never);
 it('hugs until the limit, then wraps and grows in height',()=>{const n=hug({maxWidth:80});updateTextMetrics([n]);expect(n.width).toBeLessThanOrEqual(80);expect(textLines(n).length).toBeGreaterThan(1);expect(n.height).toBe(textLines(n).length*13);const free=hug();updateTextMetrics([free]);expect(textLines(free).length).toBe(1);expect(free.width).toBeGreaterThan(80);});
 it('stays tight around short words',()=>{const n=hug({text:'Hi',maxWidth:80});updateTextMetrics([n]);expect(n.width).toBe(11);expect(textLines(n).length).toBe(1);});
 it('honors explicit line breaks and an unbreakable word',()=>{const n=hug({text:'A\nAveryveryverylongword',maxWidth:50});updateTextMetrics([n]);expect(n.width).toBeLessThanOrEqual(50);expect(textLines(n).length).toBeGreaterThan(2);});
 it('wraps inside a hugging auto layout frame',()=>{const frame=node('frame',{layout:'vertical',sizingX:'hug',sizingY:'hug',width:10,height:10,padding:0}),text=hug({parentId:frame.id,maxWidth:80}),nodes=[frame,text];updateTextMetrics(nodes);reflow(nodes);expect(frame.width).toBe(text.width);expect(frame.height).toBe(text.height);expect(text.width).toBeLessThanOrEqual(80);expect(text.height).toBeGreaterThan(13);});
});
