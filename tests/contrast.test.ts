import {describe,it,expect} from 'vitest';
import {contrastRatio,contrastResults} from '../src/contrast';
describe('explicit sRGB contrast pairs',()=>{
 it('calculates symmetric black/white and identical-color reference ratios',()=>{expect(contrastRatio('#000000','#ffffff')).toBe(21);expect(contrastRatio('#ffffff','#000000')).toBe(21);expect(contrastRatio('#aabbcc','#aabbcc')).toBe(1);});
 it('uses linear relative luminance and does not round passing thresholds',()=>{expect(contrastRatio('#777777','#ffffff')).toBeCloseTo(4.478089453577214,12);expect(contrastResults(4.499999)).toEqual({normalAA:false,normalAAA:false,largeAA:true,largeAAA:false});expect(contrastResults(3)).toMatchObject({largeAA:true,normalAA:false});expect(contrastResults(7).normalAAA).toBe(true);});
 it('composites foreground alpha in sRGB over the explicit opaque background',()=>{expect(contrastRatio('#000000','#ffffff',.5)).toBeCloseTo(3.976653024912438,12);expect(contrastRatio('#123456','#abcdef',0)).toBe(1);expect(contrastRatio('#ffffff','#000000',.5)).toBeCloseTo(5.280822809644651,12);});
 it('rejects unsupported colors and opacity instead of silently guessing',()=>{for(const color of ['red','#fff','#000000ff','none'])expect(()=>contrastRatio(color,'#ffffff')).toThrow();for(const alpha of [-.1,1.1,NaN,Infinity])expect(()=>contrastRatio('#000000','#ffffff',alpha)).toThrow();});
});
