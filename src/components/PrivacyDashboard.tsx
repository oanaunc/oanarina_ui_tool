import {useEffect,useMemo,useState} from 'react';
import {clearRecentActions} from '../action-history';
import {clearRecentColors} from '../recent-colors';
import {clearCommandUsage} from '../command-usage';
import {connectPolicy,databaseCatalog,formatBytes,localStorageCatalog,nativeStatements,networkDisclosures,observedRequests,policyHosts,privacyStatements,readDatabaseInventory,readLocalStorageInventory} from '../privacy-inventory';
import type {DatabaseRow,LocalStorageInventory} from '../privacy-inventory';
import './local-tools.css';
const readStorage=()=>{try{return readLocalStorageInventory(window.localStorage);}catch{return readLocalStorageInventory(undefined);}};
const clearers:Record<string,()=>void>={'oui-action-history':clearRecentActions,'oui-recent-colors':clearRecentColors,'forma-command-usage-v1':clearCommandUsage};
export default function PrivacyDashboard(){
 const [local,setLocal]=useState<LocalStorageInventory>(readStorage),[databases,setDatabases]=useState<{rows:DatabaseRow[];measured:boolean}|null>(null),[quota,setQuota]=useState<{usage?:number;quota?:number}|null>(null),[confirming,setConfirming]=useState(''),[message,setMessage]=useState(''),catalog=useMemo(()=>new Map(local.rows.map(r=>[r.key,r])),[local]);
 useEffect(()=>{let alive=true;void readDatabaseInventory(globalThis.indexedDB).then(v=>{if(alive)setDatabases(v);});void navigator.storage?.estimate?.().then(v=>{if(alive)setQuota(v);}).catch(()=>{});return()=>{alive=false;};},[]);
 const policy=connectPolicy(document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content')),hosts=policy?policyHosts(policy).filter(h=>h!=='127.0.0.1'&&h!=='localhost'):null,observed=observedRequests(performance.getEntriesByType('resource'),location.origin),native=!!window.desktop;
 const clear=(key:string)=>{if(confirming!==key){setConfirming(key);setMessage('');return;}try{if(clearers[key])clearers[key]();else localStorage.removeItem(key);setLocal(readStorage());setConfirming('');setMessage(localStorageCatalog.find(e=>e.key===key)?.label+' cleared on this device.');}catch{setMessage('Local storage is blocked, so nothing was cleared.');}};
 return <div className="local-tool privacy-dashboard">
  <section aria-label="What Forma sends"><h3>What leaves this device</h3><ul className="tool-list">{privacyStatements.map(s=><li key={s}>{s}</li>)}{native&&nativeStatements.map(s=><li key={s}>{s}</li>)}</ul>
   <h3>Outbound requests</h3>{networkDisclosures.map(d=><div className="tool-card" key={d.host}><strong>{d.host}</strong><p>{d.when}</p><p>{d.sends}</p></div>)}
   <p className="small-note">{hosts?'This window’s security policy only permits connections to itself'+(hosts.length?' and '+hosts.join(', '):'')+'. The browser engine enforces that list.':'This window does not expose a connection policy to inspect.'}</p>
   <p role="status">{observed.length?'Connections observed this session: '+observed.map(o=>o.host+' ('+o.requests+')').join(', ')+'.':'No connections to other hosts have been observed this session.'}</p>
  </section>
  <section aria-label="Stored on this device"><h3>Stored on this device</h3><p>{local.readable?local.rows.length+' local settings, '+formatBytes(local.bytes):'Local settings storage is blocked in this window.'}{quota?.usage!==undefined?'. All Forma data in this app uses about '+formatBytes(quota.usage)+'.':'.'}</p>
   {message&&<p role="status">{message}</p>}
   <div className="tool-table-wrap"><table className="tool-table"><caption>Project and library databases</caption><thead><tr><th scope="col">Store</th><th scope="col">Holds</th><th scope="col">Items</th><th scope="col">Project content</th></tr></thead><tbody>{(databases?.rows??databaseCatalog.map(entry=>({entry,exists:false,records:null}))).map(r=><tr key={r.entry.key}><th scope="row">{r.entry.label}</th><td>{r.entry.holds}</td><td>{!databases?'Reading…':!databases.measured||r.records===null?'Not measured':r.exists?r.records:0}</td><td>{r.entry.projectContent?'Yes':'No'}</td></tr>)}</tbody></table></div>
   <div className="tool-table-wrap"><table className="tool-table"><caption>Local settings</caption><thead><tr><th scope="col">Setting</th><th scope="col">Holds</th><th scope="col">Size</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead><tbody>{localStorageCatalog.map(e=>{const row=catalog.get(e.key);return <tr key={e.key}><th scope="row">{e.label}</th><td>{e.holds}</td><td>{row?formatBytes(row.bytes):'Empty'}</td><td>{e.clearable&&row&&<button onClick={()=>clear(e.key)}>{confirming===e.key?'Confirm clear':'Clear'}</button>}</td></tr>;})}{local.rows.filter(r=>!r.entry).map(r=><tr key={r.key}><th scope="row">Unrecognized</th><td><code>{r.key}</code></td><td>{formatBytes(r.bytes)}</td><td/></tr>)}</tbody></table></div>
   <p className="small-note">Projects are deleted from Home, downloaded fonts from the Font library, and plugins from Local plugins. Runtime errors kept for bug reports stay in memory and end with the session.</p>
  </section>
 </div>;
}
