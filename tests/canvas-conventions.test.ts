import {describe,expect,it,beforeEach} from 'vitest';
import {chromeTone,resizeCursor,resizeEdge,rotateCursor,rotationHandleBox,rotationZones,selectionTone} from '../src/canvas-chrome';
import {resizeCanvasNodes} from '../src/canvas-geometry';
import {commands,handleKey,runCommand} from '../src/commands';
import {snapMove,defaultSnapping} from '../src/guides';
import {matchesKeyboardShortcut} from '../src/keyboard-preferences';
import {blankDocument,node} from '../src/model';
import {boxSelectionIndex,frameBackdrop,marqueeSelection} from '../src/selection-box';
import {escapeSelection} from '../src/selection';
import {useEditor} from '../src/store';

const square=[{x:100,y:100},{x:200,y:100},{x:200,y:200},{x:100,y:200}];
const inside=(points:string)=>points.split(' ').map(p=>p.split(',').map(Number)).filter(([x,y])=>x>100&&x<200&&y>100&&y<200);
const key=(id:string)=>commands.find(c=>c[0]===id)?.[3];

describe('selection color',()=>{
 it('uses the component token for components, instances and their contents, and the selection token otherwise',()=>{const rect=node('rectangle'),main=node('component'),instance=node('instance'),inner=node('rectangle',{instanceRootId:instance.id});expect(chromeTone(rect)).toBe('var(--selection)');for(const n of [main,instance,inner])expect(chromeTone(n)).toBe('var(--component)');expect(selectionTone([main,instance])).toBe('var(--component)');expect(selectionTone([main,rect])).toBe('var(--selection)');expect(selectionTone([])).toBe('var(--selection)');});
});
describe('resize and rotate targets',()=>{
 it('turns the resize arrow with the layer',()=>{expect(resizeCursor('e')).toBe('ew-resize');expect(resizeCursor('n')).toBe('ns-resize');expect(resizeCursor('se')).toBe('nwse-resize');expect(resizeCursor('ne')).toBe('nesw-resize');expect(resizeCursor('e',90)).toBe('ns-resize');expect(resizeCursor('n',-90)).toBe('ew-resize');expect(resizeCursor('se',45)).toBe('ns-resize');});
 it('keeps every rotation zone outside the layer so the interior stays clickable',()=>{const zones=rotationZones(square,1);expect(zones.map(z=>z.corner)).toEqual(['nw','ne','se','sw']);for(const z of zones)expect(inside(z.points)).toEqual([]);expect(zones[0].points).toContain('84,116');});
 it('scales reach with zoom and stays clear of a frame name at the top left',()=>{const near=rotationZones(square,2)[1].points.split(' ').map(p=>p.split(',').map(Number)),far=Math.max(...near.map(([x])=>x));expect(far).toBe(208);const clear=rotationZones(square,1,0,true)[0].points.split(' ').map(p=>p.split(',').map(Number));expect(Math.max(...clear.map(([x])=>x))).toBe(100);});
 it('gives the focusable handle a box clear of the corner square, and a rotate cursor for each corner',()=>{const box=rotationHandleBox(square,1).split(' ').map(p=>p.split(',').map(Number)),xs=box.map(p=>p[0]),ys=box.map(p=>p[1]);expect(Math.min(...xs)).toBe(206);expect(Math.max(...ys)).toBe(94);expect(rotateCursor(90)).toMatch(/^url\("data:image\/svg\+xml,.* 12 12, alias$/);expect(new Set(rotationZones(square,1).map(z=>z.cursor)).size).toBe(4);});
 it('runs a resize strip along the edge and stops short of the corners',()=>{const strip=resizeEdge(square[0],square[1],1).split(' ').map(p=>p.split(',').map(Number));expect(Math.min(...strip.map(p=>p[0]))).toBe(104);expect(Math.max(...strip.map(p=>p[0]))).toBe(196);expect(Math.min(...strip.map(p=>p[1]))).toBe(96);expect(Math.max(...strip.map(p=>p[1]))).toBe(104);});
});
describe('Command while resizing',()=>{
 it('leaves constrained children where they are, in preview and at commit',()=>{const parent=node('frame',{id:'p',width:200,height:100}),child=node('rectangle',{id:'c',parentId:'p',x:150,y:0,width:50,height:50,constraintX:'end'}),pinned=resizeCanvasNodes([parent,child],['p'],'e',100,0),free=resizeCanvasNodes([parent,child],['p'],'e',100,0,{ignoreConstraints:true});expect(pinned.find(n=>n.id==='c')!.x).toBe(250);expect(free.find(n=>n.id==='c')!.x).toBe(150);expect(free.find(n=>n.id==='p')!.width).toBe(300);
  const doc=blankDocument();doc.pages[0].nodes=[parent,child];useEditor.getState().load(doc);useEditor.getState().edit(d=>{d.pages[0].nodes.find(n=>n.id==='p')!.width=300;},undefined,{ignoreConstraints:['p']});expect(useEditor.getState().doc.pages[0].nodes.find(n=>n.id==='c')!.x).toBe(150);useEditor.getState().edit(d=>{d.pages[0].nodes.find(n=>n.id==='p')!.width=400;});expect(useEditor.getState().doc.pages[0].nodes.find(n=>n.id==='c')!.x).toBe(250);});
 it('does not leave children behind on a top-left drag without it',()=>{const parent=node('frame',{id:'p',x:100,y:100,width:200,height:100}),child=node('rectangle',{id:'c',parentId:'p',x:120,y:120,width:20,height:20}),moved=resizeCanvasNodes([parent,child],['p'],'nw',-50,0),held=resizeCanvasNodes([parent,child],['p'],'nw',-50,0,{ignoreConstraints:true});expect(moved.find(n=>n.id==='c')!.x).toBe(70);expect(held.find(n=>n.id==='c')!.x).toBe(120);});
});
describe('pointer box',()=>{
 const frame=node('frame',{id:'f',x:0,y:0,width:200,height:200}),child=node('rectangle',{id:'c',parentId:'f',x:20,y:20,width:40,height:40}),other=node('rectangle',{id:'o',parentId:'f',x:120,y:120,width:40,height:40}),loose=node('rectangle',{id:'l',x:300,y:0,width:40,height:40}),nodes=[frame,child,other,loose],index=boxSelectionIndex(nodes);
 it('selects touched layers at page level, and an artboard only when fully inside',()=>{expect(marqueeSelection(nodes,index,{x:290,y:-10,width:20,height:20},null,false)).toEqual(['l']);expect(marqueeSelection(nodes,index,{x:100,y:20,width:220,height:20},null,false)).toEqual(['l']);expect(marqueeSelection(nodes,index,{x:-10,y:-10,width:400,height:300},null,false)).toEqual(['f','l']);});
 it('stays inside the artboard it started on',()=>{expect(marqueeSelection(nodes,index,{x:10,y:10,width:30,height:30},'f',false)).toEqual(['c']);expect(marqueeSelection(nodes,index,{x:10,y:10,width:160,height:160},'f',false)).toEqual(['c','o']);});
 it('asks for full containment with Option',()=>{expect(marqueeSelection(nodes,index,{x:290,y:-10,width:20,height:20},null,true)).toEqual([]);expect(marqueeSelection(nodes,index,{x:290,y:-10,width:60,height:60},null,true)).toEqual(['l']);});
 it('treats only page-level frames with contents as a backdrop',()=>{expect(frameBackdrop(nodes,'f')).toBe(true);expect(frameBackdrop(nodes,'c')).toBe(false);expect(frameBackdrop([node('frame',{id:'e'})],'e')).toBe(false);});
});
describe('Escape',()=>{
 const top=node('frame',{id:'top'}),mid=node('group',{id:'mid',parentId:'top'}),leaf=node('rectangle',{id:'leaf',parentId:'mid'}),nodes=[top,mid,leaf];
 it('walks up one level, then clears',()=>{expect(escapeSelection(nodes,['leaf'])).toEqual(['mid']);expect(escapeSelection(nodes,['mid'])).toEqual(['top']);expect(escapeSelection(nodes,['top'])).toEqual([]);expect(escapeSelection(nodes,[])).toEqual([]);});
 it('stops at a locked parent instead of selecting it',()=>{expect(escapeSelection([{...top,locked:true},{...mid,parentId:'top'}],['mid'])).toEqual([]);});
 it('returns to Move before touching the selection, and the menu command still clears everything',()=>{const doc=blankDocument();doc.pages[0].nodes=nodes.map(n=>({...n}));useEditor.getState().load(doc);useEditor.getState().set({selection:['leaf'],tool:'rectangle'});runCommand('deselect',new Event('keydown'));expect(useEditor.getState().tool).toBe('move');expect(useEditor.getState().selection).toEqual(['leaf']);runCommand('deselect',new Event('keydown'));expect(useEditor.getState().selection).toEqual(['mid']);runCommand('deselect');expect(useEditor.getState().selection).toEqual([]);});
});
describe('default shortcuts',()=>{
 it('match the bindings designers bring with them',()=>{expect(Object.fromEntries(['tool-move','tool-hand','tool-frame','tool-rectangle','tool-ellipse','tool-line','tool-arrow','tool-pen','tool-pencil','tool-text','tool-comment','tool-zoom','auto-layout','group','ungroup','frame-selection','component','detach','flatten','toggle-ui','actions','flip-x','flip-y','layout-guides','rulers','outlines','forward','backward','front','back','fit','fit-selection','zoom-100','zoom-in','zoom-out'].map(id=>[id,key(id)]))).toEqual({'tool-move':'V','tool-hand':'H','tool-frame':'F','tool-rectangle':'R','tool-ellipse':'O','tool-line':'L','tool-arrow':'⇧L','tool-pen':'P','tool-pencil':'⇧P','tool-text':'T','tool-comment':'C','tool-zoom':'Z','auto-layout':'⇧A',group:'⌘G',ungroup:'⇧⌘G','frame-selection':'⌥⌘G',component:'⌥⌘K',detach:'⌥⌘B',flatten:'⌘E','toggle-ui':'⌘\\',actions:'⌘K','flip-x':'⇧H','flip-y':'⇧V','layout-guides':'⌃G',rulers:'⇧R',outlines:'⌘Y',forward:'⌘]',backward:'⌘[',front:'⌥⌘]',back:'⌥⌘[',fit:'⇧1','fit-selection':'⇧2','zoom-100':'⇧0','zoom-in':'⌘+','zoom-out':'⌘−'});});
 it('never gives one binding to two commands',()=>{const bound=commands.map(c=>c[3] as string).filter(k=>k&&k!=='Tab');expect(bound.length).toBe(new Set(bound).size);});
 it('matches the punctuation size shortcuts on an ordinary layout',()=>{const event={key:'>',code:'Period',metaKey:true,ctrlKey:false,altKey:false,shiftKey:true};expect(matchesKeyboardShortcut(event,'⇧⌘>','logical',true)).toBe(true);expect(matchesKeyboardShortcut({...event,key:'<',code:'Comma'},'⇧⌘<','logical',true)).toBe(true);});
});
describe('key dispatch',()=>{
 beforeEach(()=>{const doc=blankDocument();useEditor.getState().load(doc);useEditor.getState().set({tool:'move',selection:[]});});
 const press=(key:string,code:string,extra:object={})=>handleKey({key,code,metaKey:false,ctrlKey:false,altKey:false,shiftKey:false,isComposing:false,target:{closest:()=>null},preventDefault(){},...extra} as KeyboardEvent);
 it('reaches the Z and A tool keys',()=>{press('z','KeyZ');expect(useEditor.getState().tool).toBe('zoom');press('a','KeyA');expect(useEditor.getState().tool).toBe('frame');});
 it('still treats Command Z as Undo rather than the zoom tool',()=>{useEditor.getState().set({tool:'move'});press('z','KeyZ',{metaKey:true});expect(useEditor.getState().tool).toBe('move');});
});
describe('equal spacing',()=>{
 it('reports each repeated gap so the canvas can mark them',()=>{const a=node('rectangle',{id:'a',x:0,y:0,width:50,height:50}),b=node('rectangle',{id:'b',x:80,y:0,width:50,height:50}),m=node('rectangle',{id:'m',x:158,y:0,width:50,height:50}),page={guides:[]} as never,result=snapMove({nodes:[a,b,m],movingIds:['m'],box:{x:158,y:0,width:50,height:50},dx:0,dy:0,zoom:1,page,preferences:{...defaultSnapping,objects:false,centers:false,guides:false,frames:false}}),line=result.lines.find(l=>l.kind==='spacing')!;expect(result.dx).toBe(2);expect(line.distance).toBe(30);expect(line.gaps).toEqual([[50,80],[130,160]]);});
});
