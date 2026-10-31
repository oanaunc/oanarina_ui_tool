import {useEffect,useId,useMemo,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import {X} from 'lucide-react';
import {useEditor} from '../store';
import {clearEditHistories,listSnapshotHeaders,measureLocalStorage,rawStoredDocument,readSnapshot} from '../repository';
import type {StorageBreakdown} from '../repository';
import {formatBytes,refreshStorageHealth,requestDurableStorage,useStorageHealth} from '../storage-health';
import {openRecoveredCopy,reportDamagedDocument,useDamagedDocument} from '../document-recovery';
import {repairDocument,repairSummary} from '../document-repair';
import type {RepairReport} from '../document-repair';
import type {SnapshotHeader} from '../version-review';
import {download} from '../files';
import {inspectFontCache} from '../font-cache';
import type {FontCacheRow} from '../font-cache';
import {removeDownloadedFontCache} from '../fonts';
import './storage-recovery.css';

function Shell({eyebrow,title,children}:{eyebrow:string;title:string;children:ReactNode}){const heading=useId(),ref=useRef<HTMLDivElement>(null),close=()=>useEditor.getState().set({modal:null});useEffect(()=>{ref.current?.querySelector<HTMLElement>('button')?.focus();},[]);return <div className="modal-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}><div ref={ref} role="dialog" aria-modal="true" aria-labelledby={heading} className="dialog wide-dialog storage-recovery" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='Tab'){const controls=[...e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled])')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}><header className="dialog-header"><div><span className="eyebrow">{eyebrow}</span><h2 id={heading}>{title}</h2></div><button aria-label="Close dialog" onClick={close}><X size={18}/></button></header><div className="dialog-body">{children}</div></div></div>;}
const row=(label:string,group:{count:number;bytes:number},unit:string)=><tr key={label}><th scope="row">{label}</th><td>{group.count} {unit}{group.count===1?'':unit==='branch'?'es':'s'}</td><td>{formatBytes(group.bytes)}</td></tr>;
export function StorageRecoveryDialog(){
 const health=useStorageHealth(),docId=useEditor(s=>s.doc.id),[report,setReport]=useState<StorageBreakdown|null>(null),[error,setError]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0),[fonts,setFonts]=useState<FontCacheRow[]>([]);
 useEffect(()=>{let current=true;void refreshStorageHealth();void measureLocalStorage().then(r=>{if(current)setReport(r);}).catch(e=>{if(current)setError(e instanceof Error?e.message:String(e));});void inspectFontCache().then(r=>{if(current)setFonts(r.rows);}).catch(()=>{if(current)setFonts([]);});return()=>{current=false;};},[revision]);
 const run=async(fn:()=>Promise<void>)=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 const percent=Math.round(health.ratio*1000)/10;
 return <Shell eyebrow="ON THIS DEVICE" title="Storage and recovery">
  {error&&<p role="alert">{error}</p>}{status&&<p role="status">{status}</p>}
  {health.level==='unknown'?<p>Device storage quota is not reported here.</p>:<p>{formatBytes(health.usage)} of {formatBytes(health.quota)} used ({percent}%).{health.level==='full'?' The last save failed because storage is full.':health.level==='critical'?' Save .oui backups and free space now.':health.level==='warning'?' Free space soon.':''}</p>}
  <div role="progressbar" aria-label="Local storage used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,percent)} className={'storage-meter storage-meter-'+health.level}><span style={{width:Math.min(100,percent)+'%'}}/></div>
  <p>{health.persisted===true?'This browser keeps local files until you remove them.':health.persisted===false?'The browser may clear local files under storage pressure. Keep .oui backups.':'Durable storage status is unavailable.'}</p>
  {health.persisted===false&&<div className="button-row"><button className="outline-button" disabled={busy} onClick={()=>void run(async()=>{setStatus(await requestDurableStorage()?'Durable storage granted.':'The browser declined durable storage. Keep .oui backups.');})}>Ask to keep local files</button></div>}
  {!report&&!error&&<p role="status">Measuring local files…</p>}
  {report&&<><table className="storage-table" aria-label="Local storage by kind"><tbody>{row('Files',report.documents,'file')}{row('Embedded images and media (within files)',report.embeddedAssets,'asset')}{row('Saved versions',report.versions,'version')}{row('Branches',report.branches,'branch')}{row('Persisted Undo history',report.editHistory,'file')}{row('Cached fonts',{count:fonts.reduce((n,f)=>n+f.downloadedFiles,0),bytes:fonts.reduce((n,f)=>n+f.downloadedBytes,0)},'file')}</tbody></table>
   <div className="button-row"><button className="outline-button" disabled={busy||!report.editHistory.count} onClick={()=>void run(async()=>{const removed=await clearEditHistories(docId);setStatus(`Cleared Undo history for ${removed} closed file${removed===1?'':'s'}. Documents were not changed.`);setRevision(v=>v+1);})}>Clear Undo history of closed files</button><button className="outline-button" disabled={busy||!fonts.some(f=>f.downloadedFiles)} onClick={()=>void run(async()=>{const rows=fonts.filter(f=>f.downloadedFiles);for(const f of rows)await removeDownloadedFontCache(f.family);setStatus(`Cleared cached fonts for ${rows.length} famil${rows.length===1?'y':'ies'}. Imported fonts and fonts inside documents were kept.`);setRevision(v=>v+1);})}>Clear cached fonts</button></div>
   {!!report.damaged.length&&<section aria-label="Damaged local files"><h3>Damaged files</h3><ul>{report.damaged.map(d=><li key={d.id}>{d.name} <button className="text-button" onClick={()=>reportDamagedDocument(d.id,d.name)}>Recover {d.name}</button></li>)}</ul></section>}</>}
  <p className="small-note">Sizes are serialized lengths measured from local records. The browser's own overhead and caches are included only in the device total.</p>
 </Shell>;
}
export function DocumentRecoveryDialog(){
 const target=useDamagedDocument(s=>s.target),[versions,setVersions]=useState<SnapshotHeader[]>([]),[raw,setRaw]=useState<unknown>(undefined),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!target)return;let current=true;void Promise.all([rawStoredDocument(target.id),listSnapshotHeaders(target.id).catch(()=>({versions:[] as SnapshotHeader[]}))]).then(([value,rows])=>{if(current){setRaw(value);setVersions(rows.versions);setLoading(false);}}).catch(e=>{if(current){setError(e instanceof Error?e.message:String(e));setLoading(false);}});return()=>{current=false;};},[target]);
 const repair=useMemo<{report?:RepairReport;error?:string}>(()=>{if(raw===undefined)return {};try{return {report:repairDocument(raw)};}catch(e){return {error:e instanceof Error?e.message:String(e)};}},[raw]);
 const run=async(fn:()=>Promise<void>)=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e instanceof Error?e.message:String(e));setBusy(false);}};
 if(!target)return null;
 const newest=versions[0];
 return <Shell eyebrow="FILE RECOVERY" title="This file could not be opened">
  <p className="dialog-description">“{target.name}” failed validation, so it was not opened. It stays on this device unchanged. Every option below creates a new file.</p>
  {error&&<p role="alert">{error}</p>}{loading&&<p role="status">Checking what can be recovered…</p>}
  {!loading&&<><section aria-label="Saved version"><h3>Latest saved version</h3>{newest?<><p>{newest.name} · {new Date(newest.date).toLocaleString()}</p><button className="primary-button" disabled={busy} onClick={()=>void run(async()=>{const snapshot=await readSnapshot(newest.id,target.id);await openRecoveredCopy(snapshot.doc,`${target.name} (${newest.name})`);})}>Open saved version as a copy</button></>:<p>No named versions are stored for this file.</p>}</section>
   <section aria-label="Repaired copy"><h3>Repaired copy</h3>{repair.report?<><p>{repairSummary(repair.report)}</p><button className="outline-button" disabled={busy} onClick={()=>void run(async()=>{await openRecoveredCopy(repair.report!.document,target.name+' (repaired)');})}>Open repaired copy</button></>:<p>{repair.error??'Repair is unavailable.'}</p>}</section>
   <section aria-label="Damaged data"><h3>Damaged data</h3><p>Keep the stored data for later inspection.</p><button className="outline-button" disabled={busy||raw===undefined} onClick={()=>void run(async()=>{await download(target.name.replace(/[^\w .-]+/g,'-').slice(0,80)+'.damaged.json',JSON.stringify(raw),'application/json');setBusy(false);})}>Download damaged data</button></section></>}
 </Shell>;
}
export const SafeModePluginsNotice=()=><Shell eyebrow="SAFE MODE" title="Local plugins are off"><p>Plugins stay off in safe mode. Restart normally to use them.</p></Shell>;
export function SafeModeBanner({reason,onRestart}:{reason:string;onRestart:()=>void}){return <div className="safe-mode-banner" role="status"><strong>Safe mode</strong><span>{reason==='repeated-failures'?'Forma did not finish starting twice. ':''}Your last file was not reopened, and fonts, plugins and recovered edits stay off.</span><button className="outline-button" onClick={onRestart}>Restart normally</button></div>;}
