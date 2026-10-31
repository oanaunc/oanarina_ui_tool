import ActionComponentSearch from './ActionComponentSearch';
import ActionPluginSearch from './ActionPluginSearch';
import {ActionWidgetSearch} from './LocalWidgets';
import {useEditor} from '../store';
import {shortcutLabel,useKeyboardPreferences} from '../keyboard-preferences';
import {useEffect,useId,useMemo,useRef,useState,useSyncExternalStore} from 'react';
import {Search} from 'lucide-react';
import {commands,runCommand} from '../commands';
import {clearRecentActions,getRecentActions,subscribeActionHistory} from '../action-history';
import {frequentCommands,getCommandUsage,subscribeCommandUsage} from '../command-usage';
import {moveActiveAction,searchActions} from '../action-search';
import type {PaletteCommand} from '../action-search';
import './action-palette.css';
function CommandActions({onClose,valid}:{onClose:()=>void;valid:()=>boolean}){
 const keyboard=useKeyboardPreferences(commands),commandRows=useMemo(()=>commands.map(c=>[c[0],c[1],c[2],shortcutLabel(c,keyboard)] as const),[keyboard]);
 const [query,setQuery]=useState(''),[category,setCategory]=useState('All'),[active,setActive]=useState(0);
 const usage=useSyncExternalStore(subscribeCommandUsage,getCommandUsage,getCommandUsage),recent=useSyncExternalStore(subscribeActionHistory,getRecentActions,getRecentActions),listId=useId(),hintId=useId(),input=useRef<HTMLInputElement>(null),list=useRef<HTMLDivElement>(null);
 const groups=useMemo(()=>[...new Set(commands.map(c=>c[2]))],[]);
 const sections=useMemo(()=>{
  const matching=searchActions(commandRows,query),byId=new Map(matching.map(c=>[c[0],c])),recents=recent.flatMap(id=>byId.has(id)?[byId.get(id)!]:[]);
  if(category==='Recent')return[{label:'Recent actions',items:recents}];
  if(category!=='All')return[{label:category,items:matching.filter(c=>c[2]===category)}];
  if(query.trim())return[{label:'Search results',items:matching}];
  const recentIds=new Set(recents.map(c=>c[0])),frequent=(usage.enabled?frequentCommands(usage,matching.map(c=>c[0])):[]).filter(id=>!recentIds.has(id)).flatMap(id=>byId.has(id)?[byId.get(id)!]:[]),shown=new Set([...recentIds,...frequent.map(c=>c[0])]);return[{label:'Recent actions',items:recents},{label:'Frequently used',items:frequent},...groups.map(label=>({label,items:matching.filter(c=>c[2]===label&&!shown.has(c[0]))}))].filter(section=>section.items.length);
 },[query,category,recent,groups,commandRows,usage]);
 const results=sections.flatMap(section=>section.items),index=results.length?Math.max(0,Math.min(active,results.length-1)):-1,selected=results[index];
 useEffect(()=>{input.current?.focus();},[]);
 useEffect(()=>{if(selected)list.current?.querySelector<HTMLElement>(`[data-action-id="${selected[0]}"]`)?.scrollIntoView({block:'nearest'});},[selected]);
 function run(command:PaletteCommand,event:Event){if(!valid())return;onClose();runCommand(command[0],event);}
 return <div className="action-palette">
  <div className="search-field large"><Search size={18}/><input ref={input} aria-label="Search actions" role="combobox" aria-expanded="true" aria-autocomplete="list" aria-controls={listId} aria-activedescendant={selected?`${listId}-${selected[0]}`:undefined} aria-describedby={hintId} placeholder="Search actions, categories or keywords…" value={query} onChange={e=>{setQuery(e.target.value);setActive(0);}} onKeyDown={e=>{
   if(e.nativeEvent.isComposing)return;
   if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose();return;}
   if(e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
   if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();setActive(moveActiveAction(index,e.key,results.length));}
   else if(e.key==='Enter'){e.preventDefault();e.stopPropagation();if(selected)run(selected,e.nativeEvent);}
  }}/><kbd>esc</kbd></div>
  <div className="action-palette-filter"><label htmlFor={`${listId}-category`}>Category</label><select id={`${listId}-category`} aria-label="Action category" value={category} onChange={e=>{setCategory(e.target.value);setActive(0);input.current?.focus();}}><option>All</option><option>Recent</option>{groups.map(group=><option key={group}>{group}</option>)}</select><button disabled={!recent.length} onClick={()=>{clearRecentActions();setActive(0);input.current?.focus();}}>Clear recent actions</button></div>
  <div ref={list} className="action-palette-results" id={listId} role="listbox" aria-label="Available actions">
   {sections.map(section=>!!section.items.length&&<div role="group" aria-label={section.label} key={section.label}><div className="action-palette-heading" aria-hidden="true">{section.label}</div>{section.items.map(command=><div id={`${listId}-${command[0]}`} key={command[0]} role="option" aria-selected={selected?.[0]===command[0]} aria-label={command[1]} data-action-id={command[0]} className="action-palette-option" onPointerMove={()=>setActive(results.indexOf(command))} onPointerDown={e=>{if(e.button===0)e.preventDefault();}} onClick={e=>run(command,e.nativeEvent)}><span className="action-palette-label">{command[1]}<small>{command[2]}</small></span>{command[3]&&<kbd aria-label={`Shortcut ${command[3]}`}>{command[3]}</kbd>}</div>)}</div>)}
  </div>
  {!results.length&&<p className="action-palette-empty" role="status">{category==='Recent'&&!query.trim()?'No recent actions yet. Run an action from the menus or here.':'No actions match. Try a different keyword or category.'}</p>}
  <p className="action-palette-hint" id={hintId}><span>{results.length} action{results.length===1?'':'s'}</span><span>↑ ↓ navigate · Home / End · Enter run · Esc close</span></p>
 </div>;
}

export default function ActionPalette({onClose}:{onClose:()=>void}){const [mode,setMode]=useState('commands'),session=useRef({mode:'commands'}),rendered=session.current,valid=()=>session.current===rendered&&useEditor.getState().modal==='actions',change=(next:string)=>{if(session.current.mode===next)return;session.current={mode:next};setMode(next);};return <><div className="action-palette-modes" role="group" aria-label="Actions search type"><button aria-pressed={mode==='commands'} onClick={()=>change('commands')}>Commands</button><button aria-pressed={mode==='components'} onClick={()=>change('components')}>Components</button><button aria-pressed={mode==='widgets'} onClick={()=>change('widgets')}>Widgets</button><button aria-pressed={mode==='plugins'} onClick={()=>change('plugins')}>Plugins</button></div><div role="region" aria-label={mode==='commands'?'Command search':mode==='widgets'?'Widget search':mode==='plugins'?'Plugin search':'Component search'}>{mode==='commands'?<CommandActions onClose={onClose} valid={valid}/>:mode==='widgets'?<ActionWidgetSearch onClose={onClose}/>:mode==='plugins'?<ActionPluginSearch onClose={onClose} validMode={valid}/>:<ActionComponentSearch onClose={onClose} validMode={valid}/>}</div></>;}
