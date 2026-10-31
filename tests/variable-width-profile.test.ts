import {describe,expect,it} from 'vitest';
import {node} from '../src/model';
import type {DesignNode,VectorPoint} from '../src/model';
import {createStroke} from '../src/paints';
import {taperPatch,widthPointPatch,widthTapers} from '../src/variable-width-profile';
import {validateVariableWidthNode,variableContourPoints,variableWidthPath} from '../src/variable-width';

const stroke=(active=false)=>({...createStroke('#ff0000'),width:10,join:'round' as const,...(active?{variableWidth:'points' as const}:{})});
const curve=(extra:Partial<DesignNode>={},points:VectorPoint[]=[{x:0,y:100,out:{x:30,y:-140}},{x:200,y:100,in:{x:-30,y:-140}}])=>node('path',{id:'v',x:10,y:20,width:200,height:100,pathWidth:200,pathHeight:100,fill:'none',strokes:[stroke()],contours:[{closed:false,points}],...extra});
const straight=(scales:number[]=[1,1,1])=>node('path',{id:'s',x:0,y:0,width:300,height:100,pathWidth:300,pathHeight:100,fill:'none',strokes:[stroke(true)],contours:[{closed:false,points:[{x:0,y:0,widthScale:scales[0]},{x:100,y:0,widthScale:scales[1]},{x:300,y:0,widthScale:scales[2]}]}]});

describe('taper presets',()=>{
 it('offers the four presets and follows real length rather than anchor count',()=>{expect(widthTapers.map(t=>t[0])).toEqual(['uniform','start','end','both']);const n=straight(),scales=(kind:Parameters<typeof taperPatch>[1])=>taperPatch(n,kind).contours[0].points.map(p=>p.widthScale!);expect(scales('start')).toEqual([0,1/3,1]);expect(scales('end')[0]).toBe(1);expect(scales('end')[1]).toBeCloseTo(2/3,8);expect(scales('end')[2]).toBe(0);expect(scales('uniform')).toEqual([1,1,1]);expect(scales('both')[0]).toBe(0);expect(scales('both')[1]).toBeCloseTo(2/3,8);expect(scales('both')[2]).toBe(0);});
 it('measures through the layer scale and handles several contours independently',()=>{const n=straight();n.contours!.push({closed:false,points:[{x:0,y:50,widthScale:2},{x:300,y:50,widthScale:2}]});n.width=600;const patch=taperPatch(n,'start');expect(patch.contours[1].points.map(p=>p.widthScale)).toEqual([0,1]);expect(variableContourPoints({...n,...patch},1).at(-1)!.x).toBe(600);});
 it('refuses without an active profile and for unknown presets',()=>{expect(()=>taperPatch(curve(),'start')).toThrow('Enable point widths');expect(()=>taperPatch(straight(),'wild' as never)).toThrow('supported taper');});
 it('stays valid at a zero tip',()=>{const n=straight(),t={...n,...taperPatch(n,'both')};expect(()=>validateVariableWidthNode(t)).not.toThrow();expect(variableWidthPath(t,t.strokes![0])).not.toContain('NaN');});
});
describe('width points between anchors',()=>{
 it('inserts on the segment without moving the line, interpolating its width',()=>{const n=straight([1,3,3]),{patch,key}=widthPointPatch(n,'0:0',25),points=patch.contours[0].points;expect(key).toBe('0:1');expect(points).toHaveLength(4);expect(points[1]).toEqual({x:25,y:0,widthScale:1.5});expect(points[2]).toEqual(n.contours![0].points[1]);expect(()=>validateVariableWidthNode({...n,...patch})).not.toThrow();expect(n.contours![0].points).toHaveLength(3);});
 it('uses the previous segment from a last anchor',()=>{const {patch,key}=widthPointPatch(straight([1,1,5]),'0:2',50);expect(key).toBe('0:2');expect(patch.contours[0].points[2]).toEqual({x:200,y:0,widthScale:3});});
 it('refuses bad positions, stale anchors, inactive paths and the anchor budget',()=>{const n=straight();for(const percent of [0,100,-5,NaN,Infinity])expect(()=>widthPointPatch(n,'0:0',percent)).toThrow('1% to 99%');expect(()=>widthPointPatch(n,'0:9',50)).toThrow('no longer exists');expect(()=>widthPointPatch(n,'9:0',50)).toThrow('no longer exists');expect(()=>widthPointPatch(n,'bad',50)).toThrow('Choose');expect(()=>widthPointPatch(curve(),'0:0',50)).toThrow('Choose');n.contours![0].points=Array.from({length:512},(_,i)=>({x:i,y:0,widthScale:1}));expect(()=>widthPointPatch(n,'0:0',50)).toThrow('512');});
});
