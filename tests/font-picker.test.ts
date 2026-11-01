import {afterEach,describe,expect,it,vi} from 'vitest';
import {fontRows,stepFontRow} from '../src/font-picker';
import {previewFontNodes} from '../src/font-preview';
import {fontRecents,rememberFont} from '../src/fonts';
import {node} from '../src/model';
const families=(rows:ReturnType<typeof fontRows>)=>rows.flatMap(r=>r.kind==='font'?[r.family]:[]);
afterEach(()=>{vi.unstubAllGlobals();});
describe('the font list',()=>{
 it('merges every source once, A to Z under All fonts, with recents above',()=>{const rows=fontRows(['Lora','Inter','arimo','Inter','Zilla','Helvetica Neue'],['Zilla','Gone'],'');expect(rows[0]).toEqual({kind:'head',label:'Recents'});expect(rows[1]).toEqual({kind:'font',family:'Zilla'});expect(rows[2]).toEqual({kind:'head',label:'All fonts'});expect(families(rows).slice(1)).toEqual(['arimo','Helvetica Neue','Inter','Lora','Zilla']);});
 it('leaves the Recents heading out when there are none',()=>{expect(fontRows(['Inter'],[],'')[0]).toEqual({kind:'head',label:'All fonts'});});
 it('searches without case and puts names that start with the search first',()=>{expect(fontRows(['Open Sans','Noto Sans','Sans Forgetica','Inter'],['Inter'],'SANS')).toEqual([{kind:'font',family:'Sans Forgetica'},{kind:'font',family:'Noto Sans'},{kind:'font',family:'Open Sans'}]);expect(fontRows(['Inter'],[],'zzz')).toEqual([]);});
 it('steps over headings and stops at the ends',()=>{const rows=fontRows(['A','B'],['B'],'');expect(rows.map(r=>r.kind)).toEqual(['head','font','head','font','font']);expect(stepFontRow(rows,-1,1)).toBe(1);expect(stepFontRow(rows,1,1)).toBe(3);expect(stepFontRow(rows,3,-1)).toBe(1);expect(stepFontRow(rows,1,-1)).toBe(1);expect(stepFontRow(rows,4,1)).toBe(4);expect(stepFontRow(rows,3,10)).toBe(4);expect(stepFontRow([],0,1)).toBe(-1);});
});
describe('recent fonts',()=>{
 const storage=()=>{const held=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>held.get(k)??null,setItem:(k:string,v:string)=>{held.set(k,v);}});return held;};
 it('keeps the newest eight without repeats',()=>{storage();for(const name of ['A','B','C','D','E','F','G','H','I','C'])rememberFont(name);expect(fontRecents()).toEqual(['C','I','H','G','F','E','D','B']);});
 it('ignores damaged storage',()=>{const held=storage();held.set('oui-recent-fonts','{');expect(fontRecents()).toEqual([]);held.set('oui-recent-fonts','[1,"Inter"]');expect(fontRecents()).toEqual(['Inter']);});
});
describe('the canvas preview',()=>{
 it('changes only copies of the chosen text and leaves the document objects alone',()=>{const a=node('text',{id:'a',text:'Hi',fontFamily:'Inter'}),b=node('text',{id:'b',text:'Hi',fontFamily:'Inter'}),r=node('rectangle',{id:'r'}),list=[a,b,r],next=previewFontNodes(list,'Lora',['a','r']);expect(next[0]).toMatchObject({id:'a',fontFamily:'Lora'});expect(a.fontFamily).toBe('Inter');expect(next[1]).toBe(b);expect(next[2]).toBe(r);});
});
