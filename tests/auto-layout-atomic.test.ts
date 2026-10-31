import {beforeEach,expect,it} from 'vitest';
import {parseDocument} from '../src/model';
import {useEditor} from '../src/store';
import {runCommand} from '../src/commands';
import {worldMatrix} from '../src/transforms';
import {useMaskView} from '../src/mask-view';
import {autoLayoutFixture} from './helpers/auto-layout-fixture';

beforeEach(()=>useMaskView.getState().reset());
function setup(kind:Parameters<typeof autoLayoutFixture>[0],nested=false,selection?:string[]){
 useEditor.getState().load(autoLayoutFixture(kind,nested));
 useEditor.getState().set({selection:selection??[nested?'container':'special'],mode:'design',home:false,modal:null,uiHidden:false,motionOpen:false,tool:'move',past:[],future:[]});
 return useEditor.getState();
}
function unchanged(before:ReturnType<typeof useEditor.getState>){const after=useEditor.getState();expect(after.doc).toBe(before.doc);expect(after.past).toBe(before.past);expect(after.future).toBe(before.future);expect(after.selection).toBe(before.selection);}

for(const kind of ['nib','text-path'] as const){
 for(const nested of [false,true])it(`${kind} ${nested?'nested':'direct'} wrapping refusal preserves the complete source, selection and Undo history`,()=>{
  const before=setup(kind,nested,[nested?'container':'special','other']),raw=JSON.stringify(before.doc);
  runCommand('auto-layout');unchanged(before);expect(JSON.stringify(useEditor.getState().doc)).toBe(raw);expect(useEditor.getState().toast).toMatch(/automatic layout/);
 });
 it(`${kind} single unsupported layer refuses before creating a wrapper`,()=>{const before=setup(kind);runCommand('auto-layout');unchanged(before);expect(useEditor.getState().toast).toMatch(/automatic layout/);});
 it(`${kind} existing container refuses the shared layout patch atomically`,()=>{const before=setup(kind,true);runCommand('auto-layout');unchanged(before);expect(useEditor.getState().toast).toMatch(/automatic layout/);});
 it(`${kind} direct transactional group API also refuses before source publication`,()=>{const before=setup(kind);expect(()=>before.group('frame','horizontal')).toThrow(/automatic layout/);unchanged(before);});
}
for(const direction of ['horizontal','vertical'] as const)it(`ordinary ${direction} wrapping derives final geometry in one Undo and survives oui1/2`,()=>{
 const before=setup('ordinary',false,['special','other']);
 if(direction==='horizontal')runCommand('auto-layout');else before.group('frame',direction);
 const after=useEditor.getState(),nodes=after.doc.pages[0].nodes,parent=nodes.find(n=>n.id===after.selection[0])!,first=nodes.find(n=>n.id==='special')!,second=nodes.find(n=>n.id==='other')!;
 expect(after.past).toHaveLength(1);expect(parent).toMatchObject({type:'frame',layout:direction});expect(first.parentId).toBe(parent.id);expect(second.parentId).toBe(parent.id);
 if(direction==='horizontal'){expect(second.x-first.x-first.width).toBeCloseTo(parent.gap);expect(second.y).toBe(first.y);}else{expect(second.y-first.y-first.height).toBeCloseTo(parent.gap);expect(second.x).toBe(first.x);}
 expect(first.x).toBe(parent.x+parent.padding);expect(first.y).toBe(parent.y+parent.padding);
 for(const version of [1,2])expect(parseDocument(JSON.stringify({...after.doc,version})).pages).toEqual(after.doc.pages);
 after.undo();expect(useEditor.getState().doc).toEqual(before.doc);expect(useEditor.getState().past).toHaveLength(0);useEditor.getState().redo();expect(useEditor.getState().doc).toEqual(after.doc);
});
it('ordinary grouping retains world poses, no initial layout, palette reachability and one Undo',()=>{
 setup('ordinary',false,['special','other']);useEditor.getState().set({modal:'actions'});const before=useEditor.getState(),world=before.doc.pages[0].nodes.map(n=>worldMatrix(n,before.doc.pages[0].nodes));before.group();const after=useEditor.getState(),ns=after.doc.pages[0].nodes;expect(after.past).toHaveLength(1);expect(ns.find(n=>n.id===after.selection[0])!.layout).toBe('none');for(const [i,id] of ['special','other'].entries())expect(worldMatrix(ns.find(n=>n.id===id)!,ns)).toEqual(world[i]);after.undo();expect(useEditor.getState().doc).toEqual(before.doc);
});
it('invalid initial layout and inherited locked selections refuse without a transaction',()=>{
 let before=setup('ordinary');expect(()=>before.group('frame','grid' as any)).toThrow(/horizontal or vertical/);unchanged(before);expect(()=>before.group('rectangle','horizontal')).toThrow(/container/);unchanged(before);
 setup('ordinary',true,['special']);useEditor.getState().patch(['container'],{locked:true});before=useEditor.getState();runCommand('auto-layout');unchanged(before);expect(useEditor.getState().toast).toMatch(/Unlock/);
});
