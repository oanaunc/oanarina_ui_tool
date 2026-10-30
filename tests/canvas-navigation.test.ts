import {afterEach,describe,expect,it,vi} from 'vitest';
import {CanvasNavigation,MAX_CAMERA_HISTORY} from '../src/canvas-navigation';
import {blankDocument,node} from '../src/model';
import {useEditor} from '../src/store';
import {DesktopDocumentTracker} from '../src/desktop-lifecycle';
import {commands,matchesShortcut} from '../src/commands';
const camera=(x:number)=>({zoom:1,pan:{x,y:0}});
afterEach(()=>vi.useRealTimers());
describe('bounded ephemeral camera navigation',()=>{
 it('registers distinct nonconflicting shortcuts including physical Option-generated keys',()=>{
  const event={key:'ArrowLeft',code:'ArrowLeft',metaKey:true,ctrlKey:false,altKey:true,shiftKey:false};for(const [id,key,code] of [['previous-viewport','ArrowLeft','ArrowLeft'],['next-viewport','ArrowRight','ArrowRight'],['find-selection','ƒ','KeyF']]){const command=commands.find(c=>c[0]===id)!;expect(commands.filter(c=>c[3]===command[3])).toHaveLength(1);expect(matchesShortcut({...event,key,code},command[3])).toBe(true);}
 });
 it('coalesces a continuous wheel/drag sequence, keeps discrete destinations and forks after Back',()=>{
  const h=new CanvasNavigation();h.reset(camera(0));h.record(camera(0),camera(1),0);h.record(camera(1),camera(2),100);h.record(camera(2),camera(3),300);expect(h.move(-1)).toEqual(camera(0));expect(h.move(1)).toEqual(camera(3));h.record(camera(3),camera(4),301,true);h.record(camera(4),camera(5),302,true);expect(h.move(-1)).toEqual(camera(4));expect(h.move(-1)).toEqual(camera(3));h.record(camera(3),camera(6),303);expect(h.next).toBe(false);expect(h.move(-1)).toEqual(camera(3));expect(h.move(-1)).toEqual(camera(0));expect(h.move(-1)).toBeUndefined();
 });
 it('bounds history, owns returned cameras and ends manual groups after an idle gap',()=>{
  const h=new CanvasNavigation();h.reset(camera(0));for(let i=1;i<=MAX_CAMERA_HISTORY+10;i++)h.record(camera(i-1),camera(i),i*500);let count=0;while(h.previous){const c=h.move(-1)!;c.pan.x=99999;count++;}expect(count).toBe(MAX_CAMERA_HISTORY-1);expect(h.move(1)!.pan.x).not.toBe(99999);h.reset(camera(7));expect(h.previous).toBe(false);expect(h.next).toBe(false);
 });
 it('never mixes document/page loads or adds document edits/native dirty state',()=>{
  const d=blankDocument();d.pages.push({id:'other',name:'Other',nodes:[],comments:[]});useEditor.getState().load(d);const tracker=new DesktopDocumentTracker();tracker.mark(d);const s=()=>useEditor.getState();s().setCamera(camera(10));s().setCamera(camera(20));s().navigateViewport(-1);expect(s().pan.x).toBe(10);expect(s().nextViewport).toBe(true);s().selectPage('other');expect(s().previousViewport).toBe(false);expect(s().nextViewport).toBe(false);s().navigateViewport(-1);expect(s().pan.x).toBe(12);s().setCamera(camera(30));s().load(structuredClone(d));expect(s().previousViewport).toBe(false);expect(s().nextViewport).toBe(false);expect(s().doc).toEqual(d);expect(s().past).toEqual([]);expect(s().future).toEqual([]);expect(tracker.state(s().doc).dirty).toBe(false);s().newDocument();expect(s().previousViewport).toBe(false);
 });
 it('finds transformed nested selections without magnifying or modifying geometry',()=>{
  const d=blankDocument(),frame=node('frame',{x:5000,y:-2000,width:1000,height:1000,rotation:90}),child=node('rectangle',{parentId:frame.id,x:5100,y:-1900,width:80,height:40});d.pages[0].nodes=[frame,child];useEditor.getState().load(d);const s=()=>useEditor.getState();s().set({selection:[child.id]});s().setCamera({zoom:.5});s().findSelection();expect(s().zoom).toBe(.5);expect(s().pan).not.toEqual({x:12,y:16});expect(s().doc).toEqual(d);expect(s().past).toEqual([]);s().set({selection:[]});expect(()=>s().findSelection()).toThrow(/visible layer/);
 });
});
