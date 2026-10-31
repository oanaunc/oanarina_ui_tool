import {describe,expect,it} from 'vitest';
import {blankDocument,node} from '../src/model';
import type {DesignNode} from '../src/model';
import {createEffect} from '../src/effects';
import {createStroke} from '../src/paints';
import {smartAnimate} from '../src/prototype';

function run(a:Partial<DesignNode>,b:Partial<DesignNode>,type:DesignNode['type']='rectangle',progress=.5){const p=blankDocument().pages[0];p.nodes=[node('frame',{id:'one',width:100,height:100}),node(type,{id:'x',name:'Layer',parentId:'one',width:50,height:50,...a}),node('frame',{id:'two',x:200,width:100,height:100}),node(type,{id:'y',name:'Layer',parentId:'two',x:200,width:50,height:50,...b})];return smartAnimate(p,'one',p,'two',progress);}
const matched=(nodes:DesignNode[])=>nodes.find(n=>n.id==='y')!;
describe('smart animate matched properties',()=>{
 it('interpolates stroke width, color and opacity',()=>{const n=matched(run({strokes:[{...createStroke('#000000'),width:2}]},{strokes:[{...createStroke('#ffffff'),width:10}]}));expect(n.strokes![0].width).toBe(6);expect(n.strokes![0].paint.color).toBe('#808080');});
 it('interpolates a shadow and fades one that turns on',()=>{const on={...createEffect(),x:0,y:0,radius:0,spread:0,opacity:.2,color:'#000000'},off={...on,x:10,y:20,radius:30,spread:4,opacity:.6,color:'#ffffff'};const n=matched(run({effects:[on]},{effects:[off]}));expect(n.effects![0]).toMatchObject({x:5,y:10,radius:15,spread:2,color:'#808080'});expect(n.effects![0].opacity).toBeCloseTo(.4,6);const fading=matched(run({effects:[{...on,visible:false}]},{effects:[{...on,visible:true,opacity:.8}]}));expect(fading.effects![0]).toMatchObject({visible:true});expect(fading.effects![0].opacity).toBeCloseTo(.4,6);});
 it('takes the destination for mismatched stacks and for the final frame',()=>{const stroke=createStroke('#000000');const n=matched(run({strokes:[stroke,createStroke()]},{strokes:[{...stroke,width:9}]}));expect(n.strokes).toHaveLength(1);expect(n.strokes![0].width).toBe(9);const end=matched(run({strokes:[{...stroke,width:1}]},{strokes:[{...stroke,width:9}]},'rectangle',1));expect(end.strokes![0].width).toBe(9);});
 it('interpolates independent corners and scale',()=>{const n=matched(run({corners:[0,0,0,0],motionScaleX:1},{corners:[8,16,24,32],motionScaleX:3}));expect(n.corners).toEqual([4,8,12,16]);expect(n.motionScaleX).toBe(2);});
 it('animates font size for the same words',()=>{const nodes=run({text:'Same',fontSize:10,letterSpacing:0},{text:'Same',fontSize:30,letterSpacing:4},'text');expect(matched(nodes)).toMatchObject({fontSize:20,letterSpacing:2});expect(nodes.some(n=>n.id.startsWith('exiting-text'))).toBe(false);});
 it('crossfades different words in place, with stable parents and a complete end state',()=>{const nodes=run({text:'Before',y:0},{text:'After',y:40},'text',.25),n=matched(nodes),old=nodes.find(a=>a.id==='exiting-text-y')!;expect(n.text).toBe('After');expect(n.opacity).toBeCloseTo(.25,6);expect(old).toMatchObject({text:'Before',parentId:'two',y:n.y,x:n.x});expect(old.opacity).toBeCloseTo(.75,6);const end=run({text:'Before'},{text:'After'},'text',1);expect(matched(end).opacity).toBe(1);expect(end.find(a=>a.id==='exiting-text-y')?.opacity).toBe(0);});
 it('leaves unstroked layers without invented stacks',()=>{const n=matched(run({},{}));expect(n.effects).toBeUndefined();});
});
