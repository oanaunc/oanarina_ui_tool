import {runCommand} from '../commands';
import {useState} from 'react';
import {MousePointer2,Frame,Square,Circle,Minus,ArrowUpRight,Hexagon,Star,PenTool,Pencil,Paintbrush,Type,Hand,Scaling,MessageCircle,Plus,ChevronDown,Scan,SquareDashed,Code2,Search} from 'lucide-react';
import type {Tool} from '../model';
import {useEditor} from '../store';
const groups:[string,Tool,typeof Square,string][][]=[
 [['Move','move',MousePointer2,'V'],['Hand','hand',Hand,'H'],['Scale','scale',Scaling,'K']],
 [['Frame','frame',Frame,'F'],['Section','section',SquareDashed,'⇧S'],['Slice','slice',Scan,'S']],
 [['Rectangle','rectangle',Square,'R'],['Ellipse','ellipse',Circle,'O'],['Line','line',Minus,'L'],['Arrow','arrow',ArrowUpRight,'⇧L'],['Polygon','polygon',Hexagon,''],['Star','star',Star,'']],
 [['Pen','pen',PenTool,'P'],['Pencil','pencil',Pencil,'⇧P'],['Brush','brush',Paintbrush,'']],
 [['Text','text',Type,'T']], [['Comment','comment',MessageCircle,'C']]
];
export default function Toolbar(){const s=useEditor(),[open,setOpen]=useState<number|null>(null);return <div className="toolbar" role="toolbar" aria-label="Design tools">
 {groups.map((group,i)=>{const active=group.find(t=>t[1]===s.tool)||(i===2?group.find(t=>t[1]===s.lastShapeTool):undefined)||group[0],[label,tool,Icon,key]=active;return <div className="tool-group" key={i}>
 <button aria-label={label+' tool'} title={label+' · '+key} className={s.tool===tool?'active':''} onClick={()=>tool==='brush'?runCommand('tool-brush'):s.set({tool})}><Icon size={19}/></button>
 {group.length>1&&<button className="tool-arrow" aria-label={label+' tool options'} onClick={()=>setOpen(open===i?null:i)}><ChevronDown size={10}/></button>}
 {open===i&&<div className="tool-menu menu">{group.map(([label,tool,Icon,key])=><button key={tool} onClick={()=>{if(tool==='brush')runCommand('tool-brush');else s.set({tool});setOpen(null);}}><Icon size={15}/><span>{label}</span><kbd>{key}</kbd></button>)}{i===2&&<button onClick={()=>{runCommand('repeat-shape-tool');setOpen(null);}}><span>Repeat last shape tool</span><kbd>⌥R</kbd></button>}</div>}
 </div>;})}<span className="toolbar-divider"/><button aria-label="Motion mode" className={s.motionOpen?'active':''} onClick={()=>s.set({motionOpen:!s.motionOpen,motionPlaying:false})}>Motion</button><button title="Actions · ⌘K" aria-label="Actions" onClick={()=>s.set({modal:'actions'})}><Search size={18}/></button><button className={'dev-toggle '+(s.mode==='inspect'?'active':'')} aria-label="Dev Mode" title="Dev Mode · ⇧D" onClick={()=>s.set({mode:s.mode==='inspect'?'design':'inspect'})}><Code2 size={18}/></button><button aria-label="Insert resources" title="Resources" onClick={()=>s.set({leftTab:'assets'})}><Plus size={18}/></button>
 </div>;}
