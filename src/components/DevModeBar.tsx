import {useMemo} from 'react';
import {useEditor} from '../store';
import {handoffIndex} from '../development-status';
/** Persistent workspace marker: Dev Mode must never look like an editable canvas. */
export default function DevModeBar(){const s=useEditor(),counts=useMemo(()=>{try{const rows=handoffIndex(s.doc);return {ready:rows.filter(r=>r.status==='ready').length,done:rows.filter(r=>r.status==='completed').length};}catch{return null;}},[s.doc]);if(s.mode!=='inspect'||s.home||s.uiHidden)return null;return <div className="dev-mode-bar" role="status" aria-label="Dev Mode"><strong>Dev Mode</strong><span>Artwork is read-only here. Inspect, comment, set handoff status and map code.</span>{counts&&<span>{counts.ready} ready · {counts.done} completed</span>}<button type="button" onClick={()=>s.set({mode:'design'})}>Exit Dev Mode</button></div>;}
