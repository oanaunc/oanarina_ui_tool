import {describe,it,expect} from 'vitest';
import {node} from '../src/model';
import {createEffect} from '../src/effects';
import {detailZoom,shownEffects,textBars,tinyText} from '../src/canvas-detail';
describe('canvas detail',()=>{
 it('keeps full detail from 70% up and moves in half-octave steps below that',()=>{expect(detailZoom(1)).toBeUndefined();expect(detailZoom(.7)).toBeUndefined();expect(detailZoom(.2)).toBeCloseTo(.25);expect(detailZoom(.21)).toBe(detailZoom(.24));expect(detailZoom(0)).toBeUndefined();expect(detailZoom(NaN)).toBeUndefined();});
 it('turns text into bars only when it is too small to read, counting its largest run',()=>{const small=node('text',{fontSize:13}),mixed=node('text',{fontSize:13,textRuns:[{start:0,end:2,fontSize:48}]} as never);expect(tinyText(small,undefined)).toBe(false);expect(tinyText(small,.25)).toBe(true);expect(tinyText(small,.5)).toBe(false);expect(tinyText(mixed,.25)).toBe(false);});
 it('draws one bar per line, aligned as the text is, and nothing for empty text',()=>{const base={text:'word '.repeat(40),width:100,height:60,fontSize:10,lineHeight:1.5};expect(textBars({...base,textAlign:'left'}).match(/M/g)).toHaveLength(4);expect(textBars({...base,text:'hi',textAlign:'right'})).toMatch(/^M90 /);expect(textBars({...base,text:'',textAlign:'left'})).toBe('');});
 it('drops only shadows too small to see, and never changes effects it cannot judge',()=>{const shadow=node('rectangle',{effects:[{...createEffect(),y:2,radius:8}]}),large=node('rectangle',{effects:[{...createEffect(),y:20,radius:80}]}),shader=node('rectangle',{effects:[{...createEffect('shader'),radius:0}]});expect(shownEffects(shadow,undefined)).toHaveLength(1);expect(shownEffects(shadow,1)).toHaveLength(1);expect(shownEffects(shadow,.15)).toHaveLength(0);expect(shownEffects(large,.15)).toHaveLength(1);expect(shownEffects(shader,.01)).toHaveLength(1);});
});
