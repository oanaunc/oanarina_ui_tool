import {describe,expect,it} from 'vitest';
import {decodeFigContainerInWorker} from '../src/fig-container-core';
import {figDocumentContent} from '../src/fig-document';
import {collaborativeText,figInlineMarks,figSpecContent} from '../src/fig-spec-document';
import {readCrdtDocument} from '../src/fig-document-crdt';
import {mapFigScene} from '../src/fig-scene';
import {synchronizeComponents} from '../src/components-model';
import {reflow} from '../src/layout';
import {encodeMessage,encodeSchema,figCanvas} from './helpers/fig-fixture';
import type {KiwiDefinition} from '../src/fig-kiwi';
/** Everything here is self-authored. The specBlock fields follow the real format; the routes for layers without them match by shape. */
const id=(n:number)=>({sessionID:7,localID:n});
const at=(x:number,y:number)=>({m00:1,m01:0,m02:x,m10:0,m11:1,m12:y});
const page=(...extra:Record<string,unknown>[])=>({nodeChanges:[{guid:id(1),type:'DOCUMENT'},{guid:id(2),type:'CANVAS',name:'Page',parentIndex:{guid:id(1),position:'a'}},...extra],blobs:[] as {bytes:number[]}[]});
const spec=(fields:Record<string,unknown>)=>({guid:id(3),type:'SPEC_BLOCK',name:'Hierarchy evaluation',parentIndex:{guid:id(2),position:'a'},size:{x:850,y:1100},transform:at(40,60),previewRasterSnapshot:{paint:{type:'IMAGE',image:{hash:new Array(20).fill(1)}}},...fields});
const nodes=(message:Record<string,unknown>)=>{const out=mapFigScene({message,images:{}},'File');return {out,all:out.document.pages[0].nodes,text:out.document.pages[0].nodes.filter(n=>n.type==='text')};};
const none=()=>undefined;
const doc={type:'doc',content:[{type:'heading',attrs:{level:1},content:[{type:'text',text:'Hierarchy evaluation'}]},{type:'paragraph',content:[{type:'text',text:'First '},{type:'text',text:'paragraph.'}]},{type:'bullet_list',content:[{type:'list_item',content:[{type:'paragraph',content:[{type:'text',text:'One'}]}]},{type:'list_item',content:[{type:'paragraph',content:[{type:'text',text:'Two'}]}]}]},{type:'ordered_list',content:[{type:'list_item',content:[{type:'text',text:'Step'}]}]},{type:'heading',attrs:{level:2},content:[{type:'text',text:'Second heading'}]}]};
const expected=[{kind:'heading',level:1,text:'Hierarchy evaluation'},{kind:'paragraph',text:'First paragraph.'},{kind:'list',ordered:false,items:['One','Two']},{kind:'list',ordered:true,items:['Step']},{kind:'heading',level:2,text:'Second heading'}];
const encoder=new TextEncoder();
const history=(...ops:([number,string]|[number,number])[])=>{let bytes='';const historyOpsWithLoc=ops.map(([start,value])=>{if(typeof value==='number')return {type:'DELETE',range:{startIndex:start,endIndexExclusive:value},rangeShouldBeIteratedInReverse:true};const from=encoder.encode(bytes).length;bytes+=value;return {type:'INSERT',range:{startIndex:start,endIndexExclusive:start+value.length},contentBytesInBuffer:{startIndex:from,endIndexExclusive:encoder.encode(bytes).length}};});return {historyOpsWithIds:[],historyOpsWithLoc,historyStringContentBuffer:encoder.encode(bytes)};};
const block=(n:number,parent:number,position:string,specBlockType:string,text='',fields:Record<string,unknown>={})=>({guid:id(n),type:'SPEC_BLOCK',parentIndex:{guid:id(parent),position},specBlockType,specBlockContent:text?history([0,text]):history(),...fields});
const specPage=(...children:Record<string,unknown>[])=>page(spec({specBlockType:'DOCUMENT',specBlockContent:history()}),...children);
describe('spec pages in the real storage format',()=>{
 it('replays an edit history, including corrections and characters beyond one byte',()=>{
  expect(collaborativeText(history([0,'Medin'],[4,5],[4,'um']))).toBe('Medium');expect(collaborativeText(history([0,'Așa e 🙂'],[2,3],[2,'ă']))).toBe('Așă e 🙂');expect(collaborativeText({snapshotText:'Stored',historyOpsWithLoc:[]})).toBe('Stored');expect(collaborativeText(history())).toBe('');
 });
 it('refuses a history it cannot prove rather than showing wrong words',()=>{
  expect(collaborativeText(history([3,'late']))).toBeUndefined();expect(collaborativeText({historyOpsWithLoc:[{type:'INSERT',range:{startIndex:0,endIndexExclusive:9},contentBytesInBuffer:{startIndex:0,endIndexExclusive:2}}],historyStringContentBuffer:encoder.encode('ab')})).toBeUndefined();expect(collaborativeText({historyOpsWithLoc:[{type:'DELETE',range:{startIndex:0,endIndexExclusive:9}}]})).toBeUndefined();
 });
 it('turns stored markdown marks into formatting',()=>{
  expect(figInlineMarks('**Preserve:** heading *and* ~~body~~ `code` [link](https://example.com) snake_case 2*3*4','Mono')).toEqual({text:'Preserve: heading and body code link snake_case 2*3*4',runs:[{start:0,end:9,fontWeight:700},{start:18,end:21,fontStyle:'italic'},{start:22,end:26,decorations:['line-through']},{start:27,end:31,fontFamily:'Mono'},{start:32,end:36,hyperlink:'https://example.com',decorations:['underline']}]});
 });
 it('imports a page and its child blocks as an editable page instead of an empty frame',()=>{
  const {out,all,text}=nodes(specPage(block(4,3,'a','HEADING_1','Medium'),block(5,3,'b','PARAGRAPH','First paragraph.'),block(6,3,'c','PARAGRAPH'),block(7,3,'d','UNORDERED_LIST_ITEM','**Keep:** this'),block(8,3,'e','UNORDERED_LIST_ITEM','**Test:** that'),block(9,3,'f','PARAGRAPH'))),frame=all.find(n=>n.name==='Hierarchy evaluation')!;
  expect(frame).toMatchObject({type:'frame',layout:'vertical',width:850,height:1100,minHeight:1100,sizingY:'hug'});expect(text.map(n=>n.text)).toEqual(['Medium','First paragraph.','Keep: this\nTest: that']);expect(text[0].fontSize).toBe(40);expect(text[2].listStyle).toBe('bullet');expect(text[2].textRuns).toEqual([{start:0,end:5,fontWeight:700},{start:11,end:16,fontWeight:700}]);expect(all.filter(n=>n.parentId===frame.id).map(n=>n.name)).toEqual(['Medium','First paragraph.','Empty line','Keep: this\nTest: that'.slice(0,60)]);
  expect(all.some(n=>n.name==='Original preview')).toBe(false);expect(out.issues.map(i=>i.code)).toContain('spec-block-text');expect(out.issues.map(i=>i.code)).not.toContain('spec-block-raster');expect(out.document.pages[0].nodes.every(n=>n.width>0)).toBe(true);
 });
 it('keeps its stored page height for a short page and grows past it for a long one',()=>{
  const short=nodes(specPage(block(4,3,'a','PARAGRAPH','One line.'))).all.find(n=>n.type==='frame')!;expect(short.height).toBe(1100);
  const long=nodes(specPage(...Array.from({length:70},(_,i)=>block(4+i,3,String.fromCharCode(40+i),'PARAGRAPH','Paragraph '+i+' '+'words '.repeat(60))))).all.find(n=>n.type==='frame')!;expect(long.height).toBeGreaterThan(1100);
 });
 it('reads the other block kinds in order',()=>{
  const kids=new Map<number,Record<string,unknown>[]>([[3,[block(4,3,'a','HEADING_3','Sub'),block(5,3,'b','CODE_BLOCK','let a=1'),block(6,3,'c','BLOCK_QUOTE','Said'),block(7,3,'d','HORIZONTAL_RULE'),block(8,3,'e','ORDERED_LIST_ITEM','One'),block(9,3,'f','ORDERED_LIST_ITEM','Two',{specBlockIndentLevel:1}),block(10,3,'g','TODO_LIST_ITEM_CHECKED','Done'),block(11,3,'h','TABLE')]],[11,[block(12,11,'a','TABLE_ROW'),block(13,11,'b','TABLE_ROW')]],[12,[block(14,12,'a','TABLE_CELL','A'),block(15,12,'b','TABLE_CELL','B')]],[13,[block(16,13,'a','TABLE_CELL','C')]]]);
  const content=figSpecContent({guid:id(3),specBlockType:'DOCUMENT'},b=>kids.get((b.guid as {localID:number}).localID)??[])!;
  expect(content.blocks).toEqual([{kind:'heading',level:3,text:'Sub'},{kind:'code',text:'let a=1'},{kind:'quote',text:'Said'},{kind:'rule'},{kind:'list',ordered:true,items:['One'],indent:0},{kind:'list',ordered:true,items:['Two'],indent:1},{kind:'paragraph',text:'☑ Done'},{kind:'table',rows:[['A','B'],['C']]}]);
  const all=nodes(page(spec({specBlockType:'DOCUMENT',specBlockContent:history()}),...[...kids.values()].flat())).all;expect(all.filter(n=>n.name==='Cell')).toHaveLength(4);expect(all.find(n=>n.name==='Code')).toBeTruthy();expect(all.find(n=>n.name==='Divider')?.width).toBeGreaterThan(100);
 });
 it('keeps the stored preview when any block cannot be proven, and reports what a page left out',()=>{
  const broken=nodes(specPage(block(4,3,'a','PARAGRAPH','Fine'),{...block(5,3,'b','PARAGRAPH'),specBlockContent:history([9,'bad'])}));expect(broken.all.find(n=>n.name==='Hierarchy evaluation')!.type).toBe('image');expect(broken.out.issues.map(i=>i.code)).toContain('spec-block-raster');
  const embed=nodes(specPage(block(4,3,'a','PARAGRAPH','Words here'),block(5,3,'b','EMBEDDED_CANVAS')));expect(embed.text.map(n=>n.text)).toEqual(['Words here']);expect(embed.all.find(n=>n.name==='Original preview')).toMatchObject({visible:false});expect(embed.out.issues.map(i=>i.code)).toContain('spec-block-embed');
 });
});
describe('spec blocks become editable pages (self-authored fixtures)',()=>{
 it('imports a stored block tree as a frame of text layers in reading order, with the preview kept hidden',()=>{
  const {out,all,text}=nodes(page(spec({richDocument:doc}))),frame=all.find(n=>n.name==='Hierarchy evaluation')!;
  expect(frame).toMatchObject({type:'frame',width:850,height:1100,layout:'vertical',x:40,y:60});expect(text.map(n=>n.text)).toEqual(['Hierarchy evaluation','First paragraph.','One\nTwo','Step','Second heading']);expect(text.map(n=>n.listStyle??'none')).toEqual(['none','none','bullet','number','none']);expect(text[0].fontSize).toBeGreaterThan(text[1].fontSize);expect(text.every(n=>n.parentId===frame.id&&n.textResize==='auto-height')).toBe(true);
  const ys=text.map(n=>n.y);expect([...ys].sort((a,b)=>a-b)).toEqual(ys);const hidden=all.find(n=>n.name==='Original preview')!;expect(hidden).toMatchObject({type:'image',visible:false,ignoreLayout:true,parentId:frame.id});expect(out.issues.map(i=>i.code)).toContain('spec-block-text');expect(out.issues.map(i=>i.code)).not.toContain('spec-block-raster');expect(out.issues.map(i=>i.code)).not.toContain('layout-materialized');
 });
 it('keeps a first edit from rearranging the page, and grows a long page instead of overflowing',()=>{
  const {all}=nodes(page(spec({richDocument:doc}))),copy=structuredClone(all);synchronizeComponents({pages:[{nodes:copy}]} as never);reflow(copy);for(const n of copy.filter(n=>n.type==='text'))expect(n.y).toBeCloseTo(all.find(a=>a.id===n.id)!.y,3);
  const long={type:'doc',content:Array.from({length:80},(_,i)=>({type:'paragraph',content:[{type:'text',text:'Paragraph '+i+' '+'words '.repeat(60)}]}))},grown=nodes(page(spec({richDocument:long}))).all.find(n=>n.type==='frame')!;expect(grown.height).toBeGreaterThan(1100);expect(grown.sizingY).toBe('hug');
 });
 it('emits real child layers rather than a flat image, which the old path dropped',()=>{
  const child={guid:id(4),type:'TEXT',name:'Body',parentIndex:{guid:id(3),position:'a'},size:{x:300,y:40},transform:at(10,20),fontSize:16,fontName:{family:'Inter',style:'Regular'},textData:{characters:'Real child text'}},{all,out}=nodes(page(spec({}),child));expect(all.find(n=>n.name==='Hierarchy evaluation')!.type).toBe('frame');expect(all.find(n=>n.name==='Body')!.text).toBe('Real child text');expect(all.some(n=>n.type==='image')).toBe(false);expect(out.issues.map(i=>i.code)).toContain('spec-block-layers');
 });
 it('reads the fields a text layer uses, with list types and larger lines as headings',()=>{
  expect(figDocumentContent({fontSize:16,textData:{characters:'Title\nBody text\nItem\nStep',lines:[{lineType:'PLAIN'},{lineType:'PLAIN'},{lineType:'UNORDERED_LIST'},{lineType:'ORDERED_LIST'}],characterStyleIDs:[1,1,1,1,1,1],styleOverrideTable:[{styleID:1,fontSize:32}]}},none)).toEqual({source:'text-data',blocks:[{kind:'heading',level:1,text:'Title'},{kind:'paragraph',text:'Body text'},{kind:'list',ordered:false,items:['Item']},{kind:'list',ordered:true,items:['Step']}]});
 });
 it('finds blocks under any field name, in JSON text, in byte fields and through blob references',()=>{
  for(const fields of [{anything:{nested:[doc]}},{anything:JSON.stringify(doc)}])expect(figDocumentContent(fields,none)).toEqual({source:'structured',blocks:expected});
  const bytes=new TextEncoder().encode(JSON.stringify(doc));expect(figDocumentContent({payload:bytes},none)?.blocks).toEqual(expected);expect(figDocumentContent({documentBlob:3},i=>i===3?bytes:undefined)?.blocks).toEqual(expected);
  expect(figDocumentContent({plainText:'# Heading\nA line of body text\n- Point\n1. Step'},none)?.blocks).toEqual([{kind:'heading',level:1,text:'Heading'},{kind:'paragraph',text:'A line of body text'},{kind:'list',ordered:false,items:['Point']},{kind:'list',ordered:true,items:['Step']}]);
 });
 it('does not mistake paints, names or geometry for document text',()=>{
  expect(figDocumentContent({name:'Hierarchy evaluation',fillPaints:[{type:'SOLID'}],strokeGeometry:[{text:'nope nope'}],size:{x:1,y:2},guid:id(9)},none)).toBeUndefined();
 });
 it('keeps the preview, and says why, only when no readable text exists',()=>{
  const {all,out}=nodes(page(spec({})));expect(all.find(n=>n.name==='Hierarchy evaluation')!.type).toBe('image');const issue=out.issues.find(i=>i.code==='spec-block-raster')!;expect(issue.message).toContain('No readable text');
  const none2=nodes(page(spec({previewRasterSnapshot:undefined})));expect(none2.all).toHaveLength(0);expect(none2.out.issues.map(i=>i.code)).toContain('spec-block');
 });
 it('recovers sentences from opaque bytes with a plain warning, and rejects noise',()=>{
  const noise=Uint8Array.from({length:4000},(_,i)=>(i*2654435761>>>7)&255),mixed=new Uint8Array([...noise.subarray(0,200),0,0,...new TextEncoder().encode('A readable sentence inside opaque data'),0,0,...noise.subarray(200,400)]);expect(figDocumentContent({state:mixed},none)).toEqual({source:'recovered',blocks:[{kind:'paragraph',text:'A readable sentence inside opaque data'}]});expect(figDocumentContent({state:noise},none)).toBeUndefined();
 });
 it('imports other text-bearing layer types it does not otherwise know, and still omits the rest',()=>{
  const sticky={...spec({textData:{characters:'A note on the page'}}),type:'STICKY',previewRasterSnapshot:undefined},{all}=nodes(page(sticky));expect(all.find(n=>n.type==='text')!.text).toBe('A note on the page');const empty=nodes(page({...spec({}),type:'WASHI_TAPE',previewRasterSnapshot:undefined}));expect(empty.all).toHaveLength(0);expect(empty.out.issues.map(i=>i.code)).toContain('unsupported-node');
 });
 it('keeps an unknown spec field through the real kiwi decoder, because the file carries its own schema',()=>{
  const f=(name:string,type:number,value:number,array=false)=>({name,type,value,array}),schema:KiwiDefinition[]=[{name:'NodeType',kind:0,fields:['DOCUMENT','CANVAS','SPEC_BLOCK'].map((n,i)=>f(n,0,i))},{name:'GUID',kind:1,fields:[f('sessionID',-4,1),f('localID',-4,2)]},{name:'ParentIndex',kind:1,fields:[f('guid',1,1),f('position',-6,2)]},{name:'Vector',kind:1,fields:[f('x',-5,1),f('y',-5,2)]},{name:'NodeChange',kind:2,fields:[f('guid',1,1),f('parentIndex',2,2),f('type',0,3),f('name',-6,4),f('size',3,5),f('richDocumentJson',-6,6)]},{name:'Message',kind:2,fields:[f('nodeChanges',4,1,true)]}],message={nodeChanges:[{guid:id(1),type:'DOCUMENT'},{guid:id(2),type:'CANVAS',name:'Page',parentIndex:{guid:id(1),position:'a'}},{guid:id(3),type:'SPEC_BLOCK',name:'Spec',parentIndex:{guid:id(2),position:'a'},size:{x:400,y:300},richDocumentJson:JSON.stringify(doc)}]};
  const decoded=decodeFigContainerInWorker(figCanvas({schema:encodeSchema(schema),message:encodeMessage(message,schema)})),out=mapFigScene(decoded,'File');expect(out.document.pages[0].nodes.filter(n=>n.type==='text').map(n=>n.text)[0]).toBe('Hierarchy evaluation');
 });
});
/** A hand-written Yjs v1 update: an XML fragment holding a heading and a paragraph. This proves the reader, not that any design file uses Yjs. */
function update(){
 const out:number[]=[],uint=(v:number)=>{while(v>127){out.push(v&127|128);v=Math.floor(v/128);}out.push(v);},string=(s:string)=>{const b=new TextEncoder().encode(s);uint(b.length);out.push(...b);},idOf=(clock:number)=>{uint(5);uint(clock);};
 uint(1);uint(7);uint(5);uint(0);
 out.push(7);uint(1);string('content');uint(3);string('heading');
 out.push(0x28);uint(0);idOf(0);string('level');uint(1);out.push(125,2);
 out.push(7);uint(0);idOf(0);uint(6);
 out.push(4);uint(0);idOf(2);string('Title');
 out.push(0x87);idOf(0);uint(3);string('paragraph');
 out.push(7);uint(0);idOf(8);uint(6);
 out.push(4);uint(0);idOf(9);string('Body');
 uint(0);return Uint8Array.from(out);
}
describe('editing history reader',()=>{
 it('reads an element tree with attributes from a strict update',()=>{const tree=readCrdtDocument(update())!;expect(tree[0].content.map(c=>'type' in c?c.type:c.text)).toEqual(['heading','paragraph']);expect(figDocumentContent({state:update()},none)).toEqual({source:'crdt',blocks:[{kind:'heading',level:2,text:'Title'},{kind:'paragraph',text:'Body'}]});});
 it('rejects trailing data and truncation rather than guessing',()=>{const bytes=update();expect(readCrdtDocument(new Uint8Array([...bytes,1]))).toBeUndefined();expect(readCrdtDocument(bytes.subarray(0,bytes.length-3))).toBeUndefined();expect(readCrdtDocument(new Uint8Array(0))).toBeUndefined();});
});
