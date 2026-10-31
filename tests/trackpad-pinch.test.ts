import {describe,it,expect} from 'vitest';
import {bindTrackpadPinch,pinchCamera,PINCH_ZOOM_LIMITS} from '../src/trackpad-pinch';
import {liveCamera} from '../src/canvas-camera';
import {useEditor} from '../src/store';
Object.assign(globalThis,{requestAnimationFrame:()=>1,cancelAnimationFrame:()=>{}});
function element(){const listeners=new Map<string,(event:Event)=>void>();return {listeners,style:{},querySelector:()=>null,getBoundingClientRect:()=>({left:10,top:20}),addEventListener:(type:string,fn:(event:Event)=>void)=>listeners.set(type,fn),removeEventListener:(type:string)=>listeners.delete(type)};}
const gesture=(scale:number,clientX=110,clientY=120)=>{let prevented=false;return {scale,clientX,clientY,preventDefault:()=>{prevented=true;},get prevented(){return prevented;}};};
describe('trackpad pinch camera',()=>{
 it('scales from the gesture start and keeps the anchor point fixed',()=>{const camera={zoom:1,pan:{x:10,y:20}},next=pinchCamera(1,camera,2,100,100)!;expect(next.zoom).toBe(2);expect((100-next.pan.x)/next.zoom).toBeCloseTo((100-10)/1);expect((100-next.pan.y)/next.zoom).toBeCloseTo((100-20)/1);});
 it('clamps to the editor zoom range',()=>{const camera={zoom:1,pan:{x:0,y:0}};expect(pinchCamera(1,camera,100,0,0)!.zoom).toBe(PINCH_ZOOM_LIMITS.max);expect(pinchCamera(1,camera,.0001,0,0)!.zoom).toBe(PINCH_ZOOM_LIMITS.min);});
 it('ignores unusable values',()=>{const camera={zoom:1,pan:{x:0,y:0}};for(const [start,scale,x] of [[1,Number.NaN,0],[1,0,0],[1,-1,0],[0,1,0],[1,1,Number.POSITIVE_INFINITY]])expect(pinchCamera(start,camera,scale,x,0)).toBeUndefined();});
});
describe('gesture binding',()=>{
 it('zooms through gesture events, prevents browser handling, ignores stray changes and unbinds',()=>{const el=element(),off=bindTrackpadPinch(el as unknown as Element);useEditor.setState({zoom:1,pan:{x:0,y:0}});const stray=gesture(4);el.listeners.get('gesturechange')!(stray as unknown as Event);expect(useEditor.getState().zoom).toBe(1);expect(stray.prevented).toBe(true);const start=gesture(1);el.listeners.get('gesturestart')!(start as unknown as Event);expect(start.prevented).toBe(true);el.listeners.get('gesturechange')!(gesture(1.5) as unknown as Event);expect(liveCamera().zoom).toBe(1.5);el.listeners.get('gesturechange')!(gesture(2) as unknown as Event);expect(liveCamera().zoom).toBe(2);expect((100-liveCamera().pan.x)/2).toBeCloseTo(100);el.listeners.get('gestureend')!(gesture(2) as unknown as Event);el.listeners.get('gesturechange')!(gesture(8) as unknown as Event);expect(useEditor.getState().zoom).toBe(2);off();expect(el.listeners.size).toBe(0);});
});
