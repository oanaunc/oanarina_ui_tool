import type {DesignNode} from './model';
import type {InspectRow} from './dev-inspection';
import {fillsFor, strokesFor} from './paints';
import {effectiveStrokeWidth} from './edge-strokes';
import {layoutPadding} from './layout-settings';
import {hasVariableWidth} from './variable-width';

export type InspectPlatform = 'ios' | 'android';
export interface PlatformInspection {rows: InspectRow[]; warnings: string[];}
const round = (n: number) => {
  if (!Number.isFinite(n)) throw Error('The converted property exceeds finite numeric range.');
  return String(Number(n.toFixed(4)));
};
const short = (s: string) => s.length > 500 ? s.slice(0, 500) + '…' : s;

/** Read-only unit interpretation; no renderer or native resource conversion. */
export function inspectPlatform(n: DesignNode, platform: InspectPlatform, unitsPerLogical = 1): PlatformInspection {
  if (!['ios', 'android'].includes(platform) || !Number.isFinite(unitsPerLogical) || unitsPerLogical < .01 || unitsPerLogical > 1000)
    throw Error('Choose iOS or Android and 0.01–1,000 canvas units per logical unit.');
  const rows: InspectRow[] = [], warnings = [
    'Property reference for one layer, without native layout or code generation. Page coordinates exclude parent transforms; physical screen pixels are not inferred.',
    platform === 'ios'
      ? 'Points are logical UIKit coordinates. The canvas-unit ratio is an explicit design assumption, separate from device screen scale and Dynamic Type.'
      : 'dp values describe logical layout. sp typography is a baseline at font scale 1; Android applies the user’s font-size preferences at runtime.',
  ];
  const unit = platform === 'ios' ? 'pt' : 'dp';
  const length = (value: number, text = false) => {
    if (!Number.isFinite(value)) throw Error('This layer contains a nonfinite inspection value.');
    return round(value / unitsPerLogical) + ' ' + (text && platform === 'android' ? 'sp' : unit);
  };
  const add = (name: string, value: string, detail?: string) => rows.push({name, value, ...(detail ? {detail} : {})});
  add('Width', length(n.width)); add('Height', length(n.height));
  add('Page X', length(n.x)); add('Page Y', length(n.y));
  add('Rotation', round(n.rotation) + '°');
  add('Layer opacity', round(n.opacity * 100) + '%');
  add('Visibility', n.visible ? 'Visible' : 'Hidden');
  if (n.radius || n.corners) add('Corner radii', (n.corners ?? [n.radius]).map(v => length(v)).join(' / '), 'Top-left, top-right, bottom-right, bottom-left when four values are present.');
  if (n.cornerSmoothing) warnings.push('Corner smoothing needs custom native path geometry; radius values alone do not recreate it.');
  if (n.flipX || n.flipY || n.motionScaleX !== undefined || n.motionScaleY !== undefined)
    add('Local scale', round((n.flipX ? -1 : 1) * (n.motionScaleX ?? 1)) + ' × ' + round((n.flipY ? -1 : 1) * (n.motionScaleY ?? 1)));
  const color = (value: string, alpha: number) => {
    if (!/^#[0-9a-f]{6}$/i.test(value) || !Number.isFinite(alpha) || alpha < 0 || alpha > 1) return null;
    const hex = value.slice(1).toUpperCase(), a = Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase();
    return platform === 'ios' ? '#' + hex + a : '#' + a + hex;
  };
  const fills = fillsFor(n).filter(p => p.visible && p.opacity > 0);
  if (fills.length === 1 && fills[0].type === 'solid') {
    const value = color(fills[0].color, fills[0].opacity);
    if (value) add(n.type === 'text' ? 'Text color' : 'Fill color', value, (platform === 'ios' ? 'RRGGBBAA' : 'AARRGGBB') + '; saved sRGB channels and paint alpha. Layer opacity remains separate.');
    else warnings.push('The solid fill color cannot be represented as a six-digit sRGB value.');
  } else if (fills.length) warnings.push('Multiple, image, gradient and procedural fills require native artwork resources; no single native color is inferred.');
  const strokes = strokesFor(n).filter(s => s.visible && s.paint.visible && effectiveStrokeWidth(s, n) > 0 && s.paint.opacity > 0);
  if (strokes.length === 1 && !hasVariableWidth(n) && !strokes[0].edgeWidths && strokes[0].paint.type === 'solid') {
    const stroke = strokes[0], value = color(stroke.paint.color, stroke.paint.opacity);
    if (value) add('Stroke color', value, platform === 'ios' ? 'RRGGBBAA' : 'AARRGGBB');
    add('Stroke width', length(stroke.width));
    add('Stroke geometry', stroke.align + ' · ' + stroke.cap + ' cap · ' + stroke.join + ' join');
    if (stroke.dash.length) add('Stroke dash', stroke.dash.map(v => length(v)).join(' / '));
    warnings.push('Native borders do not automatically recreate authored stroke alignment, caps, joins or dash geometry.');
  } else if (strokes.length) warnings.push('Multiple, variable-width, independent-edge and non-solid strokes need custom artwork; a single native border is not inferred.');
  if (n.type === 'text') {
    add('Font family', short(n.fontFamily), 'Saved family name only; confirm target-platform availability and licensing.');
    add('Font size', length(n.fontSize, true)); add('Font weight', String(n.fontWeight), 'Saved numeric weight; native family/face matching remains a developer decision.');
    add('Font style', n.fontStyle ?? 'normal');
    add('Line height', length(n.lineHeightPx ?? n.fontSize * n.lineHeight, true), 'Authored line-box target; native text metrics and shaping can differ.');
    add('Letter spacing', platform === 'android' && n.fontSize > 0 ? round(n.letterSpacing / n.fontSize) + ' em' : length(n.letterSpacing));
    add('Text alignment', n.textAlign); add('Text direction', n.textDirection ?? 'auto');
    if (n.textRuns?.length || n.paragraphStyles?.length || n.listStyle && n.listStyle !== 'none') warnings.push('Rich text ranges, lists and paragraph overrides are not represented by these base text properties.');
    if (n.textVerticalTrim || n.hangingQuotes || n.textWrap && n.textWrap !== 'normal') warnings.push('Text trim, hanging quotes and specialized wrapping need separate native typography implementation.');
  }
  if (n.layout !== 'none') {
    add('Authored layout', n.layout + (n.wrap ? ' · wrap' : ''));
    add('Padding', layoutPadding(n).map(v => length(v)).join(' / '), 'Top / right / bottom / left.');
    add('Column gap', length(n.gapX ?? n.gap)); add('Row gap', length(n.gapY ?? n.gap));
    warnings.push('Auto layout values describe saved design intent; native stacks, constraints and grids must be implemented separately.');
  }
  if (n.effects?.length || n.shadow || n.blur || n.mask || n.booleanOp || n.clip || n.media || ['path', 'ellipse', 'polygon', 'star', 'line', 'arrow'].includes(n.type))
    warnings.push('Effects, clipping, vector geometry, masks, Boolean results and media playback require separate native resources or rendering.');
  if (n.blendMode && n.blendMode !== 'normal') warnings.push('Authored blend mode is not a native color property.');
  return {rows, warnings};
}

export function platformInspectionReport(name: string, platform: InspectPlatform, ratio: number, source: string, result: PlatformInspection) {
  return `${platform === 'ios' ? 'iOS' : 'Android'} property reference · ${short(name)}\n${source}\nCanvas units per ${platform === 'ios' ? 'point' : 'dp'}: ${ratio}\n\n`
    + result.rows.map(r => `${r.name}: ${r.value}${r.detail ? '\n  ' + r.detail : ''}`).join('\n')
    + '\n\nReview limits:\n' + result.warnings.map(w => '• ' + w).join('\n');
}
