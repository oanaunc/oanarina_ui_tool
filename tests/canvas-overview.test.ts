import {afterEach,describe,expect,it} from 'vitest';
import {canvasViewport,centeredCamera,MAX_OVERVIEW_BOXES,MAX_OVERVIEW_NODES,overviewExtent,overviewProjection,overviewScene,scrollbarAxis} from '../src/canvas-overview';
import {blankDocument,node} from '../src/model';
import {nodeBounds} from '../src/guides';
import {sampleMotion,setKeyframe} from '../src/motion';
import {useEditor} from '../src/store';
import {DesktopDocumentTracker} from '../src/desktop-lifecycle';
import {validPageCamera} from '../src/page-viewports';
const s=()=>useEditor.getState(),camera=(x=100)=>({zoom:1,pan:{x,y:50}});
afterEach(()=>{if(s().cameraGesture!==null)s().finishCameraGesture(s().cameraGesture!,true);s().disablePageViewports();});

describe('bounded schematic overview geometry',()=>{
 it('uses transformed visible bounds, respects hidden ancestors and clips, and leaves source nodes intact',()=>{
  const parent=node('frame',{x:100,y:100,width:100,height:50,rotation:90,clip:true}),child=node('rectangle',{parentId:parent.id,x:110,y:110,width:20,height:10}),hidden=node('frame',{visible:false,x:-5000}),hiddenChild=node('rectangle',{parentId:hidden.id,x:-4900}),outside=node('rectangle',{parentId:parent.id,x:10000,y:10000,width:100,height:100}),slice=node('slice',{x:-10000});const nodes=[child,hiddenChild,parent,hidden,outside,slice],before=structuredClone(nodes),scene=overviewScene(nodes);expect(scene.boxes.map(b=>b.id)).toEqual([child.id,parent.id]);expect(scene.bounds).toEqual(nodeBounds(parent,nodes));expect(nodes).toEqual(before);
 });
 it('summarizes current sampled motion including inherited scaling and rotation',()=>{
  const p=blankDocument().pages[0],n=node('rectangle',{width:100,height:50,flipX:true});p.nodes=[n];setKeyframe(p,n.id,'x',0,0);setKeyframe(p,n.id,'x',2,10000);setKeyframe(p,n.id,'rotation',2,90);const sampled=sampleMotion(p.nodes,p.motion,2);expect(overviewScene(sampled).bounds).toEqual(nodeBounds(sampled[0],sampled));expect(n.x).toBe(0);
 });
 it('skips cycles, duplicate IDs, nonfinite and overflowing world geometry without poisoning independent layers',()=>{
  const a=node('group',{id:'a',parentId:'b'}),b=node('group',{id:'b',parentId:'a'}),bad=node('rectangle',{x:Infinity}),huge=node('frame',{motionScaleX:10000,width:1000000}),good=node('rectangle',{x:20,y:30,width:40,height:50}),dup=node('rectangle',{id:'duplicate'}),nodes=[a,b,bad,huge,good,dup,{...dup},node('rectangle',{parentId:'a'})];const result=overviewScene(nodes);expect(result.boxes.map(b=>b.id)).toEqual([good.id]);expect(result.bounds).toEqual({x:20,y:30,width:40,height:50});expect(result.invalid).toBeGreaterThanOrEqual(5);
 });
 it('handles a full reverse-ordered 20000-deep page without recursion and caps rendered outlines without truncating valid bounds',()=>{
  const base=node('group',{x:0,y:0,width:1,height:1}),nodes=Array.from({length:MAX_OVERVIEW_NODES},(_,i)=>({...base,id:String(i),parentId:i?String(i-1):null,type:i===MAX_OVERVIEW_NODES-1?'rectangle' as const:'group' as const}));expect(overviewScene(nodes.reverse()).boxes).toHaveLength(1);const rectangles=Array.from({length:2000},(_,i)=>({...base,id:String(i),parentId:null,type:'rectangle' as const,x:i*10})),scene=overviewScene(rectangles);expect(scene.boxes).toHaveLength(MAX_OVERVIEW_BOXES);expect(scene.omitted).toBe(500);expect(scene.bounds!.width).toBe(19991);
 });
 it('preserves extreme valid camera centers and reaches stable scrollbar Home/End extents',()=>{const c={zoom:.05,pan:{x:-10000000,y:10000000}},view=canvasViewport(c,1000,700);expect(centeredCamera(c,1000,700,{x:view.x+view.width/2,y:view.y+view.height/2})).toEqual(c);const scene={x:0,y:0,width:5000,height:3000},initial=canvasViewport(camera(),1000,700),extent=overviewExtent(scene,initial),axis=scrollbarAxis(extent,initial,'x',500,1);const moved={...initial,x:axis.minimum},after=scrollbarAxis(overviewExtent(scene,moved),moved,'x',500,1);expect(after.value).toBe(after.minimum);});
 it('keeps empty-canvas axes, extreme inputs, projection inverses and camera destinations finite and bounded',()=>{
  const c=camera(),view=canvasViewport(c,1000,700),extent=overviewExtent(null,view),axis=scrollbarAxis(extent,view,'x',500,c.zoom);expect(axis.minimum).toBeLessThan(axis.value);expect(axis.maximum).toBeGreaterThan(axis.value);expect(axis.fromOffset(-1e9)).toBe(axis.minimum);expect(axis.fromOffset(1e9)).toBe(axis.maximum);const projection=overviewProjection(extent),rect=projection.project(view),back=projection.world(rect.x,rect.y);expect(back.x).toBeCloseTo(view.x);expect(back.y).toBeCloseTo(view.y);expect(validPageCamera(centeredCamera({zoom:Infinity,pan:{x:0,y:0}},Infinity,NaN,{x:Infinity,y:1e100}))).toBe(true);const invalid={x:NaN,y:0,width:Infinity,height:-1},fallback=overviewProjection(invalid),badAxis=scrollbarAxis(invalid,invalid,'y',NaN,NaN);expect([fallback.scale,fallback.x,fallback.y,badAxis.minimum,badAxis.maximum,badAxis.value,badAxis.size,badAxis.fromOffset(NaN)].every(Number.isFinite)).toBe(true);
 });
});

describe('camera gesture transactions',()=>{
 function setup(){const d=blankDocument();d.pages[0].nodes=[node('rectangle')];d.pages.push({id:'other',name:'Other',nodes:[],comments:[]});s().load(d);s().enablePageViewports();s().setCamera(camera());return d;}
 it('previews live, cancels without history destinations and commits exactly one navigation destination without dirty/undo changes',()=>{
  const d=setup(),tracker=new DesktopDocumentTracker();tracker.mark(d);let token=s().beginCameraGesture();expect(s().updateCameraGesture(token,camera(200))).toBe(true);s().updateCameraGesture(token,camera(300));expect(s().pan.x).toBe(300);s().finishCameraGesture(token,true);expect(s().pan.x).toBe(100);s().navigateViewport(-1);expect(s().pan.x).toBe(12);s().navigateViewport(1);expect(s().pan.x).toBe(100);token=s().beginCameraGesture();s().updateCameraGesture(token,camera(200));s().updateCameraGesture(token,camera(300));s().finishCameraGesture(token);s().navigateViewport(-1);expect(s().pan.x).toBe(100);s().navigateViewport(1);expect(s().pan.x).toBe(300);expect(s().doc).toEqual(d);expect(s().past).toEqual([]);expect(s().future).toEqual([]);expect(tracker.state(s().doc).dirty).toBe(false);
 });
 it('restores the interrupted page cache and refuses obsolete updates after a page switch or same-ID reopen',()=>{
  const d=setup(),first=d.pages[0].id;let token=s().beginCameraGesture();s().updateCameraGesture(token,camera(300));s().selectPage('other');expect(s().updateCameraGesture(token,camera(999))).toBe(false);expect(s().finishCameraGesture(token,true)).toBe(false);s().selectPage(first);expect(s().pan.x).toBe(100);token=s().beginCameraGesture();s().updateCameraGesture(token,camera(400));s().load(structuredClone(d));expect(s().pan.x).toBe(100);expect(s().cameraGesture).toBeNull();expect(s().finishCameraGesture(token,true)).toBe(false);
 });
 it('never restores an obsolete baseline over a newer camera command or navigation action',()=>{
  setup();let token=s().beginCameraGesture();s().updateCameraGesture(token,camera(300));s().setCamera({zoom:2});expect(s().finishCameraGesture(token,true)).toBe(false);expect(s().zoom).toBe(2);s().navigateViewport(-1);expect(s()).toMatchObject(camera());token=s().beginCameraGesture();s().updateCameraGesture(token,camera(400));s().navigateViewport(-1);expect(s().pan.x).toBe(12);expect(s().finishCameraGesture(token,true)).toBe(false);expect(s().pan.x).toBe(12);
 });
 it('rejects invalid preview cameras and cancels after document edits, modal changes and motion scrubbing',()=>{
  const d=setup();let token=s().beginCameraGesture();expect(s().updateCameraGesture(token,{zoom:NaN,pan:{x:0,y:0}})).toBe(false);expect(s().pan.x).toBe(100);s().updateCameraGesture(token,camera(300));s().patch([d.pages[0].nodes[0].id],{x:25});expect(s().pan.x).toBe(100);expect(s().past).toHaveLength(1);expect(s().cameraGesture).toBeNull();token=s().beginCameraGesture();s().updateCameraGesture(token,camera(400));s().set({modal:'actions'});expect(s().pan.x).toBe(100);expect(s().cameraGesture).toBeNull();s().set({modal:null});token=s().beginCameraGesture();s().updateCameraGesture(token,camera(500));s().set({motionOpen:true,motionTime:1});expect(s().pan.x).toBe(100);expect(s().cameraGesture).toBeNull();
 });
});
