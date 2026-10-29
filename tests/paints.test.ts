import {describe,it,expect} from 'vitest';
import {blankDocument,node,parseDocument} from '../src/model';
import {createPaint,createStroke,fillsFor,sampleGradient,strokesFor} from '../src/paints';
import {colorString,parseColor} from '../src/colors';
describe('paint stacks and color conversion',()=>{
 it('keeps legacy project fills and strokes readable',()=>{const n=node('rectangle',{fill:'#ff0000',stroke:'#0000ff',gradient:true});expect(fillsFor(n)[0]).toMatchObject({type:'linear',color:'#ff0000'});expect(strokesFor(n)[0].paint.color).toBe('#0000ff');expect(fillsFor({...n,paints:[]})).toEqual([]);});
 it('interpolates color and alpha between arbitrary stops',()=>{const paint=createPaint('#ff0000','linear');paint.stops=[{id:'a',position:0,color:'#ff0000',opacity:1},{id:'b',position:1,color:'#0000ff',opacity:0}];expect(sampleGradient(paint.stops,.5)).toEqual([127.5,0,127.5,.5]);});
 it('round-trips multi-fill, multi-stroke and gradient metadata',()=>{const d=blankDocument(),n=node('rectangle',{paints:[createPaint('#abcdef','radial'),createPaint('#123456')],strokes:[{...createStroke(),width:4,align:'outside',dash:[8,4]}]});d.pages[0].nodes=[n];expect(parseDocument(JSON.stringify(d))).toEqual(d);});
 it('rejects malformed paint stacks and external image fills',()=>{const d=blankDocument(),paint=createPaint();paint.opacity=2;d.pages[0].nodes=[node('rectangle',{paints:[paint]})];expect(()=>parseDocument(JSON.stringify(d))).toThrow();paint.opacity=1;paint.image='https://example.com/image.png';expect(()=>parseDocument(JSON.stringify(d))).toThrow();});
 it('converts HEX, RGB, HSL and HSB values without dropping alpha',()=>{expect(parseColor('#abc8','HEX')).toEqual({color:'#aabbcc',alpha:136/255});expect(parseColor('255, 0, 128','RGB')?.color).toBe('#ff0080');expect(parseColor('120, 100%, 50%','HSL')?.color).toBe('#00ff00');expect(parseColor('240, 100%, 100%','HSB')?.color).toBe('#0000ff');expect(colorString('#ff0000','HSL')).toBe('0, 100%, 50%');expect(parseColor('bad input','RGB')).toBeNull();});
});
