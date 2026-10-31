import {useState} from 'react';
import {useEditor} from '../store';
import {applyPanelLayout,readPanelLayout} from '../panel-layout';
import {getPreferences,updatePreferences} from '../preferences';
import {addWorkspaceLayout,readWorkspaceLayouts,writeWorkspaceLayouts} from '../workspace-layouts';
import type {WorkspaceLayout} from '../workspace-layouts';
import './local-tools.css';
const describe=(l:WorkspaceLayout)=>[l.panels.left.collapsed?'Layers hidden':l.panels.left.width?'Layers '+l.panels.left.width+' px':'Layers default',l.panels.right.collapsed?'Properties hidden':l.panels.right.width?'Properties '+l.panels.right.width+' px':'Properties default',l.view.leftTab==='assets'?'Assets tab':'',l.view.rulers?'rulers':'',l.view.grid?'pixel grid':'',l.view.outlines?'outlines':'',l.view.minimap?'minimap':'',l.view.scrollbars?'scrollbars':''].filter(Boolean).join(' · ');
export default function WorkspaceLayouts(){
 const s=useEditor(),[{layouts,warning},setState]=useState(readWorkspaceLayouts),[name,setName]=useState(''),[error,setError]=useState(warning),[message,setMessage]=useState('');
 const capture=(id:string,label:string):WorkspaceLayout=>{const prefs=getPreferences();return {id,name:label,panels:readPanelLayout().layout,view:{leftTab:s.leftTab,rulers:s.rulers,grid:s.grid,outlines:s.outlines,minimap:prefs.showOverviewMinimap,scrollbars:prefs.showCanvasScrollbars}};};
 const commit=(next:WorkspaceLayout[])=>{writeWorkspaceLayouts(next);setState({layouts:next,warning:''});setError('');};
 const attempt=(run:()=>void)=>{try{run();}catch(e){setError(e instanceof Error?e.message:'This layout could not be changed.');setMessage('');}};
 const apply=(l:WorkspaceLayout)=>attempt(()=>{const live=applyPanelLayout(l.panels);s.set({leftTab:l.view.leftTab,rulers:l.view.rulers,grid:l.view.grid,outlines:l.view.outlines});updatePreferences({showOverviewMinimap:l.view.minimap,showCanvasScrollbars:l.view.scrollbars});setMessage('“'+l.name+'” applied.'+(live?'':' Sidebars update when you next open a Design file.'));});
 return <div className="local-tool workspace-layouts">
  <p className="dialog-description">Save the current sidebars, left tab and canvas view aids under a name, then switch between them. Layouts stay on this device and never change a document.</p>
  {error&&<p role="alert" className="tool-warning">{error}</p>}{message&&<p role="status">{message}</p>}
  <form className="tool-row" onSubmit={e=>{e.preventDefault();attempt(()=>{commit(addWorkspaceLayout(layouts,capture(crypto.randomUUID(),name)));setName('');setMessage('Layout saved.');});}}><label className="tool-field">Layout name<input aria-label="Workspace layout name" maxLength={80} value={name} onChange={e=>setName(e.target.value)}/></label><button className="primary-button" type="submit" disabled={!name.trim()}>Save current layout</button></form>
  {layouts.length?<ul className="tool-list" aria-label="Saved workspace layouts">{layouts.map(l=><li key={l.id}><span>{l.name}<small>{describe(l)}</small></span><button onClick={()=>apply(l)}>Apply {l.name}</button><button aria-label={'Update '+l.name+' from the current layout'} onClick={()=>attempt(()=>{commit(layouts.map(x=>x.id===l.id?capture(l.id,l.name):x));setMessage('“'+l.name+'” updated.');})}>Update</button><button aria-label={'Delete '+l.name} onClick={()=>attempt(()=>{commit(layouts.filter(x=>x.id!==l.id));setMessage('“'+l.name+'” deleted.');})}>Delete</button></li>)}</ul>:<p className="small-note">No saved layouts yet.</p>}
 </div>;
}
