import {beforeEach,describe,expect,it} from 'vitest';
import {parseDocument} from '../src/model';
import {useEditor} from '../src/store';
import {inverseMatrix,multiply,point,worldMatrix} from '../src/transforms';
import type {Matrix} from '../src/transforms';
const s=()=>useEditor.getState(),nodes=()=>s().doc.pages[0].nodes,n=(id:string)=>nodes().find(a=>a.id===id)!,world=(id:string)=>worldMatrix(n(id),nodes());
const close=(a:Matrix,b:Matrix)=>a.forEach((v,i)=>expect(v).toBeCloseTo(b[i],6));
/** Every child corner, read in the group's own axes. */
const fit=(g:string)=>{const inverse=inverseMatrix(world(g)),corners=nodes().filter(c=>c.parentId===g).flatMap(c=>{const m=multiply(inverse,world(c.id));return [[0,0],[c.width,0],[c.width,c.height],[0,c.height]].map(([x,y])=>point(m,x,y));});return {left:Math.min(...corners.map(p=>p.x)),top:Math.min(...corners.map(p=>p.y)),right:Math.max(...corners.map(p=>p.x)),bottom:Math.max(...corners.map(p=>p.y))};};
const tight=(g:string)=>{const box=fit(g);expect(box.left).toBeCloseTo(0,6);expect(box.top).toBeCloseTo(0,6);expect(box.right).toBeCloseTo(n(g).width,6);expect(box.bottom).toBeCloseTo(n(g).height,6);};
let a:string,b:string,g:string;
beforeEach(()=>{s().newDocument();a=s().add('rectangle',{x:10,y:10,width:50,height:50});b=s().add('rectangle',{x:100,y:20,width:40,height:40});s().set({selection:[a,b]});s().group();g=s().selection[0];});
describe('turned and flipped groups refit',()=>{
 for(const [name,turn] of [['rotated',{rotation:30}],['flipped across',{flipX:true}],['flipped down',{flipY:true}],['rotated and flipped',{rotation:-75,flipX:true}]] as const)it(`a ${name} group follows a moved child and every other layer stays put`,()=>{s().patch([g],turn);const before=world(a),turnBefore=n(g).rotation;s().patch([b],{x:n(b).x+70});tight(g);expect(n(g).width).toBeCloseTo(200,6);expect(n(g).rotation).toBe(turnBefore);close(world(a),before);});
 it('a moved child lands where the group axes put it',()=>{s().patch([g],{rotation:90});const before=point(world(b),0,0);s().patch([b],{x:n(b).x+30});const after=point(world(b),0,0);expect(after.x-before.x).toBeCloseTo(0,6);expect(after.y-before.y).toBeCloseTo(30,6);tight(g);});
 it('shrinks when the far child comes back or leaves',()=>{s().patch([g],{rotation:45});s().patch([b],{x:n(b).x+200});const wide=n(g).width;const held=world(a);s().patch([b],{x:n(b).x-200});expect(n(g).width).toBeLessThan(wide);close(world(a),held);tight(g);s().set({selection:[b]});s().remove();tight(g);expect(n(g).width).toBeCloseTo(50,6);});
 it('uses a rotated child inside a rotated group',()=>{s().patch([g],{rotation:20});s().patch([b],{rotation:45});tight(g);});
 it('keeps the layers of a nested group in place',()=>{s().patch([g],{rotation:15});const deep=s().add('rectangle',{parentId:g,x:30,y:30,width:10,height:10}),other=s().add('rectangle',{parentId:g,x:60,y:30,width:10,height:10});s().set({selection:[deep,other]});s().group();const inner=s().selection[0],before=world(a),held=world(other);s().patch([deep],{x:n(deep).x-120});tight(inner);tight(g);close(world(a),before);close(world(other),held);});
 it('refits inside a rotated frame',()=>{const frame=s().add('frame',{x:300,y:300,width:400,height:300,rotation:40}),x=s().add('rectangle',{parentId:frame,x:320,y:320,width:30,height:30}),y=s().add('rectangle',{parentId:frame,x:380,y:320,width:30,height:30});s().set({selection:[x,y]});s().group();const inner=s().selection[0];s().patch([inner],{rotation:25});const held=world(x);s().patch([y],{x:n(y).x+50});tight(inner);close(world(x),held);});
 it('takes one Undo and survives a saved reopen',()=>{s().patch([g],{rotation:30});const box={x:n(g).x,y:n(g).y,width:n(g).width,height:n(g).height},held=world(a);s().patch([b],{x:n(b).x+70});expect(parseDocument(JSON.stringify(s().doc))).toEqual(s().doc);s().undo();expect(n(g)).toMatchObject(box);close(world(a),held);});
 it('leaves an untouched turned group alone',()=>{s().edit(d=>{Object.assign(d.pages[0].nodes.find(x=>x.id===g)!,{width:500,rotation:30});});s().add('rectangle',{x:600,y:600});expect(n(g).width).toBe(500);});
 it('keeps its bounds when a child is animated',()=>{s().patch([g],{rotation:30});s().edit(d=>{d.pages[0].motion={duration:2,fps:30,loop:true,tracks:[{id:'t',nodeId:a,property:'x' as never,visible:true,keyframes:[]}]};});const held=n(g).width;s().patch([b],{x:n(b).x+200});expect(n(g).width).toBe(held);});
 it('holds still when nothing changed the box',()=>{s().patch([g],{rotation:30});const box={x:n(g).x,y:n(g).y,width:n(g).width};s().patch([g],{opacity:.5});expect(n(g)).toMatchObject(box);});
});
