import {useEffect,useLayoutEffect,useMemo,useRef,useState,useSyncExternalStore} from 'react';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {fontActionAllowed} from '../font-action-context';
import {fontDownloadQueue,loadFont,refreshFontCatalog,removeDownloadedFontCache} from '../fonts';
import type {FontFamily} from '../font-downloads';
import {inspectFontCache} from '../font-cache';
import type {FontCacheRow} from '../font-cache';
import {useEditor} from '../store';
import './font-cache-manager.css';
function bytes(n:number){return n<1024?`${n} B`:n<1024*1024?`${(n/1024).toFixed(1)} KB`:`${(n/1024/1024).toFixed(1)} MB`;}
export default function FontCacheManager({onCatalogLoaded,onLoaded}:{onCatalogLoaded:(fonts:FontFamily[])=>void;onLoaded:()=>void}){
 const s=useEditor(),queue=useSyncExternalStore(fontDownloadQueue.subscribe,fontDownloadQueue.getSnapshot),[rows,setRows]=useState<FontCacheRow[]>([]),[unknown,setUnknown]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(''),[query,setQuery]=useState(''),[limit,setLimit]=useState(30),alive=useRef(false),request=useRef(0);
 const origin=useMemo(()=>({snapshot:captureColorContext(s),valid:true}),[s.doc,s.pageId,s.selection,s.mode,s.home,s.uiHidden,s.modal,s.motionOpen,s.motionTime]);
 useLayoutEffect(()=>{alive.current=true;if(sameColorContext(origin.snapshot,useEditor.getState())&&fontActionAllowed())origin.valid=true;const stop=useEditor.subscribe(()=>{if(!sameColorContext(origin.snapshot,useEditor.getState())||!fontActionAllowed())origin.valid=false;});return()=>{origin.valid=false;alive.current=false;stop();};},[origin]);
 const guard=()=>{if(!alive.current||!origin.valid||!sameColorContext(origin.snapshot,useEditor.getState())||!fontActionAllowed())throw Error('The font action context changed. Review the current document and retry.');};
 const inspect=async()=>{const ticket=++request.current;try{const result=await inspectFontCache();if(alive.current&&ticket===request.current){setRows(result.rows);setUnknown(result.unrecognized);}}catch(e){if(alive.current&&ticket===request.current)setError(e instanceof Error?e.message:String(e));}};
 useEffect(()=>{void inspect();},[]);
 const run=async(key:string,fn:()=>Promise<void>)=>{try{guard();setBusy(key);setError('');await fn();}catch(e){if(alive.current)setError(e instanceof Error?e.message:String(e));}finally{if(alive.current)setBusy('');}};
 const visible=rows.filter(r=>r.family.toLowerCase().includes(query.toLowerCase())),active=queue.filter(e=>e.state==='active'||e.state==='queued');
 return <details className="font-cache-manager" aria-label="Font downloads and cache"><summary>Downloads and device cache · {active.length} pending</summary>
 <p className="small-note">At most 3 families download at once; up to 64 wait in the queue. Cancel stops queued, network and decoding work before publication. Once faces are being published, the operation finishes. Already loaded fonts and saved projects stay usable when downloaded cache files are removed.</p>
 <div className="button-row"><button className="outline-button" disabled={!!busy} onClick={()=>void run('catalog',async()=>{const fonts=await refreshFontCatalog();guard();onCatalogLoaded(fonts);})}>{busy==='catalog'?'Reloading snapshot…':'Reload installed catalog snapshot'}</button><button className="outline-button" disabled={!!busy} onClick={()=>void run('inspect',inspect)}>Inspect device font cache</button></div>
 <p className="small-note">Reload reads this installation’s catalog file. It does not update the snapshot from Google or download families.</p>
 {error&&<p role="alert">{error}</p>}
 <ul aria-label="Font download queue">{queue.slice().reverse().map(e=><li key={e.id} data-font-queue-family={e.family} data-font-queue-state={e.state}><span><strong>{e.family}</strong> · {e.state}{e.state==='active'&&e.cancelable===false?' · publishing':''}</span>{e.message&&<p>{e.message}</p>}{['active','queued'].includes(e.state)?<button className="text-button" disabled={e.cancelable===false} onClick={()=>{try{guard();fontDownloadQueue.cancel(e.family);}catch(error){setError(String(error));}}}>Cancel download {e.family}</button>:['failed','canceled'].includes(e.state)&&<button className="text-button" onClick={()=>void run(e.family,async()=>{await loadFont(e.family);guard();onLoaded();await inspect();})}>Retry download {e.family}</button>}</li>)}</ul>
 <label>Cached family filter <input aria-label="Filter cached font families" value={query} onChange={e=>{setQuery(e.target.value);setLimit(30);}}/></label>
 <p>{rows.length} cached families · {rows.reduce((n,r)=>n+r.files,0)} files · {bytes(rows.reduce((n,r)=>n+r.bytes,0))} font bytes</p>
 <p className="small-note">Only downloaded Google/open-source bundled faces can be removed here. Imported, restricted, unknown-provenance and unrecognized cache records are preserved. Counts describe decoded font bytes, excluding database overhead.</p>
 {unknown>0&&<p className="small-note">{unknown} unrecognized cache records preserved.</p>}
 <ul aria-label="Cached font families">{visible.slice(0,limit).map(row=><li key={row.family} data-cached-font-family={row.family}><strong>{row.family}</strong><span>{row.files} files · {bytes(row.bytes)} · {row.protectedFiles} protected</span><button className="text-button" disabled={!!busy||!row.downloadedFiles||fontDownloadQueue.has(row.family)} onClick={()=>void run(row.family,async()=>{await removeDownloadedFontCache(row.family,guard);await inspect();})}>Remove {row.downloadedFiles} downloaded files for {row.family} ({bytes(row.downloadedBytes)})</button></li>)}</ul>
 {limit<visible.length&&<button className="text-button" onClick={()=>setLimit(n=>n+30)}>Show 30 more cached families</button>}
 {!rows.length&&<p className="small-note">No recognized persistent font cache entries. Font faces may still be loaded in this session.</p>}
 </details>;
}
