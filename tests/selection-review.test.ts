import {describe,it,expect} from 'vitest';
import {blankDocument,node} from '../src/model';
import {useEditor} from '../src/store';
import {point,worldMatrix} from '../src/transforms';
const state=()=>useEditor.getState();
describe('independent selection and structural edit review',()=>{
 it('duplicates a selected child in its own container',()=>{const d=blankDocument(),frame=node('frame',{x:100,y:100,width:400,height:300}),child=node('rectangle',{parentId:frame.id,x:120,y:140});d.pages[0].nodes=[frame,child];state().load(d);state().set({selection:[child.id]});state().duplicate();const copied=state().doc.pages[0].nodes.find(n=>state().selection.includes(n.id))!;expect(copied.id).not.toBe(child.id);expect(copied.parentId).toBe(frame.id);state().undo();expect(state().doc.pages[0].nodes).toHaveLength(2);});
 it('preserves child world geometry when ungrouping a rotated container',()=>{const d=blankDocument(),group=node('group',{x:100,y:100,width:400,height:300,rotation:90,fill:'none'}),child=node('rectangle',{parentId:group.id,x:120,y:140,width:50,height:40});d.pages[0].nodes=[group,child];const corners=(n:typeof child,nodes:typeof d.pages[0]['nodes'])=>{const m=worldMatrix(n,nodes);return [[0,0],[n.width,0],[n.width,n.height],[0,n.height]].map(([x,y])=>point(m,x,y));},before=corners(child,d.pages[0].nodes);state().load(d);state().set({selection:[group.id]});state().ungroup();const nodes=state().doc.pages[0].nodes,after=corners(nodes.find(n=>n.id===child.id)!,nodes);for(const p of before)expect(after.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<1e-6)).toBe(true);});
 it('does not move descendants of locked containers through keyboard store actions',()=>{const d=blankDocument(),frame=node('frame',{locked:true}),child=node('rectangle',{parentId:frame.id,x:20,y:30});d.pages[0].nodes=[frame,child];state().load(d);state().set({selection:[child.id]});state().move(10,0);expect(state().doc.pages[0].nodes.find(n=>n.id===child.id)?.x).toBe(20);});
});
