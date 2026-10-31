import {beforeEach,describe,expect,it} from 'vitest';
import {blankDocument,node} from '../src/model';
import {useEditor} from '../src/store';
import {canvasRotationHandle,canvasSizeLabel,canvasSizePlateWidth} from '../src/canvas-geometry';
import {applyCanvasDropParent} from '../src/canvas-reparent';
import {frameExportFilename,scaleSuffix} from '../src/frame-export-settings';
import {flattenLayerTree,layerTreeIndex} from '../src/layer-tree-index';
import {planLayerMove} from '../src/layer-operations';
import {selectionChildren,selectionSibling,visibleLayerRows} from '../src/selection';
import {allNodes,combineVariants} from '../src/components-model';
import {canvasNameIndex,placeCanvasNames} from '../src/canvas-names';
import {layoutChildOutset} from '../src/layout-settings';
import {createStroke} from '../src/paints';
import {notifyError} from '../src/files';
import {roundedPolygonPath} from '../src/basic-shapes';
import {localPath} from '../src/geometry';
import {validateDocumentCornerSmoothing} from '../src/corner-smoothing';
import {additionalShortcutsEnabled,textFormatShortcut} from '../src/keyboard-preferences';
const s=()=>useEditor.getState(),nodes=()=>s().doc.pages.find(p=>p.id===s().pageId)!.nodes;
describe('rotation handle',()=>{
 const frame=node('frame',{id:'f',name:'Card',x:100,y:100,width:40,height:40});
 it('stays on top until a name would sit under its stem, then leaves the side',()=>{expect(canvasRotationHandle([frame],['f'],1).handle).toEqual({x:120,y:76});const name={x:98,y:73,width:90,height:21},moved=canvasRotationHandle([frame],['f'],1,name);expect(moved.edge).toEqual({x:140,y:120});expect(moved.handle).toEqual({x:164,y:120});expect(canvasRotationHandle([frame],['f'],1,{x:98,y:73,width:10,height:21}).handle).toEqual({x:120,y:76});});
});
describe('size label',()=>{
 it('names hug and fill per axis only where the rule applies, and the plate grows to fit',()=>{const parent=node('frame',{id:'p',layout:'vertical',sizingX:'hug',sizingY:'fixed'}),child=node('rectangle',{id:'c',parentId:'p',sizingX:'fill',sizingY:'fixed'}),loose=node('rectangle',{id:'l',sizingX:'fill'});expect(canvasSizeLabel([parent],[parent,child],120.4,80,)).toBe('120 Hug × 80');expect(canvasSizeLabel([child],[parent,child],120,40)).toBe('120 Fill × 40');expect(canvasSizeLabel([loose],[loose],10,20)).toBe('10 × 20');expect(canvasSizeLabel([parent,child],[parent,child],10,20)).toBe('10 × 20');expect(canvasSizeLabel([node('text',{textResize:'auto-width'})],[],60,29)).toBe('60 Hug × 29 Hug');expect(canvasSizeLabel([node('text',{textResize:'auto-height'})],[],60,29)).toBe('60 × 29 Hug');expect(canvasSizePlateWidth('10 × 20')).toBe(76);expect(canvasSizePlateWidth('1200 Hug × 2400 Fill')).toBeGreaterThan(120);});
});
describe('export names',()=>{
 const setting={id:'a',format:'png' as const,scale:2,suffix:'',bounds:'frame' as const,includeGuides:false};
 it('adds the scale to a larger raster unless a suffix or fixed size says otherwise',()=>{expect(frameExportFilename('Phone',setting)).toBe('Phone@2x.png');expect(frameExportFilename('Phone',{...setting,scale:3,format:'jpg'})).toBe('Phone@3x.jpg');expect(frameExportFilename('Phone',{...setting,scale:1.5})).toBe('Phone@1.5x.png');expect(frameExportFilename('Phone',{...setting,suffix:'-retina'})).toBe('Phone-retina.png');expect(frameExportFilename('Phone',{...setting,scale:1})).toBe('Phone.png');expect(frameExportFilename('Phone',{...setting,format:'svg'})).toBe('Phone.svg');expect(frameExportFilename('Phone',{...setting,sizing:{axis:'width',value:640}})).toBe('Phone.png');expect(scaleSuffix('png',.5)).toBe('');});
});
describe('duplicating a main component',()=>{
 let main='';
 beforeEach(()=>{s().newDocument();main=s().add('component',{name:'Button',x:10,y:20,width:120,height:40});s().add('text',{name:'Label',parentId:main,x:20,y:28,text:'Original'});s().set({selection:[main]});});
 it('makes one instance beside it with one Undo, and repeats the spacing',()=>{const before=s().past.length,mains=()=>nodes().filter(n=>n.type==='component').length;s().duplicate();const copy=nodes().find(n=>n.id===s().selection[0])!;expect(copy).toMatchObject({type:'instance',componentId:main,x:170,y:20,name:'Button'});expect(mains()).toBe(1);expect(allNodes(s().doc).some(n=>n.instanceRootId===copy.id&&n.text==='Original')).toBe(true);expect(s().past.length).toBe(before+1);s().duplicate();expect(nodes().find(n=>n.id===s().selection[0])).toMatchObject({type:'instance',x:330,y:20});s().undo();s().undo();expect(nodes().filter(n=>n.type==='instance')).toHaveLength(0);});
 it('gives Option-drag an instance in place that settles into one Undo',()=>{const at=s().past.length,start=s().duplicateInPlace(),copy=nodes().find(n=>n.id===s().selection[0])!;expect(copy).toMatchObject({type:'instance',x:10,y:20});s().patch([copy.id],{x:300});s().settleDuplicateDrag(start);expect(s().past.length).toBe(at+1);s().undo();expect(nodes().some(n=>n.type==='instance')).toBe(false);});
 it('stays beside the main inside a stack and keeps ordinary copies of everything else',()=>{const parent=s().add('frame',{name:'List',layout:'vertical',x:0,y:0,width:200,height:200});s().edit(d=>{d.pages[0].nodes.find(n=>n.id===main)!.parentId=parent;});s().add('rectangle',{name:'After',parentId:parent});s().set({selection:[main]});s().duplicate();const order=nodes().filter(n=>n.parentId===parent).map(n=>n.type);expect(order).toEqual(['component','instance','rectangle']);const shape=nodes().find(n=>n.name==='After')!;s().set({selection:[shape.id]});s().duplicate();expect(nodes().find(n=>n.id===s().selection[0])?.type).toBe('rectangle');});
 it('leaves variants inside their set as variants',()=>{const other=s().add('component',{name:'Alt',x:200,y:20,width:120,height:40});s().edit(d=>{combineVariants(d,s().pageId,[main,other]);});s().set({selection:[main]});s().duplicate();expect(nodes().find(n=>n.id===s().selection[0])?.type).toBe('component');});
});
describe('Layers lists stacks in flow order',()=>{
 const fixture=(layout:'horizontal'|'vertical'|'none'|'grid'='vertical')=>[node('frame',{id:'p',name:'P',layout}),node('rectangle',{id:'a',parentId:'p',name:'A'}),node('rectangle',{id:'b',parentId:'p',name:'B'}),node('rectangle',{id:'c',parentId:'p',name:'C'}),node('rectangle',{id:'x',name:'X'})];
 const rows=(ns:ReturnType<typeof fixture>)=>flattenLayerTree(layerTreeIndex(ns)).map(r=>r.id),stored=(ns:ReturnType<typeof fixture>)=>ns.filter(n=>n.parentId==='p').map(n=>n.id);
 it('reads first child first in stacks and front first elsewhere, without touching stored order',()=>{expect(rows(fixture())).toEqual(['x','p','a','b','c']);expect(rows(fixture('horizontal'))).toEqual(['x','p','a','b','c']);expect(rows(fixture('none'))).toEqual(['x','p','c','b','a']);expect(rows(fixture('grid'))).toEqual(['x','p','c','b','a']);const index=layerTreeIndex(fixture());expect(index.byId.get('a')!.position).toBe(1);expect(stored(fixture())).toEqual(['a','b','c']);});
 it('drops before and after a row where the row list says',()=>{expect(stored(planLayerMove(fixture(),['c'],'a','before'))).toEqual(['c','a','b']);expect(stored(planLayerMove(fixture(),['a'],'c','after'))).toEqual(['b','c','a']);expect(stored(planLayerMove(fixture(),['x'],'b','after'))).toEqual(['a','b','x','c']);expect(stored(planLayerMove(fixture('none'),['c'],'a','before'))).toEqual(['a','c','b']);expect(rows(planLayerMove(fixture(),['c'],'a','before')).slice(2)).toEqual(['c','a','b']);});
 it('keeps a multiple selection in its row order',()=>{expect(stored(planLayerMove(fixture(),['a','b'],'c','after'))).toEqual(['c','a','b']);const flat=planLayerMove(fixture('none'),['a','b'],'c','before');expect(stored(flat)).toEqual(['c','a','b']);expect(rows(flat).slice(2)).toEqual(['b','a','c']);});
 it('a canvas drop lands before the first sibling past the pointer',()=>{const doc=blankDocument();expect(stored(applyCanvasDropParent(fixture(),['x'],{parentId:'p',afterId:'b'},doc))).toEqual(['a','x','b','c']);});
 it('walks siblings and children in the listed order',()=>{const ns=fixture();expect(selectionSibling(ns,['a'],1)).toEqual(['b']);expect(selectionSibling(ns,['c'],1)).toEqual(['a']);expect(selectionChildren(ns,['p'])).toEqual(['a','b','c']);const flat=fixture('none');expect(selectionSibling(flat,['b'],1)).toEqual(['a']);expect(selectionChildren(flat,['p'])).toEqual(['c','b','a']);expect(visibleLayerRows(ns).map(n=>n.id).slice(0,3)).toEqual(['x','p','a']);});
});
describe('layout counts miter tips',()=>{
 const parent=node('frame',{layout:'horizontal',layoutIncludeStroke:true}),stroke=(width:number,miterLimit=10)=>({...createStroke('#000000'),width,align:'center' as const,join:'miter' as const,miterLimit});
 const spike=(strokes:ReturnType<typeof stroke>[])=>node('path',{width:100,height:20,pathWidth:100,pathHeight:20,closed:true,contours:[{closed:true,points:[{x:0,y:20},{x:50,y:0},{x:100,y:20}]}],strokes});
 it('reaches past half the stroke at a sharp join, and stops at the limit or a rounded join',()=>{const sharp=layoutChildOutset(parent,spike([stroke(10)]));expect(sharp).toBeGreaterThan(5);expect(sharp).toBeLessThan(60);expect(layoutChildOutset(parent,spike([stroke(10,1.05)]))).toBe(5);expect(layoutChildOutset(parent,spike([{...stroke(10),join:'round' as never}]))).toBe(5);const box=node('rectangle',{strokes:[stroke(10)]});expect(layoutChildOutset(parent,box)).toBe(5);expect(layoutChildOutset(node('frame',{layout:'horizontal'}),spike([stroke(10)]))).toBe(0);});
});
describe('canvas names share a row',()=>{
 const measure=(text:string)=>({width:text.length*6}),frame=(id:string,x:number,name:string)=>node('frame',{id,name,x,y:0,width:60,height:60});
 it('stops a long name before its neighbor and keeps the full title',()=>{const placed=placeCanvasNames(canvasNameIndex([frame('a',0,'A long screen name'),frame('b',70,'B')]),1,{frames:true,sections:true},measure);expect(placed.map(n=>n.id)).toEqual(['a','b']);expect(placed[0].text.endsWith('…')).toBe(true);expect(placed[0].text.length*6).toBeLessThanOrEqual(62);expect(placed[0].title).toBe('A long screen name');expect(placed[1].text).toBe('▦  B');});
 it('steps aside with no room for a letter, and leaves other rows alone',()=>{const crowded=placeCanvasNames(canvasNameIndex([frame('a',0,'First'),frame('b',12,'Second')]),1,{frames:true,sections:true},measure);expect(crowded.map(n=>n.id)).toEqual(['b']);const other=node('frame',{id:'c',name:'A long screen name',x:0,y:200,width:60,height:60}),free=placeCanvasNames(canvasNameIndex([other,frame('b',70,'B')]),1,{frames:true,sections:true},measure);expect(free[0].text).toBe('▦  A long screen name');});
});
describe('a failure stays until it is read',()=>{
 it('keeps an error message up, and an ordinary message clears it',()=>{s().newDocument();notifyError(Error('The file could not be read.'));expect(s()).toMatchObject({toast:'The file could not be read.',toastError:true});s().set({toast:'Project saved'});expect(s()).toMatchObject({toast:'Project saved',toastError:false});});
});
describe('shortcut contexts',()=>{
 const key=(k:string,code:string)=>({key:k,code,metaKey:true,ctrlKey:false,altKey:false,shiftKey:false}),catalog=[['text-bold','Bold','Text','⌘B'],['text-italic','Italic','Text','⌘I']] as const,base={home:false,uiHidden:false,vectorEditId:null as string|null,motionOpen:false,mode:'design',tool:'move',doc:{}};
 it('runs extra shortcuts in Motion and while editing a vector, but not over Home',()=>{expect(additionalShortcutsEnabled({...base,motionOpen:true})).toBe(true);expect(additionalShortcutsEnabled({...base,vectorEditId:'v',tool:'pen'})).toBe(true);expect(additionalShortcutsEnabled({...base,tool:'pen'})).toBe(false);expect(additionalShortcutsEnabled({...base,home:true})).toBe(false);});
 it('follows a remapped format key while text is open and honors a default turned off',()=>{const settings={layout:'physical' as const,additional:{'text-bold':'⌘J'},disabled:['text-italic']};expect(textFormatShortcut(key('j','KeyJ'),catalog,settings)).toBe('bold');expect(textFormatShortcut(key('i','KeyI'),catalog,settings)).toBe(false);expect(textFormatShortcut(key('b','KeyB'),catalog,settings)).toBeUndefined();});
});
describe('polygon and star smoothing',()=>{
 const square=[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}];
 it('zero keeps the saved path, and smoothing stretches the corner along its edges',()=>{expect(roundedPolygonPath(square,10,0)).toBe(roundedPolygonPath(square,10));const eased=roundedPolygonPath(square,10,1);expect(eased).not.toBe(roundedPolygonPath(square,10));expect(eased.startsWith('M0 20')).toBe(true);expect(roundedPolygonPath(square,40,1).startsWith('M0 50')).toBe(true);});
 it('reaches shapes through the shared path and validates',()=>{const n=node('polygon',{width:100,height:100,radius:10,cornerSmoothing:.6});expect(localPath(n)).not.toBe(localPath({...n,cornerSmoothing:undefined}));expect(()=>validateDocumentCornerSmoothing({pages:[{nodes:[n,node('star',{cornerSmoothing:.5})]}]})).not.toThrow();expect(()=>validateDocumentCornerSmoothing({pages:[{nodes:[node('ellipse',{cornerSmoothing:.5})]}]})).toThrow('polygons and stars');});
});
