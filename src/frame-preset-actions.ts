import {captureColorContext,sameColorContext} from './color-edit-context';
import type {ColorEditContext} from './color-edit-context';
import {drawingDefaults} from './preferences';
import {node} from './model';
import {useEditor} from './store';
export const FRAME_PRESET_INSERT_LIMITS={layers:20_000,frames:2,dimension:1_000_000} as const;
export interface FramePresetSize {name:string;width:number;height:number;}
export function framePresetInsertionAvailable(s=useEditor.getState()){return s.mode==='design'&&!s.home&&!s.uiHidden&&!s.motionOpen&&!s.modal&&s.doc.workspace!=='slides'&&s.doc.pages.some(p=>p.id===s.pageId);}
/** Ordinary top-level frames. Selection is never a destination, including locked/managed selections. */
export function insertFramePresetFrames(sizes:readonly FramePresetSize[],origin:ColorEditContext=captureColorContext(useEditor.getState())){
 const s=useEditor.getState();if(!sameColorContext(origin,s)||!framePresetInsertionAvailable(s))throw Error('The frame preset source changed. Use the visible Design canvas with Motion and dialogs closed.');
 if(!Array.isArray(sizes)||!sizes.length||sizes.length>2||sizes.some(p=>!p||typeof p.name!=='string'||!p.name.trim()||p.name.length>256||![p.width,p.height].every(v=>Number.isFinite(v)&&v>0&&v<=1e6)))throw Error('Insert one or two named frame presets with finite positive dimensions up to 1,000,000 px.');
 const page=s.doc.pages.find(p=>p.id===s.pageId)!;if(page.nodes.length+sizes.length>20_000)throw Error('Frame preset insertion supports at most 20,000 page layers.');
 let right=-Infinity;for(const n of page.nodes){const edge=n.x+n.width;if(!Number.isFinite(edge))throw Error('An existing layer has nonfinite placement bounds.');right=Math.max(right,edge);}
 let x=page.nodes.length?Math.ceil(right)+80:80;const frames=sizes.map(size=>{if(!Number.isFinite(x)||Math.abs(x)>1e6)throw Error('There is no room to place a frame within ±1,000,000 canvas pixels. Move existing layers closer to the origin.');const n=node('frame',{...drawingDefaults('frame'),name:size.name,x,y:100,width:size.width,height:size.height,parentId:null});x+=size.width+80;return n;});
 s.edit(d=>d.pages.find(p=>p.id===origin.pageId)!.nodes.push(...frames),d=>{const map=new Map(d.pages.find(p=>p.id===origin.pageId)!.nodes.map(n=>[n.id,n]));for(const frame of frames){const n=map.get(frame.id);if(!n||n.type!=='frame'||n.parentId!==null||['name','x','y','width','height'].some(k=>n[k as keyof typeof n]!==frame[k as keyof typeof frame]))throw Error('Document layout controls this preset placement. No frame was inserted.');}});
 s.set({selection:frames.map(n=>n.id),vectorEditId:null,vectorSelection:[]});if(typeof document!=='undefined')useEditor.getState().fit(true);return frames.map(n=>n.id);
}
