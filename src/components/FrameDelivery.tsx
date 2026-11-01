import {runCommand} from '../commands';
import {useMemo,useState} from 'react';
import {useEditor} from '../store';
import {isLocked} from '../model';
import {sampleMotion} from '../motion';
import {frameStartingPointIssue,planFrameStartingPoint} from '../frame-delivery';
import {LayerExportSettings} from './LayerExports';
import {boundedFrameOverflow} from '../responsive-preview';
import {framePreviewImage} from './frame-preview-image';
import {captureColorContext,sameColorContext} from '../color-edit-context';

export function FrameOverflowInspector({id}:{id:string}){
 const s=useEditor(),page=s.doc.pages.find(p=>p.id===s.pageId)!,[open,setOpen]=useState(false);
 const result=useMemo(()=>{if(!open)return {};try{const nodes=s.motionOpen?sampleMotion(page.nodes,page.motion,s.motionTime):page.nodes;const value=boundedFrameOverflow({...s.doc,pages:s.doc.pages.map(p=>p.id===page.id?{...p,nodes}:p)},page.id,id);return {value,image:framePreviewImage(value,value.frame.width,value.frame.height)};}catch(error){return {error:error instanceof Error?error.message:'Frame inspection failed.'};}},[open,page,id,s.doc,s.motionOpen,s.motionTime,s.fontRevision]);
 const value=result.value;
 return <details className="inspector-section" onToggle={e=>setOpen(e.currentTarget.open)}><summary>Inspect frame overflow</summary>{open&&<>{result.error?<p role="status" className="inspector-note">{result.error}</p>:value&&<><p className="inspector-note">{value.entries.length} potential overflowing layer{value.entries.length===1?'':'s'}. Preview only: this frame’s clip is disabled; saved artwork is unchanged.</p><img alt="Frame overflow preview" src={result.image} style={{width:'100%',height:160,objectFit:'contain',background:'var(--canvas, #25232b)'}}/><p className="inspector-note">Painted rectangular bounds include strokes and effects, and stop at nested clips and masks. Curved shapes count by their box, and layers on top are not considered.</p>{value.entries.length>0&&<><button className="outline-button" onClick={()=>{const live=useEditor.getState();if(sameColorContext(captureColorContext(s),live))live.set({selection:value.entries.map(e=>e.id),vectorEditId:null,vectorSelection:[]});}}>Select potential overflowing layers</button>{value.entries.slice(0,100).map(entry=><button className="prototype-search-result" key={entry.id} onClick={()=>{const live=useEditor.getState();if(!sameColorContext(captureColorContext(s),live))return;live.set({selection:[entry.id],vectorEditId:null,vectorSelection:[]});live.fit(true);}}>{entry.name} · {Object.entries({left:entry.left,top:entry.top,right:entry.right,bottom:entry.bottom}).filter(([,v])=>v>1e-6).map(([side,v])=>`${side} ${Math.ceil(v)} px`).join(', ')}</button>)}{value.entries.length>100&&<p className="inspector-note">Showing the first 100 of {value.entries.length} candidates; Select includes all candidates.</p>}</>}</>}</>}</details>;
}
export function FramePrototypeStart({id}:{id:string}){
 const s=useEditor(),page=s.doc.pages.find(p=>p.id===s.pageId)!,frame=page.nodes.find(n=>n.id===id),[error,setError]=useState(''),issue=frameStartingPointIssue(s.doc,page,id),locked=!!frame&&isLocked(frame,page.nodes),first=page.flows?.[0],current=first?.frameId===id;
 const run=(fn:()=>void)=>{try{fn();setError('');}catch(error){setError(error instanceof Error?error.message:'Starting point could not be changed.');}};
 return <section className="inspector-section" aria-label="Frame prototype starting point"><h3>Prototype starting point</h3>{issue?<p className="inspector-note">{issue}</p>:<>{current&&<p className="inspector-note">Default flow: {first.name}</p>}<button className="outline-button" title="Make this frame the default starting flow. Existing flows are retained." disabled={locked||current} onClick={()=>run(()=>s.edit(d=>{const page=d.pages.find(p=>p.id===s.pageId)!;page.flows=planFrameStartingPoint(d,page,id);}))}>{current?'Default starting frame':'Set as default prototype start'}</button><button className="outline-button" onClick={()=>run(()=>{const issue=frameStartingPointIssue(s.doc,page,id);if(issue)throw Error(issue);s.set({selection:[id]});runCommand('present');})}>Present from this frame</button>{locked&&<p className="inspector-note">Unlock the frame and its ancestors to change its starting flow. Presentation is read-only.</p>}</>}{error&&<p role="alert" className="layer-tree-error">{error}</p>}</section>;
}
export function FrameExportSettings({id,dialog=false}:{id:string;dialog?:boolean}){return <LayerExportSettings id={id} dialog={dialog}/>;}
