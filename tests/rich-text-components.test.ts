import {it,expect} from 'vitest';
import {blankDocument,node,parseDocument} from '../src/model';
import {insertInstance,subtree} from '../src/components-model';
import {addCollection,addVariable} from '../src/design-systems';
import {useEditor} from '../src/store';
it('rebases copied source text ranges before applying an exposed instance text property',()=>{
 const d=blankDocument(),p=d.pages[0],main=node('component'),text=node('text',{parentId:main.id,text:'Original',textRuns:[{start:0,end:8,fontWeight:700}]});main.componentMetadata={properties:[{id:'caption',name:'Caption',type:'text',targetId:text.id,defaultValue:'X',description:''}]};p.nodes=[main,text];useEditor.getState().load(d);let id='';expect(()=>useEditor.getState().edit(d=>{id=insertInstance(d,p.id,main.id);})).not.toThrow();let child=subtree(useEditor.getState().doc.pages[0],id).find(n=>n.type==='text')!;expect(child.text).toBe('X');expect(child.textRuns?.every(r=>r.end<=1)).toBe(true);expect(parseDocument(JSON.stringify(useEditor.getState().doc))).toEqual(useEditor.getState().doc);
 useEditor.getState().patch([text.id],{text:'Revised source',textRuns:[{start:0,end:14,fontStyle:'italic'}]});child=subtree(useEditor.getState().doc.pages[0],id).find(n=>n.type==='text')!;expect(child.text).toBe('X');expect(child.textRuns?.every(r=>r.end<=1)).toBe(true);
});
it('rebases a newly materialized variable-bound text child',()=>{
 const d=blankDocument(),p=d.pages[0],collection=addCollection(d,'Content'),variable=addVariable(d,collection,'string','Caption'),mode=d.variableCollections![0].defaultModeId;d.variables!.find(v=>v.id===variable)!.values[mode]='A';const main=node('component'),text=node('text',{parentId:main.id,text:'Long label',textRuns:[{start:0,end:10,fontWeight:700}],variableBindings:{text:variable}});p.nodes=[main,text];useEditor.getState().load(d);let id='';expect(()=>useEditor.getState().edit(doc=>{id=insertInstance(doc,p.id,main.id);})).not.toThrow();const child=subtree(useEditor.getState().doc.pages[0],id).find(n=>n.type==='text')!;expect(child.text).toBe('A');expect(child.textRuns?.every(r=>r.end<=1)).toBe(true);expect(parseDocument(JSON.stringify(useEditor.getState().doc))).toEqual(useEditor.getState().doc);
});
