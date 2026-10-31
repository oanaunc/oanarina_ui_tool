import {useLayoutEffect,useMemo,useRef,useState} from 'react';
import {useEditor} from '../store';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {download} from '../files';
import {assetsForUsage,projectFontUsage} from '../fonts';
import {prototypeFrames} from '../prototype';
import {prototypeArchive,prototypeEmbed,prototypeFile,prototypeSnapshot} from '../prototype-export';
import type {PrototypeSnapshotReport} from '../prototype-export';
import {PROTOTYPE_PASSWORD_MIN,validatePrototypePassword} from '../prototype-crypto';
import {formatBytes} from '../privacy-inventory';
import {useDocumentDialogFocus} from './useDocumentDialogFocus';
import './prototype-share.css';
const LOCATION='prototype.html';
export default function PrototypeShare(){
 const s=useEditor(),root=useRef<HTMLDivElement>(null),pending=useRef(false),alive=useRef(true),page=s.doc.pages.find(p=>p.id===s.pageId),frames=useMemo(()=>page?prototypeFrames(page):[],[page]),selected=frames.find(f=>s.selection.includes(f.id))??frames[0];
 const [start,setStart]=useState(selected?.id??''),[locked,setLocked]=useState(false),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState<{bytes:number;locked:boolean;report:PrototypeSnapshotReport}|null>(null),[location,setLocation]=useState(LOCATION),[copied,setCopied]=useState('');
 useDocumentDialogFocus(root);
 const context=useMemo(()=>({origin:captureColorContext(s),valid:true}),[s]);
 useLayoutEffect(()=>{context.valid=sameColorContext(context.origin,useEditor.getState());const off=useEditor.subscribe(live=>{if(!sameColorContext(context.origin,live))context.valid=false;});return()=>{context.valid=false;off();};},[context]);
 useLayoutEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const close=()=>useEditor.getState().set({modal:null}),frame=frames.find(f=>f.id===start)??frames[0],title=[s.doc.name,page?.name].filter(Boolean).join(' · ');
 const embed=useMemo(()=>{if(!frame)return {code:'',error:''};try{return {code:prototypeEmbed({location,title:locked?'Protected prototype':title,width:frame.width,height:frame.height}),error:''};}catch(e){return {code:'',error:(e as Error).message};}},[location,title,locked,frame]);
 const save=async()=>{if(pending.current)return;pending.current=true;setBusy(true);setError('');setDone(null);try{
  const live=useEditor.getState();if(!context.valid||!sameColorContext(context.origin,live))throw Error('The file changed. Close and reopen this dialog.');
  if(locked){validatePrototypePassword(password);if(password!==confirm)throw Error('The two passwords do not match.');}
  const {payload,report}=prototypeSnapshot(live.doc,live.pageId,{startFrameId:start||undefined,fonts:assetsForUsage(projectFontUsage(live.doc),live.doc.fonts)}),runtime=(await import('virtual:forma-prototype-player')).default,html=await prototypeFile(runtime,payload,locked?password:undefined);
  // The snapshot is a finished copy, so a later font reflow does not spoil it. Closing the dialog does cancel the save.
  if(!alive.current)return;
  const bytes=prototypeArchive(html,{protected:locked,embed:embed.code}),saved=await download(locked?'protected-prototype.zip':(live.doc.name.replace(/[^\p{L}\p{N} ._-]+/gu,'-').trim()||'prototype')+'-prototype.zip',new Blob([new Uint8Array(bytes).buffer],{type:'application/zip'}));
  if(alive.current&&saved!==false){setDone({bytes:bytes.byteLength,locked,report});setPassword('');setConfirm('');}
 }catch(e){if(alive.current)setError(e instanceof Error?e.message:String(e));}finally{pending.current=false;if(alive.current)setBusy(false);}};
 const copy=async()=>{try{await navigator.clipboard.writeText(embed.code);setCopied('Embed code copied.');}catch{setCopied('Copying was blocked. Select the code above and copy it.');}};
 return <div className="modal-backdrop"><div ref={root} role="dialog" aria-modal="true" aria-label="Export prototype file" tabIndex={-1} className="dialog wide-dialog prototype-share" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}if(['Enter',' '].includes(e.key)&&(e.target as Element).closest('button'))e.stopPropagation();}}><header className="dialog-header"><h2>Export prototype file</h2><button aria-label="Close prototype export" onClick={close}>Close</button></header><div className="dialog-body">
 <p className="dialog-description">Saves a ZIP with one offline HTML file that plays this page's prototype. There is no hosted link yet: you host or send the file yourself. A server-backed link will arrive separately.</p>
 {!frames.length?<p role="alert">Add a frame to this page before exporting a prototype.</p>:<>
 <label className="tool-field">Start at<select aria-label="Prototype start frame" value={start} onChange={e=>setStart(e.target.value)}>{frames.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
 <fieldset className="prototype-share-access"><legend>Who can read the file</legend><label className="check-row"><input type="radio" name="prototype-access" checked={!locked} onChange={()=>setLocked(false)}/>Anyone who has the file</label><label className="check-row"><input type="radio" name="prototype-access" checked={locked} onChange={()=>setLocked(true)}/>Only people with a password</label></fieldset>
 {locked&&<div className="prototype-share-password"><label className="tool-field">Password<input data-initial-focus type="password" autoComplete="new-password" aria-label="Prototype password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="tool-field">Repeat password<input type="password" autoComplete="new-password" aria-label="Repeat prototype password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><p className="small-note">The file is encrypted with AES-256-GCM using a key derived from this password, of at least {PROTOTYPE_PASSWORD_MIN} characters. Forma does not keep it, and a lost password cannot be recovered. Anyone with the file and the password can read everything in it, and a weak password can be guessed. Viewers must open the file from https:// or directly from their device.</p></div>}
 <p className="small-note">Included: every frame on this page with its hidden layers, variables, the components it uses, and the fonts Forma may embed. Left out: other pages, loose layers outside frames, comments, annotations and developer notes. Viewers cannot comment in the file, and nothing they do reaches this design.</p>
 {error&&<p role="alert">{error}</p>}
 {done&&<p role="status">Saved {formatBytes(done.bytes)}{done.locked?', encrypted':''}. {done.report.frames} frames, {done.report.layers} layers. Left out {done.report.pagesOmitted} other pages, {done.report.commentsOmitted} comments and {done.report.layersOmitted} loose layers.{done.report.fontsRestricted.length?' Not embedded because of their license: '+done.report.fontsRestricted.join(', ')+'.':''}</p>}
 <div className="button-row"><button className="primary-button" disabled={busy} onClick={()=>void save()}>{busy?'Preparing…':'Save prototype ZIP'}</button></div>
 <section aria-label="Embed code"><h3>Embed on a page you host</h3><label className="tool-field">File location<input aria-label="Prototype file location" value={location} maxLength={2048} onChange={e=>{setLocation(e.target.value);setCopied('');}}/></label>{embed.error?<p role="alert">{embed.error}</p>:<textarea readOnly rows={4} aria-label="Prototype embed code" value={embed.code} onFocus={e=>e.currentTarget.select()}/>}<div className="button-row"><button className="outline-button" disabled={!embed.code} onClick={()=>void copy()}>Copy embed code</button></div>{copied&&<p role="status">{copied}</p>}<p className="small-note">The sandbox keeps the prototype away from your page. Remove allow-popups if its links should not open new tabs.</p></section>
 </>}
 </div></div></div>;
}
