import type {DesignNode} from './model';
import type {Rect} from './guides';
import {descendants, effectiveVisible} from './model';
import {identity, inverseMatrix, multiply, nodeMatrix, point, visualBounds, worldMatrix} from './transforms';
import type {Matrix} from './transforms';

export interface SpacingRow {name: string; value: number;}
export interface SpacingInspection {selected: Rect; target: Rect; rows: SpacingRow[]; contained: boolean; basis?: SpacingBasis;}
export type SpacingBasis = 'box' | 'painted' | 'parent';
const finite = (values: number[]) => {if (values.some(n => !Number.isFinite(n))) throw Error('Spacing geometry exceeds finite numeric range.');};

/** Page-axis authored layout boxes, deliberately excluding painted/visible ink bounds. */
export function inspectSpacing(nodes: DesignNode[], selectedId: string, targetId: string, basis: SpacingBasis = 'box'): SpacingInspection {
  if (basis === 'painted') return {...compareRects(paintedRect(nodes, selectedId), paintedRect(nodes, targetId)), basis};
  if (basis === 'parent') return {...localParentSpacing(nodes, selectedId, targetId), basis};
  if (nodes.length > 20000) throw Error('Spacing inspection supports up to 20,000 page layers.');
  const byId = new Map<string, DesignNode>();
  for (const n of nodes) {if (byId.has(n.id)) throw Error('Spacing inspection requires unique page layer identities.'); byId.set(n.id, n);}
  if (selectedId === targetId) throw Error('Choose two different layers for spacing inspection.');
  const box = (id: string): Rect => {
    const source = byId.get(id); if (!source) throw Error('A spacing comparison layer is unavailable.');
    const chain: DesignNode[] = [], seen = new Set<string>(); let current: DesignNode | undefined = source;
    while (current) {
      if (seen.has(current.id)) throw Error('Cyclic spacing hierarchy.');
      if (chain.length >= 256) throw Error('Spacing inspection supports up to 256 ancestor levels.');
      seen.add(current.id); chain.push(current);
      const parent = byId.get(current.parentId as string);
      if (current.parentId && !parent) throw Error('A spacing ancestor is unavailable.');
      current = parent;
    }
    chain.reverse(); let matrix: Matrix = identity;
    for (let i = 0; i < chain.length; i++) {matrix = multiply(matrix, nodeMatrix(chain[i], chain[i - 1])); finite(matrix);}
    const corners = [[0, 0], [source.width, 0], [source.width, source.height], [0, source.height]].map(([x, y]) => point(matrix, x, y));
    finite(corners.flatMap(p => [p.x, p.y]));
    const x = Math.min(...corners.map(p => p.x)), y = Math.min(...corners.map(p => p.y));
    const width = Math.max(...corners.map(p => p.x)) - x, height = Math.max(...corners.map(p => p.y)) - y;
    finite([x, y, width, height]);
    const expectedWidth = Math.abs(matrix[0]) * source.width + Math.abs(matrix[2]) * source.height, expectedHeight = Math.abs(matrix[1]) * source.width + Math.abs(matrix[3]) * source.height;
    finite([expectedWidth, expectedHeight]);
    if (Math.abs(expectedWidth - width) > Math.max(1e-7, expectedWidth * 1e-7) || Math.abs(expectedHeight - height) > Math.max(1e-7, expectedHeight * 1e-7)) throw Error('Spacing layout-box extents exceed numeric precision at this position.');
    return {x, y, width, height};
  };
  return compareRects(box(selectedId), box(targetId));
}
function compareRects(selected: Rect, target: Rect): SpacingInspection {
  const a = selected, b = target, rows: SpacingRow[] = [];
  const add = (name: string, value: number) => {finite([value]); rows.push({name, value});};
  const axis = (name: string, a0: number, a1: number, b0: number, b1: number) => {
    const overlap = Math.min(a1, b1) - Math.max(a0, b0);
    add(name + (overlap > 0 ? ' overlap' : ' gap'), overlap > 0 ? overlap : Math.max(a0, b0) - Math.min(a1, b1));
  };
  const ar = a.x + a.width, ab = a.y + a.height, br = b.x + b.width, bb = b.y + b.height;
  finite([ar, ab, br, bb]);
  axis('Horizontal', a.x, ar, b.x, br); axis('Vertical', a.y, ab, b.y, bb);
  add('Left-edge offset', a.x - b.x); add('Top-edge offset', a.y - b.y);
  add('Right-edge offset', ar - br); add('Bottom-edge offset', ab - bb);
  add('Horizontal center offset', (a.x + a.width / 2) - (b.x + b.width / 2));
  add('Vertical center offset', (a.y + a.height / 2) - (b.y + b.height / 2));
  const contained = a.x >= b.x && a.y >= b.y && ar <= br && ab <= bb;
  if (contained) {add('Bounding-box left inset', a.x - b.x); add('Bounding-box right inset', br - ar); add('Bounding-box top inset', a.y - b.y); add('Bounding-box bottom inset', bb - ab);}
  return {selected, target, rows, contained};
}

export function spacingDiagram(result: SpacingInspection) {
  const boxes = [result.selected, result.target], x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y)), width = Math.max(...boxes.map(b => b.x + b.width)) - x, height = Math.max(...boxes.map(b => b.y + b.height)) - y;
  finite([x, y, width, height]); const scale = Math.min(276 / Math.max(1, width), 140 / Math.max(1, height));
  return boxes.map(b => ({x: 12 + (b.x - x) * scale, y: 12 + (b.y - y) * scale, width: b.width * scale, height: b.height * scale}));
}
export const spacingNumber = (value: number) => {finite([value]); return String(Number(value.toFixed(4)));};
export function spacingReport(selected: string, target: string, source: string, result: SpacingInspection) {
  const short = (s: string) => s.length > 500 ? s.slice(0, 500) + '…' : s;
  const basis = result.basis ?? 'box';
  return `Spacing reference · ${short(selected)} → ${short(target)}\n${source}\n${basis === 'painted' ? 'Page-axis painted bounds' : basis === 'parent' ? 'Layout boxes in the comparison layer\'s own axes' : 'Page-axis authored layout boxes'}, in canvas px.\n\n`
    + result.rows.map(r => r.name + ': ' + spacingNumber(r.value) + ' px').join('\n')
    + '\n\nOffsets are selected minus target. ' + (basis === 'painted' ? 'Bounds include strokes, effects and text overhang, and follow clipping parents, but not vector contours, masks or occlusion.' : 'Bounds include ancestor affine transforms, but exclude strokes, effects, text ink, vector contours, clipping, masks and occlusion.') + ' Bounding-box insets are not auto-layout padding or shortest geometric distances.';
}

/** Painted extent of a layer and its contents, in page axes. Hidden layers have none. */
function paintedRect(nodes: DesignNode[], id: string): Rect {
  const n = nodes.find(v => v.id === id); if (!n) throw Error('A spacing comparison layer is unavailable.');
  if (!effectiveVisible(n, nodes)) throw Error('Hidden layers have no painted bounds. Measure layout boxes instead.');
  const owned = new Set(descendants(nodes, [id])), bounds = visualBounds(nodes.filter(v => owned.has(v.id))); finite([bounds.x, bounds.y, bounds.width, bounds.height]); return bounds;
}
/** Padding as a rotated parent's developers see it: the child's box measured along the parent's own axes. */
function localParentSpacing(nodes: DesignNode[], selectedId: string, targetId: string): SpacingInspection {
  const byId = new Map(nodes.map(n => [n.id, n])), child = byId.get(selectedId), parent = byId.get(targetId); if (!child || !parent) throw Error('A spacing comparison layer is unavailable.');
  let current = child.parentId, depth = 0; while (current && current !== targetId && depth++ < 256) current = byId.get(current)?.parentId ?? null; if (current !== targetId) throw Error('Choose a parent layer to measure local padding.');
  const inverse = inverseMatrix(worldMatrix(parent, nodes)), m = multiply(inverse, worldMatrix(child, nodes)), corners = [[0, 0], [child.width, 0], [child.width, child.height], [0, child.height]].map(([x, y]) => point(m, x, y)); finite(corners.flatMap(p => [p.x, p.y]));
  const x = Math.min(...corners.map(p => p.x)), y = Math.min(...corners.map(p => p.y)), width = Math.max(...corners.map(p => p.x)) - x, height = Math.max(...corners.map(p => p.y)) - y;
  return compareRects({x, y, width, height}, {x: 0, y: 0, width: parent.width, height: parent.height});
}
