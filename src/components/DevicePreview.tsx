import {useMemo,useState} from 'react';
import {useEditor} from '../store';
import {layerPreviewGeometry,layerPreviewIndex} from '../layer-thumbnail';
import {framePreviewImage} from './frame-preview-image';
import {defaultDeviceSlots,deviceCatalog,deviceResult,DEVICE_SLOT_LIMIT,fitScale,slotFromPreset} from '../device-preview';
import type {DeviceSlot} from '../device-preview';
import './local-tools.css';
const VIEW={width:320,height:420};
function DeviceCard({slot,frameId,remove}:{slot:DeviceSlot;frameId:string;remove:()=>void}){
 const s=useEditor(),result=useMemo(()=>{const r=deviceResult(s.doc,s.pageId,frameId,slot);if(r.error||!r.document)return {r,image:''};try{const page=r.document.pages.find(p=>p.id===s.pageId)!;return {r,image:framePreviewImage(layerPreviewGeometry(layerPreviewIndex(page.nodes),frameId),r.width,r.height)};}catch(e){return {r:{...r,error:e instanceof Error?e.message:'This size cannot be drawn.'},image:''};}},[s.doc,s.pageId,frameId,slot]),{r,image}=result,scale=fitScale(r.width,r.height,VIEW);
 return <figure className="device-card"><figcaption><strong>{slot.name}</strong><small>{Math.round(r.width)} × {Math.round(r.height)}{!r.error&&' · '+Math.round(scale*100)+'%'}</small><button aria-label={'Remove '+slot.name} onClick={remove}>Remove</button></figcaption>{r.error?<p role="status" className="tool-warning">{r.error}</p>:<><img alt={slot.name+' preview'} src={image} width={Math.max(1,Math.round(r.width*scale))} height={Math.max(1,Math.round(r.height*scale))}/>{r.clippedLayers>0&&<small>{r.clippedLayers} layers overflow this size.</small>}</>}</figure>;
}
export default function DevicePreview(){
 const s=useEditor(),page=s.doc.pages.find(p=>p.id===s.pageId)!,frames=useMemo(()=>page.nodes.filter(n=>n.type==='frame'),[page]),selected=frames.find(n=>s.selection.includes(n.id)),[frameId,setFrameId]=useState(selected?.id??frames.find(n=>!n.parentId)?.id??''),[slots,setSlots]=useState<DeviceSlot[]>(defaultDeviceSlots),[custom,setCustom]=useState({width:'600',height:'800'}),[notice,setNotice]=useState(''),frame=frames.find(n=>n.id===frameId);
 const add=(slot:DeviceSlot)=>{if(slots.length>=DEVICE_SLOT_LIMIT){setNotice('Compare up to '+DEVICE_SLOT_LIMIT+' sizes at once.');return;}if(slots.some(x=>x.id===slot.id)){setNotice(slot.name+' is already shown.');return;}setNotice('');setSlots([...slots,slot]);};
 if(s.doc.workspace&&s.doc.workspace!=='design')return <p role="status">Device previews work on Design frames. Open a Design file.</p>;
 if(!frames.length)return <p role="status">Add a frame to this page to preview it on devices.</p>;
 return <div className="local-tool device-preview">
  <p className="dialog-description">Reflows one frame at several sizes side by side, through the same constraints and auto layout as the canvas. This is a static preview: it never changes the document, and prototypes do not run here.</p>
  <div className="tool-row"><label className="tool-field">Frame<select aria-label="Preview frame" value={frameId} onChange={e=>setFrameId(e.target.value)}>{frames.map(n=><option key={n.id} value={n.id}>{n.name}</option>)}</select></label><label className="tool-field">Add device<select aria-label="Add device" value="" onChange={e=>{const p=deviceCatalog.find(p=>p.id===e.target.value);if(p)add(slotFromPreset(p));}}><option value="">Choose a device…</option>{deviceCatalog.map(p=><option key={p.id} value={p.id}>{p.name} · {p.width} × {p.height}</option>)}</select></label><label className="tool-field">Width<input aria-label="Custom width" type="number" min={1} max={1000000} value={custom.width} onChange={e=>setCustom({...custom,width:e.target.value})}/></label><label className="tool-field">Height<input aria-label="Custom height" type="number" min={1} max={1000000} value={custom.height} onChange={e=>setCustom({...custom,height:e.target.value})}/></label><button onClick={()=>add({id:crypto.randomUUID(),name:'Custom',width:Number(custom.width),height:Number(custom.height)})}>Add size</button></div>
  {notice&&<p role="status">{notice}</p>}
  {frame?<div className="device-row" aria-label="Device previews">{slots.map(slot=><DeviceCard key={slot.id+frameId} slot={slot} frameId={frameId} remove={()=>setSlots(slots.filter(x=>x!==slot))}/>)}{!slots.length&&<p className="small-note">Add a device to compare.</p>}</div>:<p role="status">Choose a frame.</p>}
 </div>;
}
