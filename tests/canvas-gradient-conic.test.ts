import {describe,expect,it} from 'vitest';
import {ANGULAR_RING,gradientAxis,gradientHandlePatch,gradientHandlePoint,validateCanvasGradient} from '../src/canvas-gradient-geometry';
import {node} from '../src/model';
import {createPaint} from '../src/paints';
import type {Paint} from '../src/paints';
const stops=[{id:'a',position:0,color:'#ff0000',opacity:1},{id:'b',position:.5,color:'#0000ff',opacity:1}];
const fixture=(type:'angular'|'diamond',props:Partial<Paint>={})=>{const paint:Paint={...createPaint('#ff0000',type),id:'p',cx:.5,cy:.5,radius:.25,angle:0,stops,...props},n=node('rectangle',{id:'n',x:100,y:100,width:200,height:100,paints:[paint]});return {n,paint,nodes:[n]};};
describe('diamond gradient handles',()=>{
 it('places the size handle along the rotation and sizes and turns it together',()=>{const {n,paint,nodes}=fixture('diamond',{angle:90});const tip=gradientHandlePoint(paint,'radius');expect(tip.x).toBeCloseTo(.5,6);expect(tip.y).toBeCloseTo(.75,6);const patch=gradientHandlePatch(n,paint,nodes,'radius',0,25)!;expect(patch.radius).toBeCloseTo(.5,6);expect(patch.angle).toBeCloseTo(90,6);const sideways=gradientHandlePatch(n,paint,nodes,'radius',50,-25)!;expect(sideways.angle).toBeCloseTo(0,6);expect(sideways.radius).toBeCloseTo(.25,6);});
 it('moves its center and stops along the axis',()=>{const {n,paint,nodes}=fixture('diamond');expect(gradientHandlePatch(n,paint,nodes,'center',20,10)).toMatchObject({cx:.6,cy:.6});const patch=gradientHandlePatch(n,paint,nodes,'stop:b',25,0)!;expect(patch.stops![1].position).toBeCloseTo(1,6);});
});
describe('angular gradient handles',()=>{
 it('keeps handles on a fixed ring and turns without any size',()=>{const {n,paint,nodes}=fixture('angular');expect(gradientAxis(paint)[1]).toEqual({x:.5+ANGULAR_RING,y:.5});const tip=gradientHandlePatch(n,paint,nodes,'radius',-100,50)!;expect(tip.angle).toBeCloseTo(90,6);expect(tip.radius).toBeUndefined();});
 it('puts each stop at its share of the turn and drags it around the ring',()=>{const {n,paint,nodes}=fixture('angular',{stops:[stops[0],{...stops[1],position:.25}]}),at=gradientHandlePoint(paint,'stop:b');expect(at.x).toBeCloseTo(.5,6);expect(at.y).toBeCloseTo(1,6);const patch=gradientHandlePatch(n,paint,nodes,'stop:b',-100,-50)!;expect(patch.stops![1].position).toBeCloseTo(.5,6);const clamped=gradientHandlePatch(n,paint,nodes,'stop:a',0,-50)!;expect(clamped.stops![0].position).toBe(0);});
 it('wraps the rotation and leaves a collapsed drag without a patch',()=>{const {n,paint,nodes}=fixture('angular',{angle:170});const result=gradientHandlePatch(n,paint,nodes,'radius',0,0);expect(result?.angle).toBeCloseTo(170,6);const tip=gradientHandlePoint(paint,'radius');expect(gradientHandlePatch(n,paint,nodes,'radius',(.5-tip.x)*200,(.5-tip.y)*100)).toBeNull();});
 it('still refuses unsupported boxes, hidden paints and out-of-range centers',()=>{const {n,paint,nodes}=fixture('angular');expect(()=>validateCanvasGradient(node('text',{height:0}),paint,nodes)).toThrow('no area');expect(()=>validateCanvasGradient(n,{...paint,visible:false},nodes)).toThrow('visible gradient');expect(()=>validateCanvasGradient(n,{...paint,cx:9},nodes)).toThrow('support center');expect(()=>validateCanvasGradient(n,createPaint('#000000'),nodes)).toThrow();});
});
