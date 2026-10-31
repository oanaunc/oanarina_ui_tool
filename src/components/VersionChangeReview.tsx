import {useMemo,useState} from 'react';
import type {DesignDocument} from '../model';
import {compareVersionDocuments} from '../version-review';
import type {VersionComparisonOptions} from '../version-review';
import DocumentCoverPreview from './DocumentCoverPreview';

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
  <section aria-label="Current matching page preview"><h4>Current page with the same identity</h4>{preview?<><p>{page!.name}</p><div className="version-page-preview"><DocumentCoverPreview doc={preview}/></div></>:<p>This historical page no longer exists in the current design.</p>}<p className="small-note">Saved and current previews fit independently. Compare base artwork only; this is not a pixel diff or a synchronized viewport.</p></section>
  <p className="small-note">Structural changes by saved identity; generated geometry counts. No visual pixel diff or per-edit author attribution. Values, image/font bytes and link URLs are not included in this summary or searched by its filters.</p>
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
