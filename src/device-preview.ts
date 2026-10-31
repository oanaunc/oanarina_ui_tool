import type {DesignDocument} from './model';
import {createResizePreview,boundedFrameOverflow} from './responsive-preview';
import {framePresets} from './frame-presets';
import type {FramePreset} from './frame-presets';
/** Read-only side-by-side device reflow. Each slot derives its own private copy through the shared resize preview, so nothing here reaches the document. */
export const DEVICE_SLOT_LIMIT=6;
export interface DeviceSlot {id:string;name:string;width:number;height:number;}
export const deviceCatalog:readonly FramePreset[]=framePresets.filter(p=>['Desktop','Phone','Tablet','Foldable','Watch','Archive'].includes(p.category));
export const slotFromPreset=(p:FramePreset):DeviceSlot=>({id:p.id,name:p.name,width:p.width,height:p.height});
export const defaultDeviceSlots=():DeviceSlot[]=>['phone','tablet','desktop'].flatMap(id=>{const p=framePresets.find(p=>p.id===id);return p?[slotFromPreset(p)]:[];});
export function validateDeviceSlot(slot:DeviceSlot){if(!slot||typeof slot.name!=='string'||![slot.width,slot.height].every(v=>Number.isFinite(v)&&v>=1&&v<=1e6))throw Error('Enter a device size from 1 to 1,000,000 px.');return slot;}
export interface DeviceResult {slot:DeviceSlot;error?:string;width:number;height:number;clippedLayers:number;document?:DesignDocument;}
/** A refused device reports its own error, so one impossible size never hides the others. */
export function deviceResult(doc:DesignDocument,pageId:string,frameId:string,slot:DeviceSlot):DeviceResult{try{validateDeviceSlot(slot);const preview=createResizePreview(doc,pageId,frameId,{width:slot.width,height:slot.height}),overflow=boundedFrameOverflow(preview.document,pageId,frameId);return {slot,width:preview.resolved.width,height:preview.resolved.height,clippedLayers:overflow.entries.length,document:preview.document};}catch(e){return {slot,width:slot.width,height:slot.height,clippedLayers:0,error:e instanceof Error?e.message:'This size cannot be previewed.'};}}
export const fitScale=(width:number,height:number,box:{width:number;height:number})=>Math.min(1,box.width/Math.max(1,width),box.height/Math.max(1,height));
