import type {DesignNode} from '../model';
import {LockKeyhole,LockKeyholeOpen} from 'lucide-react';
export {constrainAspectPatch} from '../transform-controls';
export default function AspectLockControl({n,patch}:{n:DesignNode;patch:(value:Partial<DesignNode>)=>void}){const Icon=n.aspectLocked?LockKeyhole:LockKeyholeOpen;return <>{n.type==='text'&&n.textResize&&n.textResize!=='fixed'&&<p className="inspector-note">Locking the ratio fixes this text box’s dimensions.</p>}<button className="text-button" aria-label="Lock aspect ratio" aria-pressed={!!n.aspectLocked} onClick={()=>patch({aspectLocked:!n.aspectLocked})}><Icon size={13}/>{n.aspectLocked?'Aspect ratio locked':'Lock aspect ratio'}</button></>;}
