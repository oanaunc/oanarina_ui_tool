import {it, expect} from 'vitest';
import {node} from '../src/model';
import {createPaint, createStroke} from '../src/paints';
import {inspectPlatform, platformInspectionReport} from '../src/platform-inspection';
const values = (result: ReturnType<typeof inspectPlatform>) => Object.fromEntries(result.rows.map(r => [r.name, r.value]));
it('explicit ratios convert saved geometry into logical points/dp without mutating artwork', () => {
  const n = node('rectangle', {width: 300, height: 120, x: -12, y: 51, rotation: 20, opacity: .6, corners: [3, 6, 9, 12]}), before = JSON.stringify(n);
  expect(values(inspectPlatform(n, 'ios', 3))).toMatchObject({Width: '100 pt', Height: '40 pt', 'Page X': '-4 pt', 'Page Y': '17 pt', Rotation: '20°', 'Layer opacity': '60%', 'Corner radii': '1 pt / 2 pt / 3 pt / 4 pt'});
  expect(values(inspectPlatform(n, 'android', 3)).Width).toBe('100 dp');
  expect(JSON.stringify(n)).toBe(before);
});
it('native color references use RGBA versus ARGB and keep layer alpha separate', () => {
  const n = node('rectangle', {opacity: .25, paints: [{...createPaint('#123456'), opacity: .5}], strokes: [{...createStroke('#abcdef'), width: 4}]});
  expect(values(inspectPlatform(n, 'ios'))).toMatchObject({'Fill color': '#12345680', 'Stroke color': '#ABCDEFFF', 'Stroke width': '4 pt', 'Layer opacity': '25%'});
  expect(values(inspectPlatform(n, 'android'))).toMatchObject({'Fill color': '#80123456', 'Stroke color': '#FFABCDEF', 'Stroke width': '4 dp'});
});
it('text properties use points or baseline sp, Android letter spacing em and explicit line-height targets', () => {
  const n = node('text', {fontFamily: 'Custom Licensed Face', fontSize: 24, lineHeight: 1.5, letterSpacing: 1.2, fontWeight: 650, textDirection: 'rtl'});
  expect(values(inspectPlatform(n, 'ios', 2))).toMatchObject({'Font size': '12 pt', 'Line height': '18 pt', 'Letter spacing': '0.6 pt', 'Font weight': '650', 'Text direction': 'rtl'});
  expect(values(inspectPlatform(n, 'android', 2))).toMatchObject({'Font size': '12 sp', 'Line height': '18 sp', 'Letter spacing': '0.05 em'});
  n.lineHeightPx = 50;
  expect(values(inspectPlatform(n, 'android', 2))['Line height']).toBe('25 sp');
});
it('complex paints and stroke geometry are disclosed without false single native colors', () => {
  const n = node('rectangle', {paints: [createPaint('#123456', 'linear')], strokes: [createStroke('#112233'), createStroke('#445566')], cornerSmoothing: .5, clip: true});
  const r = inspectPlatform(n, 'android');
  expect(values(r)['Fill color']).toBeUndefined(); expect(values(r)['Stroke width']).toBeUndefined();
  expect(r.warnings.join('\n')).toContain('Multiple, image, gradient');
  expect(r.warnings.join('\n')).toContain('independent-edge');
  expect(r.warnings.join('\n')).toContain('Corner smoothing');
  expect(r.warnings.join('\n')).toContain('clipping');
});
it('layout, signed local transforms and rich typography provide bounded intent with limits', () => {
  const n = node('text', {layout: 'horizontal', padding: 8, gapX: -4, gapY: 12, flipX: true, motionScaleY: 2, paragraphStyles: [{start: 0, textAlign: 'right'}], fontFamily: 'a'.repeat(2000)});
  const r = inspectPlatform(n, 'android', 2);
  expect(values(r)).toMatchObject({'Local scale': '-1 × 2', 'Padding': '4 dp / 4 dp / 4 dp / 4 dp', 'Column gap': '-2 dp', 'Row gap': '6 dp'});
  expect(values(r)['Font family'].length).toBe(501); expect(r.rows.length).toBeLessThan(40);
  expect(r.warnings.join('\n')).toContain('Rich text'); expect(r.warnings.join('\n')).toContain('native stacks');
});
it('unsupported units and invalid conversion ratios refuse before a report is produced', () => {
  for (const ratio of [0, NaN, Infinity, -.5, .001, 1001]) expect(() => inspectPlatform(node('rectangle'), 'ios', ratio)).toThrow('logical unit');
  expect(() => inspectPlatform(node('rectangle'), 'web' as 'ios')).toThrow();
  expect(() => inspectPlatform(node('rectangle', {width: Infinity}), 'ios')).toThrow('nonfinite');
});
it('copied reference includes conversion and limitations without asset payloads or literal text', () => {
  const n = node('text', {name: 'Welcome', text: 'PRIVATE TEXT BODY', image: 'data:image/png;base64,PRIVATEASSET'}), result = inspectPlatform(n, 'android', 2);
  const report = platformInspectionReport(n.name, 'android', 2, 'Sampled Motion at 1.000 s.', result);
  expect(report).toContain('Canvas units per dp: 2'); expect(report).toContain('Sampled Motion'); expect(report).toContain('Review limits:');
  expect(report).not.toContain('PRIVATE'); expect(report).not.toContain('data:');
});

it('positive independent edges with zero scalar width remain an explicit unsupported native border', () => {
  const n = node('rectangle', {strokes: [{...createStroke('#123456'), width: 0, edgeWidths: [2, 0, 0, 0]}]});
  const r = inspectPlatform(n, 'android');
  expect(r.rows.some(row => row.name === 'Stroke width')).toBe(false);
  expect(r.warnings.join(' ')).toContain('independent-edge');
});

it('extreme finite page coordinates do not overflow during display rounding and conversion overflow refuses', () => {
 const n=node('rectangle',{x:Number.MAX_VALUE,y:-Number.MAX_VALUE});
 const rows=values(inspectPlatform(n,'ios',1));
 expect(rows['Page X']).toBe(String(Number.MAX_VALUE)+' pt');
 expect(rows['Page Y']).toBe(String(-Number.MAX_VALUE)+' pt');
 expect(()=>inspectPlatform(n,'ios',.01)).toThrow('finite numeric range');
});
