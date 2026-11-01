import {describe,expect,it} from 'vitest';
import {colorString,parseColor} from '../src/colors';
import {outsideSrgb,p3ToSrgbHex,srgbToP3Hex} from '../src/color-profile';
import {CSS_COLOR_NAMES} from '../src/css-color-names';
import {defaultPreferences,validatePreferences} from '../src/preferences';
describe('CSS color names',()=>{
 it('has all 148 names and matches well-known values',()=>{expect(CSS_COLOR_NAMES.size).toBe(148);expect(parseColor('rebeccapurple','HEX')).toEqual({color:'#663399'});expect(parseColor('Tomato','RGB')?.color).toBe('#ff6347');expect(parseColor(' RED ','HSL')?.color).toBe('#ff0000');for(const hex of CSS_COLOR_NAMES.values())expect(hex).toMatch(/^#[0-9a-f]{6}$/);});
 it('reads transparent as black at no opacity',()=>{expect(parseColor('transparent','HEX')).toEqual({color:'#000000',alpha:0});});
 it('rejects words that are not colors',()=>{expect(parseColor('notacolor','HEX')).toBeNull();expect(parseColor('redd','HEX')).toBeNull();});
 it('keeps sRGB meaning in a Display P3 file',()=>{expect(parseColor('red','HEX','display-p3')?.color).toBe(srgbToP3Hex('#ff0000'));});
});
describe('color functions and bare hex',()=>{
 it('reads rgb and hsl forms in any format, with percentages and alpha',()=>{expect(parseColor('rgb(255 0 128)','HEX')?.color).toBe('#ff0080');expect(parseColor('rgba(255,0,128,.5)','HSL')).toEqual({color:'#ff0080',alpha:.5});expect(parseColor('rgb(100% 0% 50% / 25%)','HEX')).toEqual({color:'#ff0080',alpha:.25});expect(parseColor('hsl(120 100% 50%)','HEX')?.color).toBe('#00ff00');expect(parseColor('hsv(240, 100%, 100%)','RGB')?.color).toBe('#0000ff');expect(parseColor('hsl(.5turn 100% 50%)','HEX')?.color).toBe('#00ffff');});
 it('takes hex without the hash in the color row',()=>{expect(parseColor('ff8800','HEX')?.color).toBe('#ff8800');expect(parseColor('abc','HEX')?.color).toBe('#aabbcc');});
 it('keeps plain channels working',()=>{expect(parseColor('255, 0, 128','RGB')?.color).toBe('#ff0080');expect(parseColor('240, 100%, 50%','HSL')?.color).toBe('#0000ff');expect(parseColor('nonsense(1 2 3)','HEX')).toBeNull();});
});
describe('OKLCH',()=>{
 it('reads reference values',()=>{expect(parseColor('oklch(0.628 0.2577 29.23)','HEX')?.color).toBe('#ff0000');expect(parseColor('oklch(1 0 0)','HEX')?.color).toBe('#ffffff');expect(parseColor('oklch(0 0 0)','HEX')?.color).toBe('#000000');expect(parseColor('oklch(0.51975 0.17686 142.495)','HEX')?.color).toBe('#008000');});
 it('takes percent lightness, percent chroma, angle units, none and alpha',()=>{expect(parseColor('oklch(62.8% 0.2577 29.23)','HEX')?.color).toBe('#ff0000');expect(parseColor('oklch(62.8% 64.4% 29.23deg)','HEX')?.color).toBe('#ff0000');expect(parseColor('oklch(62.8% 0.2577 0.0812turn)','HEX')?.color).toBe('#ff0000');expect(parseColor('oklch(1 none none)','HEX')?.color).toBe('#ffffff');expect(parseColor('oklch(0.7 0.1 200 / 40%)','HEX')?.alpha).toBeCloseTo(.4);});
 it('reads oklab',()=>{expect(parseColor('oklab(0.628 0.2249 0.1258)','HEX')?.color).toBe('#ff0000');});
 it('takes plain channels in OKLCH format',()=>{expect(parseColor('0.628, 0.2577, 29.23','OKLCH')?.color).toBe('#ff0000');expect(parseColor('62.8 0.2577 29.23','OKLCH')?.color).toBe('#ff0000');expect(parseColor('#ff0000','OKLCH')?.color).toBe('#ff0000');});
 it('writes channels and round trips',()=>{expect(colorString('#ff0000','OKLCH')).toBe('0.628, 0.258, 29.2');expect(colorString('#808080','OKLCH')).toBe('0.6, 0, 0');for(const hex of ['#3366cc','#10b981','#f59e0b','#7c3aed','#111827','#fef3c7']){const back=parseColor(colorString(hex,'OKLCH'),'OKLCH')!.color,gap=[1,3,5].map(i=>Math.abs(parseInt(hex.slice(i,i+2),16)-parseInt(back.slice(i,i+2),16)));expect(Math.max(...gap)).toBeLessThanOrEqual(4);}});
 it('holds hue and lightness when a color leaves sRGB',()=>{const out=parseColor('oklch(0.7 0.4 150)','HEX')!.color,seen=colorString(out,'OKLCH').split(', ').map(Number);expect(seen[0]).toBeCloseTo(.7,1);expect(seen[2]).toBeGreaterThan(145);expect(seen[2]).toBeLessThan(155);expect(seen[1]).toBeLessThan(.3);});
 it('uses the wider gamut of a Display P3 file',()=>{const wide=parseColor('oklch(0.7 0.3 150)','HEX','display-p3')!.color;expect(outsideSrgb(wide)).toBe(true);const seen=colorString(wide,'OKLCH','display-p3').split(', ').map(Number);expect(seen[0]).toBeCloseTo(.7,1);expect(p3ToSrgbHex(parseColor('oklch(0.628 0.2577 29.23)','HEX','display-p3')!.color)).toBe('#ff0000');});
 it('can be the saved picker format',()=>{expect(validatePreferences({...defaultPreferences,colorPickerFormat:'OKLCH'}).colorPickerFormat).toBe('OKLCH');expect(()=>validatePreferences({...defaultPreferences,colorPickerFormat:'LAB'})).toThrow('OKLCH');});
});
