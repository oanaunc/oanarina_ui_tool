import type {DesignNode} from '../model';
import {LockKeyhole,LockKeyholeOpen} from 'lucide-react';
export {constrainAspectPatch} from '../transform-controls';
export default function AspectLockControl({n,patch}:{n:DesignNode;patch:(value:Partial<DesignNode>)=>void}){const Icon=n.aspectLocked?LockKeyhole:LockKeyholeOpen;return <button className="inspector-tool" aria-label="Lock aspect ratio" aria-pressed={!!n.aspectLocked} title={n.type==='text'&&n.textResize&&n.textResize!=='fixed'?'Locking the ratio fixes this text box’s dimensions.':n.aspectLocked?'Aspect ratio locked':'Lock aspect ratio'} onClick={()=>patch({aspectLocked:!n.aspectLocked})}><Icon size={12}/></button>;}
