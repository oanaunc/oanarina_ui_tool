import {it, expect} from 'vitest';
import {node} from '../src/model';
import {nodeBounds} from '../src/guides';
import {inspectSpacing, spacingDiagram, spacingNumber, spacingReport} from '../src/spacing-inspection';
const rows = (result: ReturnType<typeof inspectSpacing>) => Object.fromEntries(result.rows.map(r => [r.name, r.value]));
it('reports directional gaps, overlap and selected-minus-target edge/center offsets without mutation', () => {
  const nodes = [node('rectangle', {id: 'a', x: 10, y: 20, width: 100, height: 80}), node('rectangle', {id: 'b', x: 150, y: 40, width: 50, height: 40})], before = JSON.stringify(nodes), r = inspectSpacing(nodes, 'a', 'b');
  expect(rows(r)).toMatchObject({'Horizontal gap': 40, 'Vertical overlap': 40, 'Left-edge offset': -140, 'Right-edge offset': -90, 'Horizontal center offset': -115, 'Vertical center offset': 0});
  expect(r.contained).toBe(false); expect(JSON.stringify(nodes)).toBe(before);
  expect(rows(inspectSpacing(nodes, 'b', 'a'))).toMatchObject({'Horizontal gap': 40, 'Left-edge offset': 140});
});
it('contained layout boxes report four geometric insets and touching boxes retain zero gap', () => {
  const parent = node('frame', {id: 'p', x: 100, y: 200, width: 400, height: 300}), child = node('rectangle', {id: 'c', parentId: 'p', x: 130, y: 240, width: 80, height: 60});
  expect(rows(inspectSpacing([parent, child], 'c', 'p'))).toMatchObject({'Bounding-box left inset': 30, 'Bounding-box right inset': 290, 'Bounding-box top inset': 40, 'Bounding-box bottom inset': 200});
  const other = node('rectangle', {id: 'o', x: 210, y: 240, width: 20, height: 60});
  expect(rows(inspectSpacing([parent, child, other], 'c', 'o'))['Horizontal gap']).toBe(0);
});
it('nested signed affine boxes match the actual shared page-axis geometry with order-independent ancestors', () => {
  const parent = node('group', {id: 'p', x: 120, y: 100, width: 400, height: 250, rotation: 31, flipX: true, motionScaleX: 1.2, motionScaleY: .7}), child = node('rectangle', {id: 'c', parentId: 'p', x: 150, y: 140, width: 80, height: 60, rotation: -11}), other = node('ellipse', {id: 'o', x: 700, y: 200, width: 90, height: 90}), ns = [child, other, parent], r = inspectSpacing(ns, 'c', 'o');
  expect(r.selected).toEqual(nodeBounds(child, ns)); expect(r.target).toEqual(nodeBounds(other, ns));
  expect(spacingDiagram(r).every(b => [b.x, b.y, b.width, b.height].every(Number.isFinite))).toBe(true);
});
it('paint, effect, clipping and visibility changes never masquerade as painted-ink distances', () => {
  const a = node('rectangle', {id: 'a', x: 100, y: 100, width: 80, height: 60}), b = node('frame', {id: 'b', x: 50, y: 50, width: 300, height: 300});
  const before = inspectSpacing([a, b], 'a', 'b'); a.stroke = '#ff0000'; a.strokeWidth = 200; a.shadow = true; a.visible = false; b.clip = true;
  expect(inspectSpacing([a, b], 'a', 'b')).toEqual(before);
  expect(spacingReport('A', 'B', 'Base document', before)).toContain('exclude strokes, effects');
});
it('missing, duplicate, cyclic and over-budget comparisons refuse explicitly', () => {
  const a = node('rectangle', {id: 'a'}), b = node('rectangle', {id: 'b'});
  expect(() => inspectSpacing([a, b], 'a', 'a')).toThrow('different'); expect(() => inspectSpacing([a], 'a', 'missing')).toThrow('unavailable');
  expect(() => inspectSpacing([a, {...b, id: 'a'}], 'a', 'b')).toThrow('unique');
  expect(() => inspectSpacing([{...a, parentId: 'b'}, {...b, parentId: 'a'}], 'a', 'b')).toThrow('Cyclic');
  expect(() => inspectSpacing(Array.from({length: 20001}, (_, i) => node('rectangle', {id: String(i)})), '0', '1')).toThrow('20,000');
});
it('the absolute hierarchy bound is enforced regardless of node ordering and cumulative paths', () => {
  const chain = Array.from({length: 257}, (_, i) => node('group', {id: String(i), parentId: i ? String(i - 1) : null}));
  expect(() => inspectSpacing(chain, '256', '0')).toThrow('256 ancestor');
  expect(() => inspectSpacing([...chain].reverse(), '256', '0')).toThrow('256 ancestor');
  expect(inspectSpacing(chain.slice(0, 256), '255', '0').selected.width).toBeGreaterThan(0);
});
it('the pure layout helper handles empty identities and zero-size/collapsed boxes without chooser sentinel assumptions', () => {
  const a = node('rectangle', {id: '', width: 0, height: 0}), b = node('rectangle', {id: 'other', x: 200, width: 20, height: 20, motionScaleX: 0});
  expect(inspectSpacing([a, b], '', 'other').selected.width).toBe(0); expect(spacingDiagram(inspectSpacing([a, b], '', 'other'))).toHaveLength(2);
});
it('finite values do not become Infinity strings and unrepresentable extents refuse instead of inventing distances', () => {
  expect(spacingNumber(Number.MAX_VALUE)).toBe(String(Number.MAX_VALUE));
  expect(() => spacingNumber(Infinity)).toThrow('finite');
  const ns = [node('rectangle', {id: 'a', x: Number.MAX_VALUE, width: 100}), node('rectangle', {id: 'b', x: 0})];
  expect(() => inspectSpacing(ns, 'a', 'b')).toThrow('numeric precision');
});
it('reports and diagrams remain bounded and omit asset payloads/private IDs', () => {
  const ns = [node('image', {id: 'privateA', name: 'A', x: 0, y: 0, width: 100, image: 'data:image/png;base64,SECRET'}), node('text', {id: 'privateB', name: 'B', x: 200, text: 'PRIVATE BODY'})], r = inspectSpacing(ns, 'privateA', 'privateB'), text = spacingReport('a'.repeat(3000), 'B', 'Sampled Motion at 1.000 s.', r);
  expect(r.rows.length).toBeLessThanOrEqual(12); expect(text.length).toBeLessThan(2000); expect(text).not.toContain('SECRET'); expect(text).not.toContain('privateA'); expect(text).not.toContain('PRIVATE BODY');
});
