import {useState} from 'react';
import type {FormEvent} from 'react';
import {createRoot} from 'react-dom/client';
import PrototypePresentation from '../components/PrototypePresentation';
import {useEditor} from '../store';
import {openPrototypeCipher,parsePrototypeEnvelope,PROTOTYPE_DATA_ID} from '../prototype-export';
import type {PrototypePayload} from '../prototype-export';
import {prototypeCryptoAvailable} from '../prototype-crypto';
import type {PrototypeCipher} from '../prototype-crypto';
import './player.css';
const root=createRoot(document.getElementById('root')!);
const failure=(message:string)=>root.render(<main className="player-card" role="alert"><h1>This prototype cannot open</h1><p>{message}</p></main>);
/** Fonts travel in the file. They load before the first frame, so text measures the way it did in Forma. */
async function loadFonts(payload:PrototypePayload){await Promise.allSettled((payload.document.fonts??[]).map(async f=>{document.fonts.add(await new FontFace(f.family,`url(${f.data})`,{weight:f.weight,style:f.style??'normal',...(f.unicodeRange?{unicodeRange:f.unicodeRange}:{})}).load());}));}
async function start(payload:PrototypePayload){await loadFonts(payload);document.title=payload.title||'Prototype';useEditor.setState({doc:payload.document,pageId:payload.pageId,selection:payload.startFrameId?[payload.startFrameId]:[],modal:'present'});root.render(<><PrototypePresentation/><Notice/></>);}
function Notice(){const [open,setOpen]=useState(false);return <aside className="player-notice"><button aria-expanded={open} aria-label="About this prototype" onClick={()=>setOpen(!open)}>i</button>{open&&<p role="status">Offline copy made with Forma. Nothing you do here is saved, sent anywhere or seen by the designer. Comments belong to the original Forma file.</p>}</aside>;}
function PasswordGate({cipher}:{cipher:PrototypeCipher}){
 const [password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(prototypeCryptoAvailable()?'':'This browser only offers encryption on secure pages. Open the file from https:// or directly from this device.');
 const open=async(e:FormEvent)=>{e.preventDefault();if(busy||!password)return;setBusy(true);setError('');try{await start(await openPrototypeCipher(cipher,password));}catch(failed){setPassword('');setBusy(false);setError(failed instanceof Error?failed.message:'This prototype could not be opened.');}};
 return <main className="player-card"><h1>Protected prototype</h1><p>Enter the password to decrypt this prototype on this device.</p><form onSubmit={open}><label>Password<input autoFocus type="password" autoComplete="off" aria-label="Prototype password" value={password} disabled={!prototypeCryptoAvailable()} onChange={e=>setPassword(e.target.value)}/></label><button type="submit" disabled={busy||!password||!prototypeCryptoAvailable()}>{busy?'Opening…':'Open prototype'}</button></form>{error&&<p role="alert">{error}</p>}</main>;
}
try{const opened=parsePrototypeEnvelope(document.getElementById(PROTOTYPE_DATA_ID)?.textContent??'');if(opened.kind==='encrypted')root.render(<PasswordGate cipher={opened.cipher}/>);else void start(opened.payload).catch(e=>failure(e instanceof Error?e.message:'This prototype could not be opened.'));}catch(e){failure(e instanceof Error?e.message:'This prototype could not be opened.');}
