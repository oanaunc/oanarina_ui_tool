import {useEffect,useMemo,useRef,useState} from 'react';
import type {DesignDocument} from '../model';
import {compareVersionDocuments} from '../version-review';
import type {VersionComparisonOptions} from '../version-review';
import DocumentCoverPreview from './DocumentCoverPreview';
import {versionPixelDiff} from '../version-pixel-diff';
import type {VersionPixelDiff} from '../version-pixel-diff';

/** Saved, current and difference share one viewport and one scroller, so switching views keeps the same place in the artwork. */
function PixelComparison({older,current,pageId}:{older:DesignDocument;current:DesignDocument;pageId:string}){const [state,setState]=useState<{diff?:VersionPixelDiff;busy?:boolean;error?:string}>({}),[show,setShow]=useState<'older'|'current'|'difference'>('difference'),[zoom,setZoom]=useState(1),job=useRef<AbortController|null>(null),urls=(d?:VersionPixelDiff)=>{if(d)for(const u of [d.older,d.current,d.difference])URL.revokeObjectURL(u);};useEffect(()=>()=>{job.current?.abort();},[]);useEffect(()=>()=>urls(state.diff),[state.diff]);const run=()=>{job.current?.abort();const control=new AbortController();job.current=control;setState({busy:true});versionPixelDiff(older,current,pageId,control.signal).then(diff=>{if(control.signal.aborted)urls(diff);else setState({diff});},e=>{if(!control.signal.aborted)setState({error:e instanceof Error?e.message:String(e)});});},d=state.diff;
 return <section aria-label="Pixel comparison"><button type="button" className="outline-button" disabled={state.busy} onClick={run}>{state.busy?'Comparing pixels…':d?'Compare pixels again':'Compare pixels'}</button>{state.error&&<p role="alert">{state.error}</p>}{d&&<><p role="status">{d.changed.toLocaleString()} of {d.total.toLocaleString()} pixels differ ({d.total?(d.changed/d.total*100).toFixed(2):'0'}%){d.scale<1?' at '+Math.round(d.scale*100)+'% scale':''}.</p><div className="button-row" role="group" aria-label="Pixel comparison view">{(['older','current','difference'] as const).map(v=><button type="button" key={v} aria-pressed={show===v} onClick={()=>setShow(v)}>{v==='older'?'Saved':v==='current'?'Current':'Difference'}</button>)}<label>Zoom<select aria-label="Pixel comparison zoom" value={zoom} onChange={e=>setZoom(Number(e.target.value))}>{[.5,1,2,4].map(v=><option key={v} value={v}>{v*100}%</option>)}</select></label></div><div tabIndex={0} aria-label="Compared artwork" style={{maxHeight:360,overflow:'auto',border:'1px solid var(--line, #8884)'}}><img alt={show==='older'?'Saved artwork':show==='current'?'Current artwork':'Changed pixels'} src={d[show]} width={d.width*zoom} height={d.height*zoom} style={{display:'block',imageRendering:zoom>1?'pixelated':undefined}}/></div></>}<p className="small-note">Both sides render through export with the fonts on this device, at one shared viewport. Anti-aliasing can count as a small difference.</p></section>;}

/** Local, read-only comparison. Filters retain labels only, never artwork values. */
export default function VersionChangeReview({older,current,pageId,heading='Saved version → current design'}:{older:DesignDocument;current:DesignDocument;pageId:string;heading?:string}){
 const [query,setQuery]=useState(''),[kind,setKind]=useState<NonNullable<VersionComparisonOptions['kind']>>('all'),[view,setView]=useState<VersionComparisonOptions>({limit:50});
 const report=useMemo(()=>{try{return {comparison:compareVersionDocuments(older,current,view)};}catch(e){return {error:e instanceof Error?e.message:String(e)};}},[older,current,view]);
 const page=current.pages.find(p=>p.id===pageId),preview=useMemo(()=>page?{...current,pages:[page],fileCover:undefined}:undefined,[current,page]);
 if(report.error)return <p role="alert">{report.error}</p>;
 const c=report.comparison!;
 return <section aria-label="Version change summary"><h4>{heading}</h4>
  <p>{c.added} layers added · {c.removed} removed · {c.changed} changed ({c.moved} moved between pages).</p>
  <p>{c.pagesAdded} pages added · {c.pagesRemoved} removed · {c.pagesChanged} with changed settings, names, comments or layer ordering.</p>
  <p>Document changes: {c.documentFields.length?c.documentFields.join(', '):'none'}.</p>
  <section aria-label="Current matching page preview"><h4>Current page with the same identity</h4>{preview?<><p>{page!.name}</p><div className="version-page-preview"><DocumentCoverPreview doc={preview}/></div></>:<p>This historical page no longer exists in the current design.</p>}<p className="small-note">These two previews fit independently. Use Compare pixels for one shared viewport.</p></section>{page&&<PixelComparison key={pageId} older={older} current={current} pageId={pageId}/>}
  <p className="small-note">Structural changes by saved identity; generated geometry counts. No per-edit author attribution. Values, image/font bytes and link URLs are not included in this summary or searched by its filters.</p>
  <form className="version-change-filters" aria-label="Filter version changes" onSubmit={e=>{e.preventDefault();setView({query,kind,offset:0,limit:50});}}>
   <label>Layer, page or changed field<input aria-label="Search version change labels" maxLength={200} value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <label>Change type<select aria-label="Version change type" value={kind} onChange={e=>setKind(e.target.value as typeof kind)}><option value="all">All changes</option><option value="added">Added layers</option><option value="removed">Removed layers</option><option value="changed">Changed layers</option></select></label>
   <button className="outline-button" type="submit">Apply change filter</button>
   <button className="outline-button" type="button" onClick={()=>{setQuery('');setKind('all');setView({limit:50});}}>Clear change filter</button>
  </form>
  <p role="status">{c.matchedRows?`Showing ${Math.min(c.rowOffset+1,c.matchedRows)}–${Math.min(c.rowOffset+c.rows.length,c.matchedRows)} of ${c.matchedRows} matching layer changes (${c.totalRows} total).`:`No matching layer changes (${c.totalRows} total).`}</p>
  <ul aria-label="Compared layer changes">{c.rows.map(r=><li key={r.id}><strong>{r.name}</strong> · {r.page} · {r.kind}{r.fields.length?' · '+r.fields.join(', '):''}</li>)}</ul>
  <div className="button-row"><button className="outline-button" disabled={c.rowOffset===0} onClick={()=>setView({...view,offset:Math.max(0,c.rowOffset-c.rowLimit)})}>Previous change page</button><button className="outline-button" disabled={c.rowOffset+c.rows.length>=c.matchedRows} onClick={()=>setView({...view,offset:c.rowOffset+c.rowLimit})}>Next change page</button></div>
  {!c.totalRows&&<p>No layer changes.</p>}
 </section>;
}
