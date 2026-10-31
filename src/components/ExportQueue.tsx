import {useRef,useState,useSyncExternalStore} from 'react';
import {useEditor} from '../store';
import {download,notifyError} from '../files';
import {exportFilename} from '../frame-export-settings';
import type {ArtworkFormat} from '../frame-export-settings';
import {layerExportJob,renderExportJob} from '../export-delivery';
import type {ExportJob} from '../export-delivery';
import {defaultFrameExportSetting} from '../frame-export-settings';
import {enqueue,getExportQueue,queueArchive,queuePresets,queueSummary,retryable,runExportQueue,setExportQueue,subscribeExportQueue} from '../export-queue';
import type {QueueItem,QueueSpec} from '../export-queue';
import {formatBytes} from '../privacy-inventory';
import './local-tools.css';
const statusLabel={queued:'Queued',running:'Rendering',done:'Done',failed:'Failed',cancelled:'Cancelled'};
export default function ExportQueue(){
 const s=useEditor(),queue=useSyncExternalStore(subscribeExportQueue,getExportQueue) as QueueItem<ExportJob>[],[preset,setPreset]=useState(queuePresets[0].id),[custom,setCustom]=useState<QueueSpec>({format:'png',scale:2,suffix:'@2x'}),[running,setRunning]=useState(false),[error,setError]=useState(''),abort=useRef<AbortController|null>(null),page=s.doc.pages.find(p=>p.id===s.pageId)!,selected=page.nodes.filter(n=>s.selection.includes(n.id)),summary=queueSummary(queue);
 const add=(specs:QueueSpec[])=>{try{if(!selected.length)throw Error('Select layers on the canvas first. The queue stays here while you do.');const rows=selected.flatMap(n=>specs.map(spec=>{const setting={...defaultFrameExportSetting(),format:spec.format,scale:spec.scale,suffix:spec.suffix,bounds:(n.type==='frame'||n.type==='slice'?'frame':'artwork') as 'frame'|'artwork'};return {layer:n.name,page:page.name,job:layerExportJob(n.id,setting)};}));setExportQueue(enqueue(queue,rows));setError('');}catch(e){setError(e instanceof Error?e.message:'These layers could not be queued.');}};
 const start=async()=>{if(running)return;const controller=new AbortController();abort.current=controller;setRunning(true);setError('');try{await runExportQueue(queue,renderExportJob,setExportQueue,controller.signal);}catch(e){setError(e instanceof Error?e.message:'The queue stopped.');}finally{abort.current=null;setRunning(false);}};
 const save=()=>{try{const zip=queueArchive(queue,s.doc.name);void download(exportFilename(s.doc.name,'-export-queue','zip'),new Blob([new Uint8Array(zip).buffer],{type:'application/zip'})).catch(notifyError);}catch(e){setError(e instanceof Error?e.message:'The archive could not be saved.');}};
 return <div className="local-tool export-queue">
  <p className="dialog-description">Queue several formats and sizes for {selected.length?selected.length+' selected layers':'your selection'}, render them in one run, then save a ZIP with a manifest. Each entry is a snapshot from when you added it. The queue lasts for this session and holds SVG, PNG and JPG. Use Export for PDF.</p>
  {error&&<p role="alert" className="tool-warning">{error}</p>}
  <div className="tool-row"><label className="tool-field">Format set<select aria-label="Export format set" value={preset} onChange={e=>setPreset(e.target.value)}>{queuePresets.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label><button className="primary-button" disabled={running} onClick={()=>add(queuePresets.find(p=>p.id===preset)!.specs)}>Add set to queue</button></div>
  <div className="tool-row"><label className="tool-field">Format<select aria-label="Queue format" value={custom.format} onChange={e=>setCustom({...custom,format:e.target.value as ArtworkFormat})}><option value="svg">SVG</option><option value="png">PNG</option><option value="jpg">JPG</option></select></label><label className="tool-field">Scale<input aria-label="Queue scale" type="number" min={.01} max={64} step={.5} value={custom.scale} onChange={e=>setCustom({...custom,scale:Number(e.target.value)})}/></label><label className="tool-field">Suffix<input aria-label="Queue suffix" maxLength={64} value={custom.suffix} onChange={e=>setCustom({...custom,suffix:e.target.value})}/></label><button disabled={running} onClick={()=>add([custom])}>Add one format</button></div>
  <p role="status">{summary.total} files: {summary.queued} queued, {summary.done} done, {summary.failed} failed{summary.cancelled?', '+summary.cancelled+' cancelled':''}{summary.bytes?' · '+formatBytes(summary.bytes):''}</p>
  {queue.length>0&&<ul className="tool-list queue-list" aria-label="Export queue">{queue.map(i=><li key={i.id} data-status={i.status}><span className="queue-name">{i.job.name}<small>{i.layer} · {i.job.format.toUpperCase()} · {i.job.width} × {i.job.height}</small></span><span className="queue-status">{statusLabel[i.status]}{i.bytes?' · '+formatBytes(i.bytes.byteLength):''}{i.error&&<small>{i.error}</small>}</span><button aria-label={'Remove '+i.job.name} disabled={running} onClick={()=>setExportQueue(queue.filter(x=>x.id!==i.id))}>Remove</button></li>)}</ul>}
  <div className="button-row">{running?<button onClick={()=>abort.current?.abort()}>Cancel run</button>:<button className="primary-button" disabled={!summary.queued} onClick={()=>void start()}>Start queue</button>}<button disabled={running||!summary.failed&&!summary.cancelled} onClick={()=>setExportQueue(retryable(queue))}>Retry failed</button><button disabled={running||!summary.done} onClick={save}>Save ZIP ({summary.done})</button><button disabled={running||!queue.length} onClick={()=>setExportQueue([])}>Clear queue</button></div>
 </div>;
}
