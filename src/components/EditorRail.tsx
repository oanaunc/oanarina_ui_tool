import {useRef} from 'react';
import type {ReactNode} from 'react';
import {Braces,Component,Layers,Wrench} from 'lucide-react';
import {LocalPluginsButton} from './LocalPlugins';
import {commands,runCommand} from '../commands';
import {resolveVariable} from '../design-systems';
import type {DesignDocument} from '../model';
import {activeRailEntry,chooseRailEntry,railEntries,railKeyTarget,railToolCommands,useEditorRail} from '../editor-rail';
import type {RailEntry} from '../editor-rail';
import {useEditor} from '../store';
const details:Record<RailEntry,{label:string;Icon:typeof Layers}>={file:{label:'File',Icon:Layers},assets:{label:'Assets',Icon:Component},tools:{label:'Tools',Icon:Wrench},variables:{label:'Variables',Icon:Braces}};
const VARIABLE_ROWS=200;
function ToolsPanel(){return <div className="editor-rail-view"><h2>Tools</h2><p>Open the local tools in this app.</p><div className="editor-rail-list">{railToolCommands.map(id=>commands.find(c=>c[0]===id)).filter(c=>!!c).map(c=><button key={c[0]} onClick={()=>runCommand(c[0])}>{c[1]}</button>)}<LocalPluginsButton/></div></div>;}
function variableValue(doc:DesignDocument,id:string){try{return String(resolveVariable(doc,id).value);}catch{return 'Unresolved';}}
function VariablesPanel(){const doc=useEditor(v=>v.doc),collections=doc.variableCollections??[],variables=doc.variables??[];let shown=0;
 return <div className="editor-rail-view"><h2>Variables</h2>{!collections.length&&<p>This file has no variables yet.</p>}{collections.map(c=>{const rows=variables.filter(v=>v.collectionId===c.id),visible=rows.slice(0,Math.max(0,VARIABLE_ROWS-shown));shown+=visible.length;return <section key={c.id} aria-label={c.name+' variables'}><h3>{c.name}<small>{c.modes.length} {c.modes.length===1?'mode':'modes'}</small></h3>{visible.length>0&&<ul>{visible.map(v=>{const value=variableValue(doc,v.id);return <li key={v.id}><span>{v.name}</span><small>{v.type==='color'&&<i aria-hidden="true" style={{background:/^#[\da-f]{3,8}$/i.test(value)?value:'transparent'}}/>}{value}</small></li>;})}</ul>}{rows.length>visible.length&&<p>{rows.length-visible.length} more in Variables and modes.</p>}</section>;})}<button className="outline-button" onClick={()=>runCommand('variables')}>Open Variables and modes…</button></div>;}
/** Lives inside the left sidebar so the canvas keeps its position and the existing File and Assets tabs keep working. */
export default function EditorRail({children}:{children:ReactNode}){const leftTab=useEditor(v=>v.leftTab),overlay=useEditorRail(v=>v.overlay),active=activeRailEntry(overlay,leftTab),tabs=useRef<Partial<Record<RailEntry,HTMLButtonElement|null>>>({});
 return <><div className="editor-rail" role="tablist" aria-label="Editor navigation" aria-orientation="vertical">{railEntries.map((entry,i)=>{const {label,Icon}=details[entry];return <button key={entry} ref={el=>{tabs.current[entry]=el;}} role="tab" id={'editor-rail-'+entry} aria-label={label+' panel'} title={label} aria-selected={active===entry} aria-controls={overlay?'editor-rail-view':'editor-rail-panels'} tabIndex={active===entry?0:-1} className={active===entry?'active':''} onClick={()=>chooseRailEntry(entry)} onKeyDown={e=>{if(e.metaKey||e.ctrlKey||e.altKey||e.shiftKey)return;if(e.key===' '||e.key==='Enter'){e.stopPropagation();return;}const next=railKeyTarget(e.key,i,railEntries.length);if(next===null)return;e.preventDefault();e.stopPropagation();chooseRailEntry(railEntries[next]);tabs.current[railEntries[next]]?.focus();}}><Icon size={15}/></button>;})}</div>
 <div id="editor-rail-panels" className="editor-rail-panels" hidden={!!overlay}>{children}</div>
 {overlay&&<div id="editor-rail-view" className="editor-rail-overlay panel" role="tabpanel" aria-labelledby={'editor-rail-'+overlay}>{overlay==='tools'?<ToolsPanel/>:<VariablesPanel/>}</div>}</>;
}
