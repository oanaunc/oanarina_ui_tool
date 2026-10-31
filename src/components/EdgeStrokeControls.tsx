import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {DesignNode} from '../model';
import {isLocked} from '../model';
import type {StrokeStyle} from '../paints';
import {edgeNames,edgeStrokeIssue,validateEdgeStrokeStyle} from '../edge-strokes';
import type {EdgeWidths} from '../edge-strokes';
import {captureColorContext,sameColorContext} from '../color-edit-context';
import {useEditor} from '../store';
import {managedLayer} from '../layer-operations';
import NumberField from './NumberField';

export default function EdgeStrokeControls({n,stroke,index,onChange}:{n:DesignNode;stroke:StrokeStyle;index:number;onChange:(patch:Partial<StrokeStyle>)=>void}){
 const s=useEditor(),proof=useRef<ReturnType<typeof captureColorContext>|null>(null),[error,setError]=useState(''),prefix=`Stroke ${index+1}`,issue=edgeStrokeIssue(n),lineIssue=stroke.join!=='miter'||stroke.cap!=='butt'?'Use miter joins and butt caps before enabling independent edges.':'',blocked=s.mode!=='design'||s.motionOpen||s.home||!!s.modal||s.uiHidden||s.doc.workspace&&s.doc.workspace!=='design'||s.selection.length!==1||s.selection[0]!==n.id||isLocked(n,s.doc.pages.find(p=>p.id===s.pageId)!.nodes)||n.type==='instance'||managedLayer(n,s.doc.pages.find(p=>p.id===s.pageId)!.nodes);
 useLayoutEffect(()=>{proof.current=captureColorContext(s);setError('');},[s.doc,s.pageId,s.mode,s.motionOpen,s.motionTime,s.home,s.modal,s.uiHidden,s.selection,n]);
 useEffect(()=>useEditor.subscribe(state=>{if(proof.current&&!sameColorContext(proof.current,state))proof.current=null;}),[]);
 const change=(patch:Partial<StrokeStyle>)=>{try{const live=useEditor.getState(),nodes=live.doc.pages.find(p=>p.id===live.pageId)?.nodes??[];if(blocked||!proof.current||!sameColorContext(proof.current,live)||nodes.find(v=>v.id===n.id)!==n||isLocked(n,nodes)||managedLayer(n,nodes))throw Error('The stroke target changed. Select one unlocked source box in Design mode with Motion closed.');validateEdgeStrokeStyle({...stroke,...patch});if(patch.edgeWidths){if(issue)throw Error(issue);}onChange(patch);setError('');}catch(e){setError(e instanceof Error?e.message:'Edge stroke could not be changed.');}};
 return <section aria-label={prefix+' independent edges'}><label className="check-row"><input type="checkbox" aria-label={prefix+' independent edges'} checked={!!stroke.edgeWidths} disabled={!!blocked||!stroke.edgeWidths&&!!(issue||lineIssue)} onChange={e=>change({edgeWidths:e.target.checked?[stroke.width,stroke.width,stroke.width,stroke.width]:undefined})}/>Independent edge widths</label>{stroke.edgeWidths?<><div className="field-grid">{edgeNames.map((name,i)=><fieldset key={name} disabled={!!blocked} style={{border:0,padding:0,margin:0,minWidth:0}}><NumberField label={`${prefix} ${name.toLowerCase()} width`} value={stroke.edgeWidths![i]} min={0} max={1e6} onChange={v=>{const widths=[...stroke.edgeWidths!] as EdgeWidths;widths[i]=v;change({edgeWidths:widths});}}/></fieldset>)}</div><p className="inspector-note">One paint across four square edges. Zero hides an edge. Oversized inward widths consume the interior proportionally. Turning this off restores the ordinary width ({stroke.width}).</p></>:(issue||lineIssue)&&<p className="inspector-note">{issue||lineIssue}</p>}{error&&<p role="alert">{error}</p>}</section>;
}
