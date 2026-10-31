import {useEffect,useState} from 'react';
import type {DesignNode} from '../model';
import {editMotionPage} from '../motion-editor';
import {setKeyframe,timeline} from '../motion';
import {notifyError} from '../files';
import {setShaderPointer,shaderPointerAt} from '../shader-pointer';
import {findShader,nodeShaders,paramsFor,resolvedParams,shaderTrackProperty} from '../shaders';
import {useEditor} from '../store';
type Proof=Parameters<typeof editMotionPage>[0];
/** Keyframes the value shown at the playhead, so an existing track interpolates from what is on the canvas. */
export function ShaderKeyframeButtons({n,proof}:{n:DesignNode;proof:Proof}){const shaders=useEditor(s=>s.doc.shaders),rows=nodeShaders(n).flatMap(s=>{const d=findShader(s.binding.shaderId,{shaders});if(!d)return [];const values=resolvedParams(d,s.binding);return paramsFor(d,s.binding.version).map(p=>({key:s.id+p.key,label:`${d.name} ${p.label}`,property:shaderTrackProperty(s.slot,s.id,p.key),value:values[p.key]}));});if(!rows.length)return null;return <div className="shader-keyframes" aria-label="Shader parameter keyframes" role="group">{rows.map(r=><button key={r.key} onClick={()=>{try{const time=useEditor.getState().motionTime;editMotionPage(proof,p=>{p.motion??=timeline();setKeyframe(p,n.id,r.property,time,r.value);},[n.id]);}catch(error){notifyError(error);}}}>Keyframe {r.label}</button>)}</div>;}
/** Opt-in, because it re-renders the hovered layer's shader on every pointer move. */
export function ShaderPointerToggle(){const [on,setOn]=useState(false);useEffect(()=>{if(!on)return;const host=document.querySelector<SVGSVGElement>('#forma-design-canvas');if(!host)return;const size=(id:string)=>{const s=useEditor.getState();return s.doc.pages.find(p=>p.id===s.pageId)?.nodes.find(n=>n.id===id);},move=(e:PointerEvent)=>{setShaderPointer(e.target instanceof Element?shaderPointerAt(e.target,e.clientX,e.clientY,size):null);},leave=()=>setShaderPointer(null);host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);return ()=>{host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);setShaderPointer(null);};},[on]);return <label className="check-row"><input type="checkbox" aria-label="Interactive shader preview" checked={on} onChange={e=>setOn(e.target.checked)}/>Interactive shader preview</label>;}
