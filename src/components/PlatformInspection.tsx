import {useLayoutEffect, useMemo, useRef, useState} from 'react';
import type {DesignNode} from '../model';
import {useEditor} from '../store';
import {captureColorContext, sameColorContext} from '../color-edit-context';
import {inspectPlatform, platformInspectionReport} from '../platform-inspection';
import type {InspectPlatform} from '../platform-inspection';

export default function PlatformInspection({node, source, isCurrent}: {node: DesignNode; source: string; isCurrent: () => boolean}) {
  const s = useEditor(), [platform, setPlatform] = useState<InspectPlatform>('ios'), [ratio, setRatio] = useState('1'), [query, setQuery] = useState(''), [message, setMessage] = useState(''), generation = useRef(0);
  const context = useMemo(() => ({origin: captureColorContext(s), valid: true}), [s, node, source]);
  useLayoutEffect(() => {
    context.valid = sameColorContext(context.origin, useEditor.getState());
    const off = useEditor.subscribe(live => {if (!sameColorContext(context.origin, live)) context.valid = false;});
    return () => {context.valid = false; off();};
  }, [context]);
  const result = useMemo(() => {
    try {if (!ratio.trim()) throw Error('Enter the canvas-unit ratio.'); return {value: inspectPlatform(node, platform, Number(ratio))};}
    catch (e) {return {error: (e as Error).message};}
  }, [node, platform, ratio]);
  const rows = result.value?.rows.filter(r => (r.name + ' ' + r.value + ' ' + (r.detail ?? '')).toLowerCase().includes(query.trim().toLowerCase())) ?? [], receipt = generation.current;
  const change = (fn: () => void) => {generation.current++; setMessage(''); fn();};
  const copy = async () => {
    let started = false;
    const current = () => context.valid && sameColorContext(context.origin, useEditor.getState()) && isCurrent() && receipt === generation.current;
    try {
      const live = useEditor.getState();
      if (!isCurrent() || receipt !== generation.current || !context.valid || !sameColorContext(context.origin, live) || live.mode !== 'inspect' || live.modal || live.home || live.uiHidden || !live.selection.includes(node.id) || !result.value)
        throw Error('The inspection source or options changed. Review the current layer and retry.');
      const text = platformInspectionReport(node.name, platform, Number(ratio), source, {...result.value, rows});
      started = true;
      await navigator.clipboard.writeText(text);
      if (current()) setMessage('Copied platform property reference.');
    } catch (e) {if (!started || current()) setMessage(e instanceof Error && e.message.startsWith('The inspection source') ? e.message : 'Clipboard unavailable. Select and copy the property text shown here.');}
  };
  return <section className="inspector-section" aria-label="Native platform properties" onKeyDown={e => {if (['Enter', ' '].includes(e.key) && (e.target as Element).closest('button')) e.stopPropagation();}}>
    <h3>Native platform properties</h3>
    <label>Platform<select aria-label="Inspection platform" value={platform} onChange={e => change(() => setPlatform(e.target.value as InspectPlatform))}><option value="ios">iOS · points</option><option value="android">Android · dp / sp</option></select></label>
    <label>Canvas units per {platform === 'ios' ? 'point' : 'dp'}<input aria-label="Canvas units per logical unit" type="number" min="0.01" max="1000" step="any" value={ratio} onChange={e => change(() => setRatio(e.target.value))}/></label>
    <p className="inspector-note">{source} Values are an explicit unit interpretation of this layer; no device density, native layout or installed font is inferred.</p>
    <label>Search platform properties<input aria-label="Search platform properties" type="search" maxLength={200} value={query} onChange={e => change(() => setQuery(e.target.value))}/></label>
    {result.error ? <p role="alert">{result.error}</p> : <>
      <button className="outline-button" onClick={() => void copy()}>Copy platform properties</button>
      <div aria-label="Platform property values">{rows.map(r => <div className="platform-property-row" key={r.name}><strong>{r.name}</strong><div><code>{r.value}</code></div>{r.detail && <p>{r.detail}</p>}</div>)}</div>
      {!rows.length && <p>No platform properties match this search.</p>}
      <ul className="inspect-warnings">{result.value!.warnings.map(w => <li key={w}>{w}</li>)}</ul>
    </>}
    {message && <p role="status">{message}</p>}
  </section>;
}
