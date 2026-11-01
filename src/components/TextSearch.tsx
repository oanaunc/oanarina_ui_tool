import {formatNumber,t} from '../i18n';
import {useMemo,useRef,useState} from 'react';
import {useEditor} from '../store';
import {commands,matchesShortcut} from '../commands';
import {applyTextReplacements,findDocumentText,TEXT_SEARCH_LIMIT,validateTextReplacement} from '../text-search';
import type {TextMatch,TextReplacementPlan,TextSearchOptions} from '../text-search';
import './text-search.css';

export default function TextSearch(){
  const s=useEditor(),[origin]=useState(()=>({id:s.doc.id,pageId:s.pageId,ids:[...s.selection]}));
  const [query,setQuery]=useState(''),[replacement,setReplacement]=useState(''),[scope,setScope]=useState<TextSearchOptions['scope']>('page');
  const [caseSensitive,setCaseSensitive]=useState(false),[wholeWord,setWholeWord]=useState(false),[includeHidden,setIncludeHidden]=useState(true);
  const [index,setIndex]=useState(0),[error,setError]=useState(''),[message,setMessage]=useState('');const input=useRef<HTMLInputElement>(null);
  const stale=s.doc.id!==origin.id||!s.doc.pages.some(p=>p.id===origin.pageId);
  const report=useMemo(()=>stale?undefined:findDocumentText(s.doc,{query,scope,pageId:origin.pageId,selectionIds:origin.ids,caseSensitive,wholeWord,includeHidden}),[s.doc,query,scope,caseSensitive,wholeWord,includeHidden,origin,stale]);
  const matches=report?.matches??[],selected=matches[Math.min(index,Math.max(0,matches.length-1))],locked=matches.filter(m=>m.locked).length;
  const close=()=>{useEditor.getState().set({modal:null});requestAnimationFrame(()=>document.querySelector<SVGElement>('svg.canvas')?.focus());};
  const change=(update:()=>void)=>{update();setIndex(0);setError('');setMessage('');};
  const choose=(i:number)=>{setIndex(i);setError('');};
  const reveal=(m:TextMatch)=>{try{const current=useEditor.getState();if(current.doc!==s.doc||!report)throw Error('The document changed. Search again.');current.selectPage(m.pageId);useEditor.getState().set({selection:[m.nodeId],vectorEditId:null,vectorSelection:[]});if(!m.hidden&&current.doc.workspace!=='slides')useEditor.getState().findSelection();close();}catch(e){setError(e instanceof Error?e.message:'This match cannot be revealed.');}};
  const replace=(all:boolean)=>{try{
    const current=useEditor.getState();if(!report||current.doc!==s.doc)throw Error('The document changed. Search again.');if(current.motionOpen)throw Error('Close the motion timeline before replacing base text.');
    const chosen=all?report:{...report,matches:selected?[selected]:[],limited:false};let plan:TextReplacementPlan|undefined;
    current.edit(d=>{plan=applyTextReplacements(d,chosen,replacement);},d=>validateTextReplacement(d,plan!),{explicitTextRuns:chosen.matches.filter(m=>!m.locked&&!m.spot).map(m=>({pageId:m.pageId,nodeId:m.nodeId}))});
    setError('');setMessage(`${plan!.replaced} matches replaced; ${plan!.skipped} locked matches skipped.`);setIndex(0);
  }catch(e){setError(e instanceof Error?e.message:'The replacement failed.');}};
  const offset=Math.floor(Math.min(index,Math.max(0,matches.length-1))/100)*100,rows=matches.slice(offset,offset+100);
  return <div className="modal-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}><section className="dialog wide-dialog text-search-dialog" role="dialog" aria-modal="true" aria-label={t('Find and replace text')} onKeyDown={e=>{
    e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}if(matchesShortcut(e,commands.find(c=>c[0]==='text-find')![3])){e.preventDefault();input.current?.focus();input.current?.select();}
    if(e.key==='Tab'){const items=[...e.currentTarget.querySelectorAll<HTMLElement>('input,select,button:not(:disabled),textarea')];if(e.shiftKey&&document.activeElement===items[0]){e.preventDefault();items.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===items.at(-1)){e.preventDefault();items[0]?.focus();}}
  }}><header className="dialog-header"><h2>{t('Find and replace text')}</h2><button aria-label={t('Close text search')} onClick={close}>×</button></header><div className="dialog-body">
    <div className="text-search-fields"><label>{t('Find')}<input ref={input} autoFocus type="search" aria-label={t('Find text')} maxLength={512} value={query} onChange={e=>change(()=>setQuery(e.target.value))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();choose((index+(e.shiftKey?-1:1)+matches.length)%Math.max(1,matches.length));}}}/></label>
    <label>{t('Replace with')}<textarea aria-label={t('Replacement text')} maxLength={100000} value={replacement} onChange={e=>setReplacement(e.target.value)}/></label>
    <label>{t('Search in')}<select aria-label={t('Text search scope')} value={scope} onChange={e=>change(()=>setScope(e.target.value as TextSearchOptions['scope']))}><option value="page">{t('Page when search opened')}</option><option value="document">{t('Whole file')}</option><option value="selection" disabled={!origin.ids.length}>{t('Selected layer trees when search opened')}</option></select></label></div>
    <div className="text-search-options"><label><input type="checkbox" checked={caseSensitive} onChange={e=>change(()=>setCaseSensitive(e.target.checked))}/>{t('Match case')}</label><label><input type="checkbox" checked={wholeWord} onChange={e=>change(()=>setWholeWord(e.target.checked))}/>{t('Whole words')}</label><label><input type="checkbox" checked={includeHidden} onChange={e=>change(()=>setIncludeHidden(e.target.checked))}/>{t('Include hidden layers')}</label></div>
    <p className="inspector-note">{t('Searches literal base text. Locked results are read-only. Main-component edits can update linked instances. Page and selection scopes use the context where this search opened.')}</p>
    <p role="status" aria-live="polite">{stale?'The project changed. Close and reopen search.':!query?t('Enter text to find.'):report?.limited?`More than ${formatNumber(TEXT_SEARCH_LIMIT)} matches. Refine the search to replace all.`:`${matches.length} matches · ${matches.length-locked} editable · ${locked} locked`}</p>
    <div className="button-row"><button disabled={!matches.length} onClick={()=>choose((index+matches.length-1)%matches.length)}>{t('Previous match')}</button><button disabled={!matches.length} onClick={()=>choose((index+1)%matches.length)}>{t('Next match')}</button><button disabled={!selected||stale} onClick={()=>reveal(selected!)}>{t('Reveal selected layer')}</button></div>
    {selected&&<article className="text-search-preview" aria-label={t('Selected text match')}><p>{selected.pageName} / {selected.nodeName} · characters {selected.start}–{selected.end}{selected.locked?' · Locked':''}{selected.hidden?' · Hidden':''}</p><div>{selected.start>80?'…':''}{selected.sourceText.slice(Math.max(0,selected.start-80),selected.start)}<mark>{selected.sourceText.slice(selected.start,selected.end)}</mark>{selected.sourceText.slice(selected.end,selected.end+80)}{selected.sourceText.length>selected.end+80?'…':''}</div></article>}
    <div className="text-search-results" role="listbox" aria-label={t('Text matches')}>{rows.map((m,i)=><button key={JSON.stringify([m.pageId,m.nodeId,m.start])} role="option" aria-selected={m===selected} onClick={()=>choose(offset+i)} onDoubleClick={()=>reveal(m)} onKeyDown={e=>{if(['ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?matches.length-1:(offset+i+(e.key==='ArrowDown'?1:-1)+matches.length)%matches.length;choose(next);requestAnimationFrame(()=>document.querySelector<HTMLElement>(`[data-text-result="${next}"]`)?.focus());}}} data-text-result={offset+i}><span>{m.pageName} / {m.nodeName}</span><small>{m.start}–{m.end}{m.locked?' · Locked':''}{m.hidden?' · Hidden':''}</small></button>)}</div>
    {matches.length>100&&<div className="button-row"><button disabled={!offset} onClick={()=>choose(Math.max(0,offset-100))}>{t('Previous results')}</button><span>{offset+1}–{Math.min(offset+100,matches.length)} of {matches.length}</span><button disabled={offset+100>=matches.length} onClick={()=>choose(offset+100)}>{t('Next results')}</button></div>}
    {s.motionOpen&&<p>{t('Close the motion timeline to replace base text.')}</p>}{message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}
    <div className="button-row"><button disabled={!selected||selected.locked||stale||s.motionOpen} onClick={()=>replace(false)}>{t('Replace match')}</button><button disabled={!matches.length||locked===matches.length||report?.limited||stale||s.motionOpen} onClick={()=>replace(true)}>{t('Replace all editable matches')}</button><button onClick={close}>{t('Close search')}</button></div>
  </div></section></div>;
}
