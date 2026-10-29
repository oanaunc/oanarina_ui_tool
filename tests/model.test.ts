import {beforeEach,describe,expect,it} from 'vitest';
import {blankDocument,bounds,descendants,effectiveVisible,isLocked,node,parseDocument,reflow} from '../src/model';
import {useEditor,currentPage} from '../src/store';
import {sampleDocument} from '../src/sample';
const s=()=>useEditor.getState();
beforeEach(()=>s().newDocument());
describe('document model',()=>{
 it('round-trips the complete sample without losing metadata',()=>{const d=sampleDocument();expect(parseDocument(JSON.stringify(d))).toEqual(d);});
 it('rejects unsupported binary/project versions',()=>{expect(()=>parseDocument('fig-kiwi')).toThrow();const d=blankDocument();expect(()=>parseDocument(JSON.stringify({...d,version:2}))).toThrow();});
 it('rejects non-finite dimensions, duplicate IDs, missing parents and cyclic hierarchy',()=>{for(const mutate of [(a:any,b:any)=>a.width=null,(a:any,b:any)=>b.id=a.id,(a:any,b:any)=>a.parentId='missing',(a:any,b:any)=>{a.parentId=b.id;b.parentId=a.id;}]){const d=blankDocument(),a=node('frame'),b=node('rectangle');d.pages[0].nodes.push(a,b);mutate(a,b);expect(()=>parseDocument(JSON.stringify(d))).toThrow();}});
 it('rejects remote images and malformed comment payloads',()=>{const d=blankDocument();d.pages[0].nodes.push(node('image',{image:'https://example.com/x.png'}));expect(()=>parseDocument(JSON.stringify(d))).toThrow();d.pages[0].nodes=[];d.pages[0].comments.push({id:'a',text:'x',x:NaN,y:0,resolved:false});expect(()=>parseDocument(JSON.stringify(d))).toThrow();});
 it('walks descendants and inherits visibility and lock',()=>{const a=node('frame',{visible:false,locked:true}),b=node('group',{parentId:a.id}),c=node('rectangle',{parentId:b.id});expect(descendants([a,b,c],[a.id])).toEqual([a.id,b.id,c.id]);expect(effectiveVisible(c,[a,b,c])).toBe(false);expect(isLocked(c,[a,b,c])).toBe(true);});
 it('computes positive bounds for negative coordinates and zero-height lines',()=>{expect(bounds([node('line',{x:-50,y:-10,width:100,height:0})])).toEqual({x:-50,y:-10,width:100,height:1});});
 it('reflows nested children with their parent',()=>{const a=node('frame',{x:100,y:100,layout:'horizontal',padding:10,gap:15}),b=node('frame',{parentId:a.id,x:0,y:0,width:40}),c=node('text',{parentId:b.id,x:5,y:5}),e=node('rectangle',{parentId:a.id,width:20});reflow([a,b,c,e]);expect([b.x,b.y,c.x,c.y,e.x]).toEqual([110,110,115,115,165]);});
});
describe('editing history and hierarchy',()=>{
 it('supports undo and redo without mutating previous documents',()=>{const before=s().doc,id=s().add('rectangle',{x:10});s().patch([id],{x:40});expect(before.pages[0].nodes).toHaveLength(0);s().undo();expect(currentPage().nodes[0].x).toBe(10);s().redo();expect(currentPage().nodes[0].x).toBe(40);});
 it('deletes complete subtrees and restores them with undo',()=>{const a=s().add('frame'),b=s().add('rectangle',{parentId:a});s().set({selection:[a]});s().remove();expect(currentPage().nodes).toHaveLength(0);s().undo();expect(currentPage().nodes.map(n=>n.id)).toEqual([a,b]);});
 it('copies nested groups with remapped IDs and valid parent links',()=>{const a=s().add('frame',{x:20}),b=s().add('text',{parentId:a,x:30});s().set({selection:[a]});s().duplicate();const copies=currentPage().nodes.slice(2);expect(copies).toHaveLength(2);expect(copies[0].id).not.toBe(a);expect(copies[1].id).not.toBe(b);expect(copies[1].parentId).toBe(copies[0].id);expect(parseDocument(JSON.stringify(s().doc))).toEqual(s().doc);});
 it('groups and ungroups without moving children',()=>{const a=s().add('rectangle',{x:10,y:20}),b=s().add('ellipse',{x:100,y:20});s().set({selection:[a,b]});s().group();const id=s().selection[0];expect(currentPage().nodes.find(n=>n.id===a)?.parentId).toBe(id);s().ungroup();expect(currentPage().nodes.find(n=>n.id===a)).toMatchObject({parentId:null,x:10,y:20});});
 it('moves a frame together with its children',()=>{const a=s().add('frame',{x:10,y:10}),b=s().add('text',{parentId:a,x:20,y:20});s().patch([a],{x:50,y:60});expect(currentPage().nodes.find(n=>n.id===b)).toMatchObject({x:60,y:70});});
 it('aligns and distributes selected layers',()=>{const ids=[0,40,110].map(x=>s().add('rectangle',{x,width:10}));s().set({selection:ids});s().align('distribute-x');expect(currentPage().nodes.map(n=>n.x)).toEqual([0,55,110]);s().align('left');expect(currentPage().nodes.map(n=>n.x)).toEqual([0,0,0]);});
 it('keeps at least one page and allows undo of added pages',()=>{s().deletePage();expect(s().doc.pages).toHaveLength(1);s().addPage();expect(s().doc.pages).toHaveLength(2);s().undo();expect(s().doc.pages).toHaveLength(1);expect(currentPage()).toBeDefined();});
});
