import {useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {DesignNode} from '../model';
import {useEditor} from '../store';
import {captureColorContext, sameColorContext} from '../color-edit-context';
import {inspectSpacing, spacingDiagram, spacingNumber, spacingReport} from '../spacing-inspection';
import type {SpacingBasis} from '../spacing-inspection';
import {t} from '../i18n';

export default function SpacingInspection({nodes, nodeId, source, isCurrent}: {nodes: DesignNode[]; nodeId: string; source: string; isCurrent: () => boolean}) {
  const s = useEditor(), selected = nodes.find(n => n.id === nodeId)!, initial = s.selection.find(id => id !== nodeId) ?? selected.parentId;
  const [targetId, setTargetId] = useState<string | null>(initial), [query, setQuery] = useState(''), [page, setPage] = useState(0), [message, setMessage] = useState(''), [basis, setBasis] = useState<SpacingBasis>('box'), [, refreshChoice] = useState(0), generation = useRef(0);
  const context = useMemo(() => ({origin: captureColorContext(s), valid: true}), [s, nodes, source, nodeId]);
  useLayoutEffect(() => {context.valid = sameColorContext(context.origin, useEditor.getState()); const off = useEditor.subscribe(live => {if (!sameColorContext(context.origin, live)) context.valid = false;}); return () => {context.valid = false; off();};}, [context]);
  const target = targetId === null ? undefined : nodes.find(n => n.id === targetId), matches = useMemo(() => nodes.filter(n => n.id !== nodeId && n.name.toLowerCase().includes(query.trim().toLowerCase())), [nodes, nodeId, query]);
  const offset = Math.min(page * 100, Math.max(0, Math.ceil(matches.length / 100) - 1) * 100), choices = matches.slice(offset, offset + 100), receipt = generation.current;
  const result = useMemo(() => {try {if (!target || target.id === nodeId) return {}; const value = inspectSpacing(nodes, nodeId, target.id, basis); return {value, diagram: spacingDiagram(value)};} catch (e) {return {error: (e as Error).message};}}, [nodes, nodeId, target, basis]);
  const change = (fn: () => void) => {const live=useEditor.getState();if(receipt!==generation.current||!context.valid||!sameColorContext(context.origin,live)||!isCurrent()||live.mode!=='inspect'||live.modal||live.home||live.uiHidden){setMessage('The spacing source or options changed. Review the current layers and retry.');return;}generation.current++;refreshChoice(v=>v+1);setMessage('');fn();};
  const copy = async () => {
    let started = false;
    const current = () => context.valid && sameColorContext(context.origin, useEditor.getState()) && isCurrent() && receipt === generation.current;
    try {
      const live = useEditor.getState();
      if (!current() || live.mode !== 'inspect' || live.modal || live.home || live.uiHidden || !live.selection.includes(nodeId) || !result.value || !target) throw Error('The spacing source or options changed. Review the current layers and retry.');
      const text = spacingReport(selected.name, target.name, source, result.value); started = true;
      await navigator.clipboard.writeText(text); if (current()) setMessage('Copied spacing reference.');
    } catch (e) {if (!started || current()) setMessage(e instanceof Error && e.message.startsWith('The spacing source') ? e.message : 'Clipboard unavailable. Select and copy the displayed spacing values.');}
  };
  // Index zero is a private chooser sentinel, so even a valid empty layer ID remains selectable.
  const optionNodes = target && !choices.some(n => n.id === target.id) ? [target, ...choices] : choices;
  return <section className="inspector-section spacing-inspection" aria-label="Spacing inspection" onKeyDown={e => {if (['Enter', ' '].includes(e.key) && (e.target as Element).closest('button')) e.stopPropagation();}}>
    <h3>Spacing inspection</h3><p className="inspector-note">{source} Compare two authored layout boxes in page axes. Rotated boxes use their page-axis enclosing rectangles.</p>
    <label>{t('Measure')}<select aria-label={t('Spacing measure')} value={basis} onChange={e => change(() => setBasis(e.target.value as SpacingBasis))}><option value="box">{t('Layout boxes')}</option><option value="painted">{t('Painted bounds')}</option><option value="parent">{t('Inside a rotated parent')}</option></select></label>
    <label>Find comparison layer<input type="search" aria-label="Search spacing layers" maxLength={200} value={query} onChange={e => change(() => {setQuery(e.target.value); setPage(0);})}/></label>
    <label>Compare with<select aria-label="Spacing comparison layer" value={target ? String(optionNodes.indexOf(target) + 1) : '0'} onChange={e => change(() => {const index = Number(e.target.value); setTargetId(index === 0 ? null : optionNodes[index - 1].id);})}><option value="0">Choose a layer</option>{optionNodes.map((n, i) => <option key={n.id} value={i + 1}>{n.name.slice(0, 500) || 'Unnamed layer'}</option>)}</select></label>
    <p className="inspector-note">{matches.length} matching layers. Showing {matches.length ? offset + 1 : 0}–{Math.min(matches.length, offset + 100)}; the current comparison stays available.</p>
    {matches.length > 100 && <div className="button-row"><button disabled={offset === 0} onClick={() => change(() => setPage(Math.max(0, page - 1)))}>Previous spacing targets</button><button disabled={offset + 100 >= matches.length} onClick={() => change(() => setPage(page + 1))}>Next spacing targets</button></div>}
    {result.error ? <p role="alert">{result.error}</p> : result.value && target ? <>
      <svg role="img" aria-label="Layout-box spacing diagram" viewBox="0 0 300 164" className="spacing-diagram"><title>Selected and comparison layout boxes</title>{result.diagram!.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.width} height={b.height} fill={i ? '#b49add22' : '#f0a5c122'} stroke={i ? '#b49add' : '#f0a5c1'} strokeWidth={1.5} strokeDasharray={i ? '4 3' : undefined}/>)}</svg>
      <p className="inspector-note">Solid: {selected.name.slice(0, 200)} · Dashed: {target.name.slice(0, 200)}</p>
      <button className="outline-button" onClick={() => void copy()}>Copy spacing reference</button>
      <dl>{result.value.rows.map(r => <div className="spacing-property-row" key={r.name}><dt>{r.name}</dt><dd>{spacingNumber(r.value)} px</dd></div>)}</dl>
      <p className="inspector-note">Offsets are selected minus target. Bounds exclude strokes, effects, text ink, path contours, clipping, masks and occlusion. Bounding-box insets describe these rectangles; use the Layout controls for authored padding.</p>
    </> : <p className="inspector-note">Choose another layer, select two layers, or inspect a child to compare with its parent.</p>}
    {message && <p role="status">{message}</p>}
  </section>;
}
