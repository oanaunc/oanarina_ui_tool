import {describe,expect,it} from 'vitest';
import {blankDocument,node,parseDocument} from '../src/model';
import {allBlocks,markdownBlocks,paragraph,specInlineMarks,specMarkdown,specRows,validateSpec} from '../src/spec';
import type {SpecBlock} from '../src/spec';
import {applyTextReplacements,findDocumentText} from '../src/text-search';
import {backspaceBlock,deleteForward,dropBlocks,dropPlace,duplicateBlock,indentBlock,insertAfter,insertBlock,markdownShortcut,matchCommands,moveBlockBeside,moveBlockStep,moveBlockTo,pickBlocks,removeBlock,slashQuery,splitBlock,toggleOpen,toggleTodo,turnInto,wrapMark} from '../src/spec-editing';
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
describe('find and replace in specs',()=>{
 const doc=()=>{const d=blankDocument(),blocks:SpecBlock[]=[{id:'a',kind:'paragraph',text:'Buy now'},{id:'b',kind:'heading',level:2,text:'Buy later'},{id:'t',kind:'table',rows:[['Buy','x'],['y','buy']]},{id:'c',kind:'divider'}];d.pages[0].nodes=[node('spec',{id:'s',spec:{version:1,blocks}} as never)];return d;},options=(d:ReturnType<typeof blankDocument>)=>({query:'buy',scope:'document' as const,pageId:d.pages[0].id,selectionIds:[],caseSensitive:false,wholeWord:false,includeHidden:false});
 it('finds text in blocks and table cells',()=>{const d=doc(),found=findDocumentText(d,options(d));expect(found.matches.map(m=>m.spot)).toEqual([{block:'a'},{block:'b'},{block:'t',row:0,column:0},{block:'t',row:1,column:1}]);expect(found.matches[0].nodeId).toBe('s');});
 it('replaces in place, leaves everything else, and refuses stale results',()=>{const d=doc(),found=findDocumentText(d,options(d)),plan=applyTextReplacements(d,found,'Get');expect(plan.replaced).toBe(4);const blocks=d.pages[0].nodes[0].spec!.blocks as any[];expect(blocks[0].text).toBe('Get now');expect(blocks[1].text).toBe('Get later');expect(blocks[2].rows).toEqual([['Get','x'],['y','Get']]);expect(blocks[3].kind).toBe('divider');expect(()=>applyTextReplacements(d,found,'Again')).toThrow(/Search again/);});
 it('skips a locked spec',()=>{const d=doc();d.pages[0].nodes[0].locked=true;const found=findDocumentText(d,options(d)),plan=applyTextReplacements(d,found,'Get');expect(plan.skipped).toBe(4);expect((d.pages[0].nodes[0].spec!.blocks[0] as any).text).toBe('Buy now');});
});
const toggle=(text:string,blocks:SpecBlock[],open=true,id=text):SpecBlock=>({id,kind:'toggle',text,blocks,...(open?{open:true}:{})});
describe('toggle blocks',()=>{
 it('validates nested blocks, ids across levels, depth and the open flag',()=>{
  const d=blankDocument();d.pages[0].nodes=[node('spec',{spec:{version:1,blocks:[toggle('t',[p('a'),toggle('u',[p('b')],false)])]}})];expect(parseDocument(JSON.stringify(d)).pages[0].nodes[0].spec?.blocks[0]).toMatchObject({kind:'toggle',open:true});
  const refuse=(blocks:unknown[],text:RegExp)=>expect(()=>validateSpec({version:1,blocks})).toThrow(text);
  refuse([{id:'t',kind:'toggle',text:'',blocks:[]},{id:'t',kind:'paragraph',text:''}],/own id/);refuse([toggle('t',[p('t')])],/own id/);refuse([{id:'t',kind:'toggle',text:'',open:'yes',blocks:[]}],/open or closed/);refuse([{id:'t',kind:'toggle',text:''}],/block list/);refuse([{id:'t',kind:'toggle',text:'',blocks:[],extra:1}],/unknown block field/);refuse([{id:'t',kind:'toggle',blocks:[]}],/must be a string/);
  refuse([toggle('t',[{id:'x',kind:'nope'} as never])],/unknown block kind/);let deep:SpecBlock=p('end');for(let i=0;i<9;i++)deep=toggle('t'+i,[deep]);refuse([deep],/nested too deeply/);refuse([toggle('t',Array.from({length:4001},(_,i)=>p('',String(i))))],/too many blocks/);
  expect(()=>validateSpec({version:1,blocks:[toggle('empty',[])]})).not.toThrow();
 });
 it('round trips through Markdown as a details element, with its state and nesting',()=>{
  const blocks=[toggle('Why & how <now>',[{id:'h',kind:'heading',level:2,text:'Inside'},{id:'b1',kind:'bullet',text:'one'},{id:'b2',kind:'bullet',text:'two',indent:1},{id:'c',kind:'code',text:'</details>\n<details>'},toggle('Deep',[p('words')],false)]),p('after')],markdown=specMarkdown(blocks);
  expect(markdown).toContain('<details open>\n<summary>Why &amp; how &lt;now></summary>');expect(markdown).toContain('<details>\n<summary>Deep</summary>');
  const back=markdownBlocks(markdown);expect(back).toHaveLength(2);expect(back[0]).toMatchObject({kind:'toggle',text:'Why & how <now>',open:true});const held=(back[0] as Extract<SpecBlock,{kind:'toggle'}>).blocks;expect(held.map(b=>b.kind)).toEqual(['heading','bullet','bullet','code','toggle']);expect(held[2]).toMatchObject({indent:1});expect(held[3]).toMatchObject({text:'</details>\n<details>'});expect(held[4]).not.toHaveProperty('open');expect(back[1]).toMatchObject({text:'after'});expect(specMarkdown(back)).toBe(markdown);validateSpec({version:1,blocks:back});
 });
 it('reads a title with a line break, one-line details, a missing close and no summary',()=>{
  const line=markdownBlocks(specMarkdown([toggle('one\ntwo',[p('x')],false)]))[0];expect(line).toMatchObject({text:'one\ntwo'});
  expect(markdownBlocks('<details><summary>Short</summary>body</details>')[0]).toMatchObject({kind:'toggle',text:'Short',blocks:[{kind:'paragraph',text:'body'}]});
  expect(markdownBlocks('<details open>\n<summary>Open end</summary>\n\nrest')[0]).toMatchObject({kind:'toggle',open:true,blocks:[{text:'rest'}]});
  expect(markdownBlocks('<details>\nplain\n</details>')[0]).toMatchObject({kind:'toggle',text:'',blocks:[{text:'plain'}]});
  const empty=markdownBlocks('<details><summary>Nothing</summary></details>')[0] as Extract<SpecBlock,{kind:'toggle'}>;expect(empty.blocks).toHaveLength(1);expect(empty.blocks[0].kind).toBe('paragraph');
  expect(markdownBlocks('</details>')[0]).toMatchObject({kind:'paragraph',text:'</details>'});
  expect(()=>markdownBlocks('<details>\n'.repeat(12))).toThrow(/nested too deeply/);expect(()=>markdownBlocks(Array(4100).fill('line').join('\n'))).toThrow(/too many blocks/);
 });
 it('keeps images and frames a round trip refers to inside a toggle',()=>{const image:SpecBlock={id:'img',kind:'image',src:'data:image/png;base64,AA==',width:2,height:2},frame:SpecBlock={id:'f',kind:'frame',nodeId:'layer',name:'Screen'},blocks=[toggle('t',[image,frame])],back=markdownBlocks(specMarkdown(blocks),blocks)[0] as Extract<SpecBlock,{kind:'toggle'}>;expect(back.blocks[0]).toMatchObject({kind:'image',src:image.src});expect(back.blocks[1]).toMatchObject({kind:'frame',nodeId:'layer'});});
 it('lists what a reader sees, and numbers each list on its own',()=>{const n=(id:string):SpecBlock=>({id,kind:'number',text:id}),blocks=[n('a'),toggle('t',[n('b'),n('c')]),n('d'),toggle('hide',[n('e')],false)];expect(specRows(blocks).map(r=>[r.block.id,r.depth,r.number])).toEqual([['a',0,1],['t',0,0],['b',1,1],['c',1,2],['d',0,1],['hide',0,0]]);expect(specRows(blocks).find(r=>r.block.id==='b')?.above?.id).toBe('t');expect(allBlocks(blocks).map(b=>b.id)).toContain('e');});
 it('paints a closed toggle shorter, indents what it holds, and keeps frames inside live',()=>{
  const page=(open:boolean)=>node('spec',{id:'s',width:600,height:100,spec:{version:1,blocks:[toggle('Title',[p('Hidden words'),{id:'f',kind:'frame',nodeId:'r'}],open,'tg')]}}),frame=node('frame',{id:'r',x:0,y:0,width:100,height:50}),find=specLookup([{id:'p',nodes:[frame]}],[frame]),open=layoutSpec(page(true),find),closed=layoutSpec(page(false),find);
  expect(open.height).toBeGreaterThan(closed.height);expect(closed.frames).toHaveLength(0);expect(open.frames).toHaveLength(1);expect(open.frames[0].root.id).toBe('r');expect(closed.layers.map(l=>l.text)).not.toContain('Hidden words');
  const held=open.layers.find(l=>l.text==='Hidden words')!,title=open.layers.find(l=>l.text==='Title')!,mark=open.layers.find(l=>l.type==='path')!;expect(held.x).toBe(72);expect(title.x).toBe(72);expect(mark).toMatchObject({x:48,width:16,height:16,fill:'#8f8f8f'});expect(mark.path).not.toBe(closed.layers.find(l=>l.type==='path')!.path);
  const flat=flattenSpecs([node('spec',{...page(false),x:10,y:20})],[]);expect(flat.some(l=>l.text==='Title')).toBe(true);expect(flat.some(l=>l.text==='Hidden words')).toBe(false);
 });
 it('Enter on a title opens the first line inside, a closed toggle makes the next toggle, and an empty one steps out',()=>{
  const open=splitBlock([toggle('Title',[p('','e')])],'Title',5);expect(open.caret).toEqual({id:'e',at:0});expect(open.blocks).toHaveLength(1);
  const split=splitBlock([toggle('Title',[p('x')])],'Title',2),held=(split.blocks[0] as Extract<SpecBlock,{kind:'toggle'}>);expect(held.text).toBe('Ti');expect(words(held.blocks)).toEqual(['tle','x']);expect(split.caret?.id).toBe(held.blocks[0].id);
  const closed=splitBlock([toggle('Title',[p('x')],false)],'Title',5);expect(closed.blocks.map(b=>b.kind)).toEqual(['toggle','toggle']);expect(closed.blocks[0]).toMatchObject({text:'Title'});expect(closed.caret?.id).toBe(closed.blocks[1].id);
  expect(splitBlock([toggle('',[p('','e')])],'',0).blocks[0]).toMatchObject({kind:'paragraph',text:''});expect(splitBlock([toggle('',[p('words')])],'',0).blocks[0].kind).toBe('toggle');
 });
 it('every line edit works inside a toggle',()=>{
  const list=[toggle('t',[p('one'),p('two')])],inner=(blocks:SpecBlock[])=>(blocks[0] as Extract<SpecBlock,{kind:'toggle'}>).blocks;
  expect(words(inner(splitBlock(list,'one',1).blocks))).toEqual(['o','ne','two']);expect(words(inner(turnInto(list,'two','bullet').blocks)).length).toBe(2);expect(inner(turnInto(list,'two','bullet').blocks)[1].kind).toBe('bullet');expect(words(inner(backspaceBlock(list,'two').blocks))).toEqual(['onetwo']);expect(words(inner(deleteForward(list,'one').blocks))).toEqual(['onetwo']);expect(words(inner(removeBlock(list,'one').blocks))).toEqual(['two']);expect(inner(removeBlock([toggle('t',[p('only')])],'only').blocks)).toHaveLength(1);
  expect(inner(toggleTodo([toggle('t',[{id:'d',kind:'todo',text:'',checked:false}])],'d'))[0]).toMatchObject({checked:true});
  expect(words(inner(insertBlock(list,'one',{id:'r',kind:'divider'}).blocks))).toEqual(['one','divider','two']);
  expect(words(inner(moveBlockTo(list,'two',0)))).toEqual(['two','one']);
 });
 it('Backspace unwraps a toggle and keeps what it holds, and the first line joins the title',()=>{
  expect(words(backspaceBlock([toggle('t',[p('a'),p('b')])],'t').blocks)).toEqual(['t','a','b']);expect(backspaceBlock([toggle('t',[p('a')])],'t').blocks[0].kind).toBe('paragraph');
  const joined=backspaceBlock([toggle('t',[p('a')])],'a');expect(joined.blocks[0]).toMatchObject({kind:'toggle',text:'ta'});expect(joined.caret).toEqual({id:'t',at:1});expect((joined.blocks[0] as Extract<SpecBlock,{kind:'toggle'}>).blocks).toHaveLength(1);
  const below=backspaceBlock([toggle('t',[p('a')]),p('b')],'b');expect((below.blocks[0] as Extract<SpecBlock,{kind:'toggle'}>).blocks[0]).toMatchObject({text:'ab'});expect(below.blocks).toHaveLength(1);
  const closed=backspaceBlock([toggle('t',[p('a')],false),p('b')],'b');expect(closed.blocks[0]).toMatchObject({text:'tb'});
  const forward=deleteForward([p('x'),toggle('t',[p('a')],false)],'x');expect(words(forward.blocks)).toEqual(['xt','a']);
 });
 it('Tab goes into a toggle and Shift-Tab comes back out, after list indent is used up',()=>{
  const blocks=[toggle('t',[p('','e')],false),p('line')],moved=indentBlock(blocks,'line',1);expect(moved).toHaveLength(1);expect(moved[0]).toMatchObject({open:true,blocks:[{text:'line'}]});expect(words(indentBlock(moved,'line',-1))).toEqual(['t','line']);
  const items=[toggle('t',[li('a'),li('b')])],deep=indentBlock(items,'b',1);expect((deep[0] as Extract<SpecBlock,{kind:'toggle'}>).blocks[1]).toMatchObject({indent:1});expect((indentBlock(deep,'b',-1)[0] as Extract<SpecBlock,{kind:'toggle'}>).blocks).toHaveLength(2);expect(indentBlock(indentBlock(deep,'b',-1),'b',-1)).toHaveLength(2);
 });
 it('moves through toggles by keyboard and by drop, and never into itself',()=>{
  const blocks=[p('a'),toggle('t',[p('in')]),p('b')];expect(moveBlockStep(blocks,'a',false)[0].id).toBe('t');expect((moveBlockStep(blocks,'a',false)[0] as Extract<SpecBlock,{kind:'toggle'}>).blocks.map(b=>b.id)).toEqual(['a','in']);expect(moveBlockStep(blocks,'in',true).map(b=>b.id)).toEqual(['a','in','t','b']);expect(moveBlockStep(blocks,'in',false).map(b=>b.id)).toEqual(['a','t','in','b']);expect(moveBlockStep(blocks,'b',true)[1]).toMatchObject({blocks:[{id:'in'},{id:'b'}]});
  expect(moveBlockBeside(blocks,'t','in','after')).toBe(blocks);expect(moveBlockBeside(blocks,'t','t','after')).toBe(blocks);
  expect(dropPlace(blocks,0,0)).toEqual({anchor:'a',where:'before'});expect(dropPlace(blocks,2,0)).toEqual({anchor:'t',where:'first'});expect(dropPlace(blocks,3,1)).toEqual({anchor:'in',where:'after'});expect(dropPlace(blocks,3,0)).toEqual({anchor:'b',where:'before'});expect(dropPlace(blocks,4,0)).toEqual({anchor:'b',where:'after'});
  const closed=[toggle('t',[p('in')],false),p('b')],into=moveBlockBeside(closed,'b','t','last')[0] as Extract<SpecBlock,{kind:'toggle'}>;expect(into.open).toBe(true);expect(words(into.blocks)).toEqual(['in','b']);
 });
 it('selects, copies, removes and duplicates a toggle with what it holds',()=>{
  const blocks=[toggle('t',[p('a')]),p('b')];expect(specMarkdown(pickBlocks(blocks,new Set(['t','a'])))).not.toContain('\n\na\n\n<details>');expect(pickBlocks(blocks,new Set(['t','a']))).toHaveLength(1);expect(pickBlocks(blocks,new Set(['a']))[0].id).toBe('a');expect(dropBlocks(blocks,new Set(['t'])).map(b=>b.id)).toEqual(['b']);
  const copy=duplicateBlock(blocks,'t').blocks;expect(copy).toHaveLength(3);validateSpec({version:1,blocks:copy});expect((copy[1] as Extract<SpecBlock,{kind:'toggle'}>).blocks[0].id).not.toBe('a');
  expect(insertAfter(blocks,'t',p('new'))[0]).toMatchObject({blocks:[{text:'new'},{text:'a'}]});expect(insertAfter([toggle('t',[p('a')],false)],'t',p('new')).map(b=>'text' in b&&b.text)).toEqual(['t','new']);
  expect(toggleOpen(blocks,'t')[0]).not.toHaveProperty('open');expect(toggleOpen(toggleOpen(blocks,'t'),'t')[0]).toMatchObject({open:true});
 });
 it('turns a line into a toggle and back, and stops at the limits instead of breaking the file',()=>{
  const made=turnInto([p('Words','w')],'w','toggle').blocks[0];expect(made).toMatchObject({kind:'toggle',text:'Words',open:true});expect((made as Extract<SpecBlock,{kind:'toggle'}>).blocks).toHaveLength(1);
  expect(matchCommands('toggle')[0].kind).toBe('toggle');expect(matchCommands('details').map(c=>c.id)).toContain('toggle');
  let deep:SpecBlock=p('end');for(let i=0;i<7;i++)deep=toggle('t'+i,[deep]);const list=[deep];expect(turnInto(list,'end','toggle').blocks).toEqual(expect.anything());let deeper:SpecBlock=p('end');for(let i=0;i<8;i++)deeper=toggle('t'+i,[deeper]);expect(turnInto([deeper],'end','toggle').blocks).toEqual([deeper]);
  const full=[toggle('t',Array.from({length:3999},(_,i)=>p('',String(i))))];expect(splitBlock(full,'0',0).blocks).toBe(full);
 });
 it('finds and replaces words inside a toggle, closed or open',()=>{const d=blankDocument();d.pages[0].nodes=[node('spec',{id:'s',spec:{version:1,blocks:[toggle('Plan',[p('hidden plan')],false)]}})];const options=(d:ReturnType<typeof blankDocument>)=>({query:'plan',scope:'document' as const,pageId:d.pages[0].id,selection:[],caseSensitive:false,wholeWord:false} as never),found=findDocumentText(d,options(d));expect(found.matches.length).toBe(2);applyTextReplacements(d,found,'Goal');const held=d.pages[0].nodes[0].spec!.blocks[0] as Extract<SpecBlock,{kind:'toggle'}>;expect(held.text).toBe('Goal');expect(held.blocks[0]).toMatchObject({text:'hidden Goal'});});
});

