import {useLayoutEffect,useRef} from 'react';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {chooseFigmaRestJson} from '../files';
import {useEditor} from '../store';
type Proof={origin:ReturnType<typeof captureColorContext>;valid:boolean};
/** An entry receipt cannot revive after a modal/mode cycle, even before React commits. */
export default function FigmaRestImportButton(){const s=useEditor(),live=useRef<Proof|null>(null);if(!live.current?.valid||!sameColorContext(live.current.origin,s))live.current={origin:captureColorContext(s),valid:true};const proof=live.current;
 useLayoutEffect(()=>{if(live.current===proof&&sameColorContext(proof.origin,useEditor.getState()))proof.valid=true;const off=useEditor.subscribe(next=>{if(!sameColorContext(proof.origin,next))proof.valid=false;});return()=>{proof.valid=false;off();};},[proof]);
 return <button className="outline-button" onClick={()=>{if(proof.valid&&live.current===proof&&sameColorContext(proof.origin,useEditor.getState()))chooseFigmaRestJson(proof.origin);}}>Import local REST JSON…</button>;
}
