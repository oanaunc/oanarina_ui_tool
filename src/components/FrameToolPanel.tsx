import {captureColorContext} from '../color-edit-context';
import {notifyError} from '../files';
import {insertFramePresetFrames} from '../frame-preset-actions';
import {framePresetCategories,framePresets} from '../frame-presets';
import type {FramePreset,FramePresetCategory} from '../frame-presets';
import {getPreferences} from '../preferences';
import {useEditor} from '../store';
import './frame-preset-picker.css';
/** Open categories outlive the panel, so choosing the Frame tool again finds the list as it was left. */
const opened=new Set<FramePresetCategory>(['Phone']);
function place(preset:FramePreset){try{const live=useEditor.getState();insertFramePresetFrames([preset],captureColorContext(live));useEditor.getState().set({tool:getPreferences().keepDrawingTool?'frame':'move'});}catch(error){notifyError(error);}}
/** Shown while the Frame tool is active: one click places a named frame, and dragging on the canvas still draws one. */
export default function FrameToolPanel(){
 return <section className="frame-tool-panel" aria-label="Frame sizes" onKeyDown={e=>{if(!e.metaKey&&!e.ctrlKey&&!e.altKey&&['Enter',' '].includes(e.key)&&(e.target as HTMLElement).closest('button,summary'))e.stopPropagation();}}><h3>Frame</h3>{framePresetCategories.map(category=><details key={category} open={opened.has(category)} onToggle={e=>{if(e.currentTarget.open)opened.add(category);else opened.delete(category);}}><summary>{category}</summary>{framePresets.filter(p=>p.category===category).map(p=><button key={p.id} className="frame-tool-row" onClick={()=>place(p)}><span>{p.name}</span><small>{p.width}×{p.height}</small></button>)}</details>)}</section>;
}
