import {it,expect} from 'vitest';
import {blankDocument,node} from '../src/model';
import {boxSelectionIndex,querySelectionBox,combineBoxSelection,parentHoverTarget,validateSelectionRect} from '../src/selection-box';
import {worldMatrix,point} from '../src/transforms';
import {useEditor} from '../src/store';
import {useSelectionBoxView} from '../src/selection-box-view';
import {exportSvg} from '../src/files';
it('distinguishes contained, touching edges and disjoint layout boxes, including zero-size lines',()=>{
 const index=boxSelectionIndex([node('rectangle',{id:'inside',x:10,y:10,width:20,height:20}),node('rectangle',{id:'cross',x:90,y:90,width:20,height:20}),node('line',{id:'edge',x:100,y:20,width:0,height:30}),node('rectangle',{id:'out',x:101,y:10,width:20,height:20})]),box={x:0,y:0,width:100,height:100};
 expect(querySelectionBox(index,box,'contain')).toEqual(['inside','edge']);expect(querySelectionBox(index,box,'intersect')).toEqual(['inside','cross','edge']);
});
it('uses complete affine ancestry independent of node array order without mutating geometry',()=>{
 const a=node('frame',{id:'a',x:150,y:80,width:400,height:200,rotation:37,flipX:true,motionScaleX:1.4,motionScaleY:.8}),b=node('group',{id:'b',parentId:'a',x:180,y:120,width:200,height:120,rotation:-22,flipY:true}),c=node('rectangle',{id:'c',parentId:'b',x:210,y:140,width:50,height:20,rotation:12}),nodes=[c,b,a],before=JSON.stringify(nodes),m=worldMatrix(c,nodes),corners=[[0,0],[50,0],[50,20],[0,20]].map(([x,y])=>point(m,x,y)),xs=corners.map(p=>p.x),ys=corners.map(p=>p.y),r=boxSelectionIndex(nodes)[0].bounds;
 expect(r.x).toBeCloseTo(Math.min(...xs));expect(r.y).toBeCloseTo(Math.min(...ys));expect(r.width).toBeCloseTo(Math.max(...xs)-Math.min(...xs));expect(r.height).toBeCloseTo(Math.max(...ys)-Math.min(...ys));expect(querySelectionBox(boxSelectionIndex(nodes),r,'contain')).toContain('c');expect(JSON.stringify(nodes)).toBe(before);
});
it('excludes inherited hidden and locked nodes and inspects eligible managed instance children',()=>{
 const nodes=[node('rectangle',{id:'hidden-child',parentId:'hidden'}),node('rectangle',{id:'locked-child',parentId:'locked'}),node('group',{id:'hidden',visible:false}),node('group',{id:'locked',locked:true}),node('rectangle',{id:'managed',instanceRootId:'root'}),node('rectangle',{id:'visible'})];expect(boxSelectionIndex(nodes).map(e=>e.id)).toEqual(['managed','visible']);
});
it('indexes a reversed 20,000-layer hierarchy iteratively and rejects duplicate or cyclic input',()=>{
 const nodes=Array.from({length:20000},(_,i)=>node('group',{id:'n'+i,parentId:i?'n'+(i-1):null,x:0,y:0})).reverse();expect(boxSelectionIndex(nodes)).toHaveLength(20000);nodes.find(n=>n.id==='n1')!.locked=true;expect(boxSelectionIndex(nodes).map(e=>e.id)).toEqual(['n0']);expect(()=>boxSelectionIndex([nodes[0],nodes[0]])).toThrow(/unique/);expect(()=>boxSelectionIndex([node('group',{id:'a',parentId:'b'}),node('group',{id:'b',parentId:'a'})])).toThrow(/Cyclic/);
});
it('omits unprojectable extreme affine bounds without crashing an existing document',()=>{
 const nodes=Array.from({length:90},(_,i)=>node('group',{id:'n'+i,parentId:i?'n'+(i-1):null,motionScaleX:10000,motionScaleY:10000}));expect(()=>boxSelectionIndex(nodes)).not.toThrow();expect(boxSelectionIndex(nodes).length).toBeLessThan(nodes.length);
});
it('validates finite geometry and operations before selection changes',()=>{
 for(const box of [{x:0,y:0,width:-1,height:2},{x:NaN,y:0,width:2,height:2},{x:1e308,y:0,width:1e308,height:2}])expect(()=>validateSelectionRect(box)).toThrow();expect(()=>querySelectionBox([],{x:0,y:0,width:2,height:2},'bad' as never)).toThrow();expect(combineBoxSelection(['a','b'],['b','c'],'add')).toEqual(['a','b','c']);expect(combineBoxSelection(['a','b'],['b','c'],'subtract')).toEqual(['a']);expect(combineBoxSelection(['a'],['b'],'replace')).toEqual(['b']);expect(()=>combineBoxSelection([],[],'bad' as never)).toThrow();
});
it('finds the immediate eligible parent for hover without crossing hidden or locked ancestry',()=>{
 const a=node('frame',{id:'a'}),b=node('group',{id:'b',parentId:'a'}),c=node('rectangle',{id:'c',parentId:'b'}),nodes=[c,b,a];expect(parentHoverTarget(nodes,'c')).toBe(b);expect(parentHoverTarget(nodes,'a')).toBeUndefined();a.locked=true;expect(parentHoverTarget(nodes,'c')).toBeUndefined();a.locked=false;a.visible=false;expect(parentHoverTarget(nodes,'c')).toBeUndefined();a.visible=true;a.parentId='c';expect(parentHoverTarget(nodes,'c')).toBeUndefined();
});
it('keeps box previews out of saved data, SVG and undo and cancels stale editor contexts',()=>{
 const doc=blankDocument();doc.pages[0].nodes=[node('rectangle',{id:'a'})];doc.pages.push({id:'second',name:'Second',nodes:[],comments:[]});
 for(const patch of [{selection:['a']},{modal:null},{mode:'inspect' as const},{home:true},{uiHidden:true},{motionOpen:true},{motionTime:.5},{pageId:'second'},{vectorEditId:'a'}]){useEditor.getState().load(doc);useEditor.getState().set({modal:'selection-box',mode:'design',home:false,uiHidden:false,motionOpen:false,motionTime:0,vectorEditId:null,selection:[]});const before=useEditor.getState(),svg=exportSvg(before.doc.pages[0].nodes);useSelectionBoxView.getState().show({x:1,y:2,width:30,height:40},'contain',1);expect(useEditor.getState().doc).toBe(before.doc);expect(useEditor.getState().past).toBe(before.past);expect(exportSvg(before.doc.pages[0].nodes)).toBe(svg);useEditor.getState().set(patch);expect(useSelectionBoxView.getState().preview).toBeNull();}
 useEditor.getState().load(doc);useEditor.getState().set({modal:'selection-box'});useSelectionBoxView.getState().show({x:0,y:0,width:1,height:1},'intersect',0);useEditor.getState().load(structuredClone(doc));expect(useSelectionBoxView.getState().preview).toBeNull();
});
