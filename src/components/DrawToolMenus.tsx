import {ChevronDown,Palette,Spline} from 'lucide-react';
import {runCommand} from '../commands';
import {useBrushLibrary} from '../brush-library';
import {builtInBrushes} from '../brush-presets';
import {notifyError} from '../files';
import {chooseBrushPreset,editVectorPoints,startShapeBuilder,startVectorTool} from '../illustration-tools';
import {t} from '../i18n';
import {useEditor} from '../store';
import './draw-tools.css';

export const BRUSH_MENU=100,ILLUSTRATION_MENU=101;
interface Props {open:number|null;focusProps:()=>Record<string,unknown>;show:(i:number,trigger:HTMLButtonElement)=>void;close:(restore?:boolean)=>void;current:()=>boolean;}
const tools:[string,()=>unknown][]=[['Edit points',editVectorPoints],['Bend segments',()=>startVectorTool('bend')],['Cut path',()=>startVectorTool('cut')],['Erase path',()=>startVectorTool('eraser')],['Lasso points',()=>startVectorTool('lasso')],['Shape builder',startShapeBuilder]];
const commands:[string,string][]=[['Offset vector path…','vector-offset'],['Outline vector stroke…','vector-outline-stroke'],['Separate vector regions…','vector-separate'],['Linear repeat…','linear-repeat'],['Radial repeat…','radial-repeat']];
/** Draw-only menus that reach existing tools; each entry runs the same guarded path as its inspector or menu control. */
export default function DrawToolMenus({open,focusProps,show,close,current}:Props){
 const library=useBrushLibrary(),selected=useEditor(s=>s.tool==='brush'),run=(fn:()=>unknown)=>{if(!current()){close();return;}close();try{fn();}catch(e){notifyError(e);}},menu=(id:number,label:string,choices:string,Icon:typeof Spline,items:React.ReactNode)=><div className="tool-group" data-toolbar-group={id} key={id}><button {...focusProps()} className="tool-arrow draw-menu-button" aria-label={t(label)} title={t(label)} aria-haspopup="menu" aria-expanded={open===id} onClick={e=>open===id?close():show(id,e.currentTarget)}><Icon size={17}/><ChevronDown size={10}/></button>{open===id&&<div className="tool-menu menu" role="menu" aria-label={t(choices)}>{items}</div>}</div>;
 return <>{menu(BRUSH_MENU,'Brush presets','Brush preset choices',Palette,[...builtInBrushes,...library.customs].map(p=><button role="menuitemradio" aria-checked={selected&&library.settings.id===p.id} tabIndex={-1} key={p.id} onClick={()=>run(()=>chooseBrushPreset(p.id))}><span>{p.name}</span><kbd>{p.stretch?t('Stretch'):''}</kbd></button>))}{menu(ILLUSTRATION_MENU,'Illustration tools','Illustration tool choices',Spline,<>{tools.map(([label,action])=><button role="menuitem" tabIndex={-1} key={label} onClick={()=>run(action)}><span>{t(label)}</span><kbd/></button>)}{commands.map(([label,id])=><button role="menuitem" tabIndex={-1} key={id} onClick={()=>run(()=>runCommand(id))}><span>{t(label)}</span><kbd/></button>)}</>)}</>;
}
