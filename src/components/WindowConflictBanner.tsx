import {useState} from 'react';
import {useEditor} from '../store';
import {keepWindowRevision,loadStoredRevision,saveWindowRevisionAsCopy,useWindowSession} from '../document-session';
import './window-conflict.css';

/** Conflict actions are explicit; autosave has already stopped writing over the other window's work. */
export default function WindowConflictBanner(){
 const session=useWindowSession(),docId=useEditor(s=>s.doc.id),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const run=async(fn:()=>Promise<void>)=>{setBusy(true);setError('');try{await fn();}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 if(session.documentId!==docId)return null;
 if(session.conflict)return <div className="window-conflict" role="alert"><strong>This file changed in another window.</strong><span>{session.conflict.source==='write'?'Automatic saving stopped here so neither version is overwritten.':'This window still shows the earlier version.'}</span>{error&&<span>{error}</span>}<div className="button-row"><button className="outline-button" disabled={busy} onClick={()=>void run(loadStoredRevision)}>Load the newer version</button><button className="outline-button" disabled={busy} onClick={()=>void run(saveWindowRevisionAsCopy)}>Keep mine as a copy</button><button className="outline-button" disabled={busy} onClick={()=>void run(keepWindowRevision)}>Overwrite with this window</button></div></div>;
 if(session.peers&&!session.dismissed)return <div className="window-conflict window-conflict-note" role="status"><span>This file is also open in another window. Edit it in one place to avoid conflicting versions.</span><button className="outline-button" onClick={()=>useWindowSession.setState({dismissed:true})}>Dismiss</button></div>;
 return null;
}
