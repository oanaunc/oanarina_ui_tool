import {describe,expect,it} from 'vitest';
import {blankDocument,node,parseDocument} from '../src/model';
import {markdownBlocks,paragraph,specInlineMarks,specMarkdown,validateSpec} from '../src/spec';
import type {SpecBlock} from '../src/spec';
import {backspaceBlock,deleteForward,indentBlock,insertBlock,markdownShortcut,matchCommands,moveBlockTo,removeBlock,slashQuery,splitBlock,toggleTodo,turnInto,wrapMark} from '../src/spec-editing';
import {flattenSpecs,layoutSpec,settleSpecs,specLookup} from '../src/spec-layers';
const p=(text:string,id=text):SpecBlock=>({id,kind:'paragraph',text}),li=(text:string,indent?:number):SpecBlock=>({id:text,kind:'bullet',text,...(indent?{indent}:{})});
const words=(blocks:SpecBlock[])=>blocks.map(b=>'text' in b?b.text:b.kind);
describe('saved spec blocks',()=>{
 it('round trips through .oui validation',()=>{const d=blankDocument();d.pages[0].nodes=[node('spec',{name:'Notes'})];const back=parseDocument(JSON.stringify(d)).pages[0].nodes[0];expect(back.type).toBe('spec');expect(back.spec?.blocks).toHaveLength(2);expect(back.clip).toBe(true);});
 it('refuses malformed blocks before they reach a document',()=>{
  for(const spec of [{},{version:2,blocks:[]},{version:1,blocks:[{id:'a',kind:'nope'}]},{version:1,blocks:[{id:'a',kind:'paragraph'}]},{version:1,blocks:[p('a'),p('a')]},{version:1,blocks:[{id:'a',kind:'heading',level:9,text:''}]},{version:1,blocks:[{id:'a',kind:'image',src:'https://example.com/a.png',width:1,height:1}]},{version:1,blocks:[{id:'a',kind:'bullet',text:'',indent:40}]},{version:1,blocks:[{id:'a',kind:'paragraph',text:'',extra:1}]}])expect(()=>validateSpec(spec)).toThrow(/Invalid spec/);
  const d=blankDocument(),raw=JSON.parse(JSON.stringify(d));raw.pages[0].nodes=[{...node('rectangle'),spec:{version:1,blocks:[]}}];expect(()=>parseDocument(JSON.stringify(raw))).toThrow(/only spec layers/);raw.pages[0].nodes=[{...node('spec'),spec:undefined}];expect(()=>parseDocument(JSON.stringify(raw))).toThrow(/Invalid spec/);
 });
});
describe('block editing',()=>{
 it('Enter splits at the caret, continues a list and steps out of an empty item',()=>{
  const one=splitBlock([p('Hello world')],'Hello world',5);expect(words(one.blocks)).toEqual(['Hello',' world']);expect(one.caret).toEqual({id:one.blocks[1].id,at:0});
  expect(splitBlock([li('a')],'a',1).blocks[1].kind).toBe('bullet');expect(splitBlock([{id:'e',kind:'bullet',text:''}],'e',0).blocks[0].kind).toBe('paragraph');expect(splitBlock([{id:'e',kind:'bullet',text:'',indent:2}],'e',0).blocks[0]).toMatchObject({indent:1});
  expect(splitBlock([{id:'t',kind:'todo',text:'done',checked:true}],'t',4).blocks[1]).toMatchObject({kind:'todo',checked:false});
 });
 it('Backspace unstyles a line first, then joins the one above and keeps the caret at the seam',()=>{
  const h:SpecBlock={id:'h',kind:'heading',level:1,text:'Title'};expect(backspaceBlock([h],'h').blocks[0].kind).toBe('paragraph');
  const joined=backspaceBlock([p('ab'),p('cd')],'cd');expect(words(joined.blocks)).toEqual(['abcd']);expect(joined.caret).toEqual({id:'ab',at:2});
  expect(words(backspaceBlock([{id:'d',kind:'divider'},p('x')],'x').blocks)).toEqual(['x']);expect(backspaceBlock([p('only')],'only').blocks).toHaveLength(1);
  expect(words(deleteForward([p('ab'),p('cd')],'ab').blocks)).toEqual(['abcd']);
 });
 it('turns a line into another kind and keeps its words',()=>{
  const {blocks}=turnInto([p('Words')],'Words','todo');expect(blocks[0]).toMatchObject({kind:'todo',text:'Words',checked:false});const rule=turnInto([p('')],'','divider');expect(rule.blocks.map(b=>b.kind)).toEqual(['divider','paragraph']);expect(rule.caret?.id).toBe(rule.blocks[1].id);expect(turnInto([p('')],'','table').blocks[0]).toMatchObject({kind:'table',rows:[['',''],['','']]});
 });
 it('puts a block over an empty line, or below a line with words',()=>{const frame:SpecBlock={id:'f',kind:'frame',nodeId:'x'};expect(insertBlock([p('','e')],'e',frame).blocks.map(b=>b.kind)).toEqual(['frame','paragraph']);expect(insertBlock([p('words')],'words',frame).blocks.map(b=>b.kind)).toEqual(['paragraph','frame','paragraph']);});
 it('moves, indents, toggles and removes, and a page is never left empty',()=>{
  expect(words(moveBlockTo([p('a'),p('b'),p('c')],'a',3))).toEqual(['b','c','a']);expect(words(moveBlockTo([p('a'),p('b'),p('c')],'c',0))).toEqual(['c','a','b']);
  expect(indentBlock([li('a'),li('b')],'b',1)[1]).toMatchObject({indent:1});expect(indentBlock([li('a')],'a',1)[0]).not.toHaveProperty('indent');expect(indentBlock([li('a'),li('b',1)],'b',-1)[1]).not.toHaveProperty('indent');
  expect(toggleTodo([{id:'t',kind:'todo',text:'',checked:false}],'t')[0]).toMatchObject({checked:true});expect(removeBlock([p('a')],'a').blocks).toHaveLength(1);
 });
 it('knows markdown prefixes and slash queries',()=>{
  expect(markdownShortcut('## ')).toEqual({kind:'heading',level:2});expect(markdownShortcut('- ')?.kind).toBe('bullet');expect(markdownShortcut('12. ')?.kind).toBe('number');expect(markdownShortcut('> ')?.kind).toBe('quote');expect(markdownShortcut('[] ')?.kind).toBe('todo');expect(markdownShortcut('[x] ')).toEqual({kind:'todo',checked:true});expect(markdownShortcut('```')?.kind).toBe('code');expect(markdownShortcut('---')?.kind).toBe('divider');expect(markdownShortcut('hello ')).toBeUndefined();
  expect(slashQuery('/hea')).toEqual({start:0,query:'hea'});expect(slashQuery('word /t')).toEqual({start:5,query:'t'});expect(slashQuery('a/b')).toBeUndefined();expect(slashQuery('/one two')).toBeUndefined();expect(matchCommands('frame')[0].id).toBe('frame');expect(matchCommands('check')[0].id).toBe('todo');for(const typed of ['todo','to-do','TODO'])expect(matchCommands(typed).map(c=>c.id)).toEqual(['todo']);for(const c of matchCommands(''))expect(matchCommands(c.label.split(' ')[0])).toContain(c);
  expect(wrapMark('a b c',2,3,'**')).toEqual({value:'a **b** c',start:4,end:5});expect(wrapMark('a **b** c',4,5,'**')).toEqual({value:'a b c',start:2,end:3});
 });
});
describe('markdown',()=>{
 const blocks:SpecBlock[]=[{id:'1',kind:'heading',level:2,text:'Title'},p('Body **bold**','2'),{id:'3',kind:'bullet',text:'one'},{id:'4',kind:'bullet',text:'nested',indent:1},{id:'5',kind:'number',text:'first'},{id:'6',kind:'number',text:'second'},{id:'7',kind:'todo',text:'open',checked:false},{id:'8',kind:'todo',text:'done',checked:true},{id:'9',kind:'quote',text:'said'},{id:'a',kind:'code',text:'let a=1',language:'ts'},{id:'b',kind:'divider'},{id:'c',kind:'table',rows:[['a','b|c'],['1','2']]},{id:'d',kind:'frame',nodeId:'n1',name:'Screen'}];
 it('writes plain markdown an agent can read',()=>{expect(specMarkdown(blocks)).toBe('## Title\n\nBody **bold**\n\n- one\n  - nested\n1. first\n2. second\n- [ ] open\n- [x] done\n\n> said\n\n```ts\nlet a=1\n```\n\n---\n\n| a | b\\|c |\n| --- | --- |\n| 1 | 2 |\n\n[Screen](forma://layer/n1)');});
 it('reads it back into the same blocks',()=>{const back=markdownBlocks(specMarkdown(blocks),blocks);expect(back.map(({id:_,...b})=>b)).toEqual(blocks.map(({id:_,...b})=>b));});
 it('keeps an image a round trip refers to and refuses a dangling one',()=>{const image:SpecBlock={id:'img',kind:'image',src:'data:image/png;base64,AAAA',width:2,height:2};expect(specMarkdown([image])).toBe('![Image](forma://image/img)');expect(markdownBlocks(specMarkdown([image]),[image])[0]).toEqual(image);expect(()=>markdownBlocks('![Image](forma://image/gone)')).toThrow(/Invalid spec/);});
 it('turns stored marks into runs',()=>{expect(specInlineMarks('**a** b','Mono')).toEqual({text:'a b',runs:[{start:0,end:1,fontWeight:700}]});});
});
describe('page layout',()=>{
 const page=(blocks:SpecBlock[],extra={})=>node('spec',{id:'s',x:10,y:20,width:600,height:100,spec:{version:1,blocks},...extra}),none=()=>undefined;
 it('stacks blocks downward and measures a taller page for more words',()=>{const short=layoutSpec(page([p('one')]),none),long=layoutSpec(page([p('words '.repeat(400))]),none);expect(long.height).toBeGreaterThan(short.height);const made=layoutSpec(page([{id:'h',kind:'heading',level:1,text:'T'},p('b')]),none).layers;expect(made[1].y).toBeGreaterThan(made[0].y+made[0].height);});
 it('numbers across a nested list and restarts after other text',()=>{const made=layoutSpec(page([{id:'a',kind:'number',text:'x'},{id:'b',kind:'bullet',text:'y',indent:1},{id:'c',kind:'number',text:'z'},p('gap'),{id:'d',kind:'number',text:'w'}]),none).layers.filter(n=>n.type==='text').map(n=>n.text);expect(made).toEqual(['1.','x','•','y','2.','z','gap','1.','w']);});
 it('follows a frame: live contents, scaled to the page, never another spec',()=>{
  const frame=node('frame',{id:'f',x:900,y:0,width:1008,height:400}),child=node('rectangle',{id:'c',parentId:'f',x:900,y:0}),other=node('spec',{id:'o',parentId:'f'}),s=page([{id:'b',kind:'frame',nodeId:'f'}]),nodes=[frame,child,other,s],out=layoutSpec(s,specLookup([{id:'p',nodes}],nodes));
  expect(out.frames[0]).toMatchObject({width:504,height:200,scale:.5});expect(out.frames[0].nodes.map(n=>n.id)).toEqual(['s-b-f','s-b-c']);expect(out.frames[0].nodes[1].parentId).toBe('s-b-f');
  const self=page([{id:'b',kind:'frame',nodeId:'s'}]);expect(layoutSpec(self,specLookup([{id:'p',nodes:[self]}],[self])).frames).toEqual([]);
 });
 it('settles height to the words, and a height drag sets the floor',()=>{
  const d=blankDocument(),s=page([p('one')]);d.pages[0].nodes=[s];settleSpecs(d);const natural=s.height;expect(natural).toBeLessThan(200);const before=structuredClone(d);s.height=700;settleSpecs(d,before);expect(s.height).toBe(700);expect(s.minHeight).toBe(700);s.width=100;settleSpecs(d);expect(s.width).toBe(320);
 });
 it('becomes real layers for outputs that walk layers',()=>{const s=page([p('one')]),flat=flattenSpecs([s],[]);expect(flat[0]).toMatchObject({id:'s',type:'frame'});expect(flat[0]).not.toHaveProperty('spec');expect(flat[1]).toMatchObject({type:'text',text:'one',parentId:'s',x:58,y:68});expect(flattenSpecs([node('rectangle')],[])[0].type).toBe('rectangle');});
 it('opens with a blank line ready',()=>{expect(paragraph().kind).toBe('paragraph');});
});
