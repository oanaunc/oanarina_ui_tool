import {describe,expect,it} from 'vitest';
import {blankDocument,node} from '../src/model';
import {createReaction,defaultTransition,smartLayerTravel} from '../src/prototype';
import type {PrototypeTransition} from '../src/prototype';
import {DRAG_FASTEST_SETTLE,DRAG_FLICK,dragProgress,dragReactions,dragRelease,dragTrack,dragVelocity,settleDone,settledProgress} from '../src/prototype-drag';
const size={width:400,height:800};
const t=(extra:Partial<PrototypeTransition>):PrototypeTransition=>({...defaultTransition(),duration:300,...extra});
describe('how a drag maps to a transition',()=>{
 it('follows a push in its own direction, over the frame',()=>{expect(dragTrack(t({type:'push',direction:'left'}),size,{x:-10,y:0})).toEqual({axis:{x:-1,y:0},distance:400});expect(dragTrack(t({type:'move-in',direction:'top'}),size,{x:0,y:-10})).toEqual({axis:{x:0,y:-1},distance:800});expect(dragTrack(t({type:'slide-in',direction:'right'}),size,{x:3,y:0}).axis).toEqual({x:1,y:0});expect(dragTrack(t({type:'move-out',direction:'bottom'}),size,{x:0,y:3}).axis).toEqual({x:0,y:1});});
 it('gives a directional transition the same axis whichever way the finger first went',()=>{expect(dragTrack(t({type:'push',direction:'left'}),size,{x:50,y:0}).axis).toEqual({x:-1,y:0});});
 it('follows the drag for a dissolve, along whichever axis it started',()=>{expect(dragTrack(t({type:'dissolve'}),size,{x:-30,y:10})).toEqual({axis:{x:-1,y:0},distance:400});expect(dragTrack(t({type:'dissolve'}),size,{x:5,y:30})).toEqual({axis:{x:0,y:1},distance:800});});
 it('keeps a traveling Smart animate layer under the finger',()=>{const track=dragTrack(t({type:'smart-animate'}),size,{x:0,y:-40},{x:0,y:-200});expect(track).toEqual({axis:{x:0,y:-1},distance:200});expect(dragProgress(track,{x:15,y:-50})).toBeCloseTo(.25,6);});
 it('falls back to the drag when the layer stays put',()=>{expect(dragTrack(t({type:'smart-animate'}),size,{x:-10,y:0},{x:.2,y:0}).distance).toBe(400);});
 it('turns distance into progress and clamps it',()=>{const track=dragTrack(t({type:'push',direction:'left'}),size,{x:-1,y:0});expect(dragProgress(track,{x:-100,y:0})).toBeCloseTo(.25,6);expect(dragProgress(track,{x:100,y:0})).toBe(0);expect(dragProgress(track,{x:-900,y:0})).toBe(1);expect(dragProgress(track,{x:-100,y:0},.5)).toBeCloseTo(.75,6);});
});
describe('letting go',()=>{
 it('measures speed over the last moments only',()=>{expect(dragVelocity([{time:0,progress:0},{time:880,progress:.1},{time:950,progress:.2},{time:1000,progress:.3}],1000)).toBeCloseTo(.2/120,6);expect(dragVelocity([{time:0,progress:0},{time:50,progress:.5}],400)).toBe(0);expect(dragVelocity([{time:0,progress:0},{time:20,progress:.4},{time:320,progress:.4}],320)).toBe(0);expect(dragVelocity([{time:0,progress:.1},{time:150,progress:.2},{time:300,progress:.3},{time:310,progress:.3}],310)).toBeCloseTo(.1/160,6);expect(dragVelocity([],0)).toBe(0);expect(dragVelocity([{time:5,progress:.2}],5)).toBe(0);});
 it('finishes past halfway and returns short of it',()=>{expect(dragRelease(.6,0,300).commit).toBe(true);expect(dragRelease(.4,0,300).commit).toBe(false);});
 it('lets a flick overrule the position, in both directions',()=>{expect(dragRelease(.2,DRAG_FLICK*2,300).commit).toBe(true);expect(dragRelease(.8,-DRAG_FLICK*2,300).commit).toBe(false);expect(dragRelease(.2,DRAG_FLICK/2,300).commit).toBe(false);});
 it('plays only the time that is left, and sooner for a fast finger',()=>{expect(dragRelease(.75,0,400).duration).toBeCloseTo(100,6);expect(dragRelease(.5,.01,400).duration).toBeCloseTo(DRAG_FASTEST_SETTLE,6);});
 it('never settles longer than the transition, nor below the floor unless it is shorter',()=>{expect(dragRelease(.9,0,300).duration).toBeCloseTo(DRAG_FASTEST_SETTLE,6);expect(dragRelease(.9,0,20).duration).toBe(20);});
 it('eases from where the finger left it to the end',()=>{const tracked={track:{axis:{x:1,y:0},distance:100},progress:.4,origin:{frameId:'a',history:[],overlays:[],values:{},variants:{}},settle:{from:.4,to:1,start:100,duration:200}};expect(settledProgress(tracked,100)).toBeCloseTo(.4,6);expect(settledProgress(tracked,300)).toBeCloseTo(1,6);expect(settledProgress(tracked,200)).toBeGreaterThan(.7);expect(settleDone(tracked,299)).toBe(false);expect(settleDone(tracked,300)).toBe(true);expect(settledProgress({...tracked,settle:undefined},300)).toBe(.4);});
});
describe('several swipes on one layer',()=>{
 const swipe=(direction:PrototypeTransition['direction'])=>{const r=createReaction('drag');r.actions[0].transition=t({type:'push',direction});return r;};
 it('runs only the reaction aimed along the drag',()=>{const left=swipe('left'),right=swipe('right');expect(dragReactions([left,right],{x:-40,y:0})).toEqual([left]);expect(dragReactions([left,right],{x:40,y:0})).toEqual([right]);});
 it('keeps a lone reaction and reactions with no direction',()=>{const left=swipe('left'),fade=createReaction('drag');fade.actions[0].transition=t({type:'dissolve'});expect(dragReactions([left],{x:40,y:0})).toEqual([left]);expect(dragReactions([left,fade],{x:40,y:0})).toEqual([left,fade]);});
});
describe('a layer that travels between frames',()=>{
 it('reports its center-to-center distance through the frame origins',()=>{const d=blankDocument();d.pages[0].nodes=[node('frame',{id:'a',width:300,height:600}),node('rectangle',{id:'sheet-a',name:'Sheet',parentId:'a',x:0,y:500,width:300,height:100}),node('frame',{id:'b',x:400,width:300,height:600}),node('rectangle',{id:'sheet-b',name:'Sheet',parentId:'b',x:400,y:100,width:300,height:500})];const page=d.pages[0];expect(smartLayerTravel(page,'a',page,'b','sheet-a')).toEqual({x:0,y:-200});expect(smartLayerTravel(page,'a',page,'b','missing')).toBeUndefined();});
});
