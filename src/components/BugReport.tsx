import {useMemo,useState} from 'react';
import {useEditor} from '../store';
import {download,notifyError,serializedProject} from '../files';
import {exportFilename} from '../frame-export-settings';
import {bugBundleBytes,bugBundleFiles,buildBugReport,BUG_DESCRIPTION_LIMIT} from '../bug-report';
import {getPreferences} from '../preferences';
import {getRecentActions} from '../action-history';
import {recentRuntimeErrors} from '../error-log';
import {APP_VERSION,FEATURE_COUNT} from '../feature-meta';
import {formatBytes,readLocalStorageInventory} from '../privacy-inventory';
import './local-tools.css';
export default function BugReport(){
 const s=useEditor(),[description,setDescription]=useState(''),[includeDocument,setIncludeDocument]=useState(false),[message,setMessage]=useState('');
 const report=useMemo(()=>{const local=(()=>{try{return readLocalStorageInventory(window.localStorage);}catch{return readLocalStorageInventory(undefined);}})();return buildBugReport({description:description.slice(0,BUG_DESCRIPTION_LIMIT),createdAt:new Date().toISOString(),app:{version:APP_VERSION,features:FEATURE_COUNT},environment:{platform:window.desktop?'mac-app':'browser',userAgent:navigator.userAgent,screen:screen.width+'×'+screen.height,viewport:innerWidth+'×'+innerHeight,pixelRatio:devicePixelRatio},state:{mode:s.mode,motionOpen:s.motionOpen,selectionCount:s.selection.length,zoom:Math.round(s.zoom*1000)/1000,undoDepth:s.past.length},preferences:getPreferences(),recentCommands:getRecentActions(),errors:recentRuntimeErrors(),storage:{localStorageKeys:local.rows.length,localStorageBytes:local.bytes},doc:s.doc},includeDocument);},[description,includeDocument,s.doc,s.mode,s.motionOpen,s.selection,s.zoom,s.past.length]);
 const documentSize=useMemo(()=>includeDocument?new Blob([serializedProject()]).size:0,[includeDocument,s.doc]);
 const save=()=>{try{const raw=includeDocument?serializedProject():undefined,files=bugBundleFiles({...report,createdAt:new Date().toISOString()},raw),bytes=bugBundleBytes(files);void download(exportFilename('forma','-bug-report','zip'),new Blob([new Uint8Array(bytes).buffer],{type:'application/zip'})).then(saved=>{if(saved===false)return;setIncludeDocument(false);setMessage('Bundle saved. Forma did not send it anywhere. Document sharing is off again for the next bundle.');}).catch(notifyError);}catch(e){notifyError(e);}};
 return <div className="local-tool bug-report">
  <p className="dialog-description">Tell us what went wrong or what you'd like. This saves a ZIP file on this device with the app version, file size and a short report, for you to send as you choose. Forma sends nothing by itself. By default it holds counts, app settings and redacted errors, and no names, text, colors or artwork from your project.</p>
  <label className="tool-field">What went wrong?<textarea aria-label="Bug description" rows={4} maxLength={BUG_DESCRIPTION_LIMIT} placeholder="What you did, what you expected and what happened." value={description} onChange={e=>setDescription(e.target.value)}/></label>
  <label className="check-row tool-optin"><input aria-label="Include this document in this bundle" type="checkbox" checked={includeDocument} onChange={e=>{setIncludeDocument(e.target.checked);setMessage('');}}/>Include a full copy of this document in this bundle only</label>
  {includeDocument&&<p role="status" className="tool-warning">“{s.doc.name}” ({formatBytes(documentSize)}) will be added as document.oui, with all its text, images and comments. This choice resets after each bundle.</p>}
  <div className="button-row"><button className="primary-button" onClick={save}>Save bug report bundle</button></div>
  {message&&<p role="status">{message}</p>}
  <details className="tool-preview"><summary>Preview report.json ({recentRuntimeErrors().length} runtime errors)</summary><pre tabIndex={0} aria-label="Bug report preview">{JSON.stringify(report,null,2)}</pre></details>
 </div>;
}
