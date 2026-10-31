import {describe,expect,it} from 'vitest';
import {decodeFigContainerInWorker} from '../src/fig-container-core';
import {figDocumentContent} from '../src/fig-document';
import {readCrdtDocument} from '../src/fig-document-crdt';
import {mapFigScene} from '../src/fig-scene';
import {synchronizeComponents} from '../src/components-model';
import {reflow} from '../src/layout';
import {encodeMessage,encodeSchema,figCanvas} from './helpers/fig-fixture';
import type {KiwiDefinition} from '../src/fig-kiwi';
/** Everything here is self-authored. Spec block field names are assumed, except the kinds of field a TEXT layer already uses. */
const id=(n:number)=>({sessionID:7,localID:n});
const at=(x:number,y:number)=>({m00:1,m01:0,m02:x,m10:0,m11:1,m12:y});
const page=(...extra:Record<string,unknown>[])=>({nodeChanges:[{guid:id(1),type:'DOCUMENT'},{guid:id(2),type:'CANVAS',name:'Page',parentIndex:{guid:id(1),position:'a'}},...extra],blobs:[] as {bytes:number[]}[]});
const spec=(fields:Record<string,unknown>)=>({guid:id(3),type:'SPEC_BLOCK',name:'Hierarchy evaluation',parentIndex:{guid:id(2),position:'a'},size:{x:850,y:1100},transform:at(40,60),previewRasterSnapshot:{paint:{type:'IMAGE',image:{hash:new Array(20).fill(1)}}},...fields});
const nodes=(message:Record<string,unknown>)=>{const out=mapFigScene({message,images:{}},'File');return {out,all:out.document.pages[0].nodes,text:out.document.pages[0].nodes.filter(n=>n.type==='text')};};
const none=()=>undefined;
const doc={type:'doc',content:[{type:'heading',attrs:{level:1},content:[{type:'text',text:'Hierarchy evaluation'}]},{type:'paragraph',content:[{type:'text',text:'First '},{type:'text',text:'paragraph.'}]},{type:'bullet_list',content:[{type:'list_item',content:[{type:'paragraph',content:[{type:'text',text:'One'}]}]},{type:'list_item',content:[{type:'paragraph',content:[{type:'text',text:'Two'}]}]}]},{type:'ordered_list',content:[{type:'list_item',content:[{type:'text',text:'Step'}]}]},{type:'heading',attrs:{level:2},content:[{type:'text',text:'Second heading'}]}]};
const expected=[{kind:'heading',level:1,text:'Hierarchy evaluation'},{kind:'paragraph',text:'First paragraph.'},{kind:'list',ordered:false,items:['One','Two']},{kind:'list',ordered:true,items:['Step']},{kind:'heading',level:2,text:'Second heading'}];
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
