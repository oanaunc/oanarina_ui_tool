import {describe,expect,it} from 'vitest';
import {blankDocument,node,parseDocument} from '../src/model';
import {applyTextReplacements,findDocumentText,replaceTextMatches,TEXT_SEARCH_LIMIT,validateTextReplacement} from '../src/text-search';
import type {TextReplacementPlan,TextSearchOptions} from '../src/text-search';
import {useEditor} from '../src/store';
import {DesktopDocumentTracker} from '../src/desktop-lifecycle';
import {currentTextOutline,textOutlineSignature} from '../src/text-outline';
const fixture=()=>{const d=blankDocument();d.pages[0].nodes=[node('text',{name:'First',text:'Hello red world. Hello blue world.'})];d.pages.push({id:'other',name:'Other',nodes:[node('text',{text:'HELLO [world]. 💙 hello'})],comments:[]});return d;};
const options=(d:ReturnType<typeof fixture>,patch:Partial<TextSearchOptions>={}):TextSearchOptions=>({query:'hello',scope:'document',pageId:d.pages[0].id,selectionIds:[],caseSensitive:false,wholeWord:false,includeHidden:true,...patch});
function replace(d:ReturnType<typeof fixture>,query:string,replacement:string){useEditor.getState().load(d);const s=useEditor.getState(),report=findDocumentText(s.doc,options(d,{query}));let plan:TextReplacementPlan;s.edit(next=>{plan=applyTextReplacements(next,report,replacement);},next=>validateTextReplacement(next,plan),{explicitTextRuns:report.matches.map(m=>({pageId:m.pageId,nodeId:m.nodeId}))});return useEditor.getState();}
describe('literal document text search and atomic replacement',()=>{
 it('finds literal punctuation, Unicode, case and whole-word boundaries',()=>{
  const d=fixture();expect(findDocumentText(d,options(d)).matches).toHaveLength(4);expect(findDocumentText(d,options(d,{caseSensitive:true})).matches).toHaveLength(1);
  expect(findDocumentText(d,options(d,{query:'[world].'})).matches).toHaveLength(1);expect(findDocumentText(d,options(d,{query:'💙'})).matches[0]).toMatchObject({start:15,end:17});
  d.pages[0].nodes[0].text='red redness pre_red e\u0301 e';expect(findDocumentText(d,options(d,{query:'red',wholeWord:true})).matches).toHaveLength(1);expect(findDocumentText(d,options(d,{query:'e',wholeWord:true})).matches).toHaveLength(1);
 });
 it('scopes to a captured page/selection tree and respects inherited visibility/locks',()=>{
  const d=fixture(),p=d.pages[0],parent=node('frame',{locked:true,visible:false}),child=node('text',{parentId:parent.id,text:'hello'});p.nodes.push(parent,child);
  const report=findDocumentText(d,options(d,{scope:'selection',selectionIds:[parent.id]}));expect(report.matches).toHaveLength(1);expect(report.matches[0]).toMatchObject({locked:true,hidden:true});
  expect(findDocumentText(d,options(d,{scope:'selection',selectionIds:[parent.id],includeHidden:false})).matches).toEqual([]);expect(findDocumentText(d,options(d,{scope:'page'})).matches).toHaveLength(3);
 });
 it('bounds matches without silently offering incomplete Replace all',()=>{
  const d=fixture();d.pages[0].nodes[0].text='a'.repeat(TEXT_SEARCH_LIMIT+1);const report=findDocumentText(d,options(d,{query:'a',scope:'page'}));expect(report.matches).toHaveLength(TEXT_SEARCH_LIMIT);expect(report.limited).toBe(true);expect(()=>applyTextReplacements(d,report,'b')).toThrow(/Refine/);expect(findDocumentText(d,options(d,{query:''})).matches).toEqual([]);expect(()=>findDocumentText(d,options(d,{query:'a'.repeat(513)}))).toThrow(/512/);
 });
 it('preserves disjoint rich runs on same-length replacement through the entire editor pipeline',()=>{
  const d=fixture(),n=d.pages[0].nodes[0];n.text='cat RED cat';n.textRuns=[{start:0,end:3,fontWeight:700},{start:4,end:7,fill:'#ff0000'},{start:8,end:11,fontStyle:'italic'}];n.textOutline={path:'M0 0L10 10',signature:textOutlineSignature(n)};
  const s=replace(d,'cat','dog'),result=s.doc.pages[0].nodes[0];expect(result.text).toBe('dog RED dog');expect(result.textRuns).toEqual(n.textRuns);expect(currentTextOutline(result)).toBeUndefined();expect(s.past).toHaveLength(1);s.undo();expect(useEditor.getState().doc.pages[0].nodes[0]).toEqual(n);useEditor.getState().redo();expect(useEditor.getState().doc.pages[0].nodes[0].text).toBe('dog RED dog');expect(()=>parseDocument(JSON.stringify(useEditor.getState().doc))).not.toThrow();
 });
 it('uses first matched character formatting and preserves untouched text through growing/deleting replacements',()=>{
  const n=node('text',{text:'a RED b RED c',textRuns:[{start:2,end:5,fill:'#ff0000'},{start:8,end:11,fontWeight:700}]});const d=fixture();d.pages[0].nodes=[n];const found=findDocumentText(d,options(d,{query:'RED',scope:'page'}));const next=replaceTextMatches(n,found.matches,'blue');expect(next.text).toBe('a blue b blue c');expect(next.textRuns).toEqual([{start:2,end:6,fill:'#ff0000'},{start:9,end:13,fontWeight:700}]);expect(replaceTextMatches(n,found.matches,'').text).toBe('a  b  c');expect(n.text).toBe('a RED b RED c');
 });
 it('qualifies headless matches by page and rejects duplicate IDs when validating saved files',()=>{
  const d=fixture();d.pages[0].nodes=[node('text',{id:'same',text:'cat A cat',textRuns:[{start:4,end:5,fill:'#ff0000'}]})];d.pages[1].nodes=[node('text',{id:'same',text:'cat B cat',textRuns:[{start:4,end:5,fontWeight:700}]})];expect(()=>parseDocument(JSON.stringify(d))).toThrow(/unique across pages/);
  const original=structuredClone(d),report=findDocumentText(d,options(d,{query:'cat'}));applyTextReplacements(d,report,'dog');expect(d.pages.map(p=>p.nodes[0].text)).toEqual(['dog A dog','dog B dog']);expect(d.pages[0].nodes[0].textRuns).toEqual(original.pages[0].nodes[0].textRuns);expect(d.pages[1].nodes[0].textRuns).toEqual(original.pages[1].nodes[0].textRuns);
 });
 it('allows only bounded page-qualified explicit rich-text targets and keeps normal reconciliation on other pages',()=>{
  const d=fixture();d.pages[0].nodes=[node('text',{id:'same',text:'cat RED cat',textRuns:[{start:4,end:7,fill:'#ff0000'}]})];d.pages[1].nodes=[node('text',{id:'same',text:'cat RED cat',textRuns:[{start:4,end:7,fontWeight:700}]})];useEditor.getState().load(d);
  useEditor.getState().edit(next=>{next.pages[0].nodes[0].text='dog RED dog';next.pages[1].nodes[0].text='x '+next.pages[1].nodes[0].text;},undefined,{explicitTextRuns:[{pageId:d.pages[0].id,nodeId:'same'}]});expect(useEditor.getState().doc.pages[0].nodes[0].textRuns).toEqual(d.pages[0].nodes[0].textRuns);expect(useEditor.getState().doc.pages[1].nodes[0].textRuns).toEqual([{start:6,end:9,fontWeight:700}]);
  const before=useEditor.getState().doc;expect(()=>useEditor.getState().edit(()=>{},undefined,{explicitTextRuns:[{pageId:'absent',nodeId:'same'}]})).toThrow(/existing text/);expect(useEditor.getState().doc).toBe(before);
 });
 it('skips locked text explicitly and leaves find navigation outside native dirty/undo state',()=>{
  const d=fixture();d.pages[1].nodes[0].locked=true;useEditor.getState().load(d);const tracker=new DesktopDocumentTracker();tracker.mark(d);const report=findDocumentText(d,options(d));expect(tracker.state(useEditor.getState().doc).dirty).toBe(false);expect(useEditor.getState().past).toEqual([]);
  let plan:TextReplacementPlan;useEditor.getState().edit(next=>{plan=applyTextReplacements(next,report,'Hi');},next=>validateTextReplacement(next,plan),{explicitTextRuns:report.matches.filter(m=>!m.locked).map(m=>({pageId:m.pageId,nodeId:m.nodeId}))});expect(plan!.replaced).toBe(2);expect(plan!.skipped).toBe(2);expect(useEditor.getState().doc.pages[1]).toEqual(d.pages[1]);
 });
 it('refuses stale matches, overlarge growth and split surrogates atomically',()=>{
  const d=fixture(),report=findDocumentText(d,options(d));useEditor.getState().load(d);const before=useEditor.getState().doc;expect(()=>useEditor.getState().edit(next=>{next.pages[0].nodes[0].text='Changed';applyTextReplacements(next,report,'Hi');})).toThrow(/changed/);expect(useEditor.getState().doc).toBe(before);expect(useEditor.getState().past).toEqual([]);
  const emoji=node('text',{text:'💙'});expect(()=>replaceTextMatches(emoji,[{start:0,end:1,sourceText:emoji.text}],'x')).toThrow(/Unicode/);
  d.pages[0].nodes[0].text='x'.repeat(11);const many=findDocumentText(d,options(d,{query:'x',scope:'page'}));expect(()=>applyTextReplacements(d,many,'y'.repeat(100000))).toThrow(/too much/);expect(d.pages[0].nodes[0].text).toBe('x'.repeat(11));
 });
 it('checks the final candidate for removed or overwritten matched text before committing',()=>{
  const d=fixture(),report=findDocumentText(d,options(d));useEditor.getState().load(d);const before=useEditor.getState().doc;let plan:TextReplacementPlan;expect(()=>useEditor.getState().edit(next=>{plan=applyTextReplacements(next,report,'Hi');next.pages[0].nodes=[];},next=>validateTextReplacement(next,plan))).toThrow(/disappeared/);expect(useEditor.getState().doc).toBe(before);
 });
});
