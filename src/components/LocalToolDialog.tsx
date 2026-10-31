import {useEffect,useRef} from 'react';
import type {KeyboardEvent,ReactNode} from 'react';
import {X} from 'lucide-react';
import {useEditor} from '../store';
import DesignHealth from './DesignHealth';
import PrivacyDashboard from './PrivacyDashboard';
import BugReport from './BugReport';
import PaletteExchange from './PaletteExchange';
import BatchTransforms from './BatchTransforms';
import CodeExport from './CodeExport';
import ExportQueue from './ExportQueue';
import CommandUsage from './CommandUsage';
import WorkspaceLayouts from './WorkspaceLayouts';
import DevicePreview from './DevicePreview';
const tools:Record<string,{title:string;render:()=>ReactNode}>={
 'design-health':{title:'Design health report',render:()=><DesignHealth/>},
 'privacy-dashboard':{title:'Privacy dashboard',render:()=><PrivacyDashboard/>},
 'bug-report':{title:'Bug report bundle',render:()=><BugReport/>},
 'palette-exchange':{title:'Color palette exchange',render:()=><PaletteExchange/>},
 'batch-transforms':{title:'Batch transforms',render:()=><BatchTransforms/>},
 'code-export':{title:'Design-to-code export',render:()=><CodeExport/>},
 'export-queue':{title:'Export queue',render:()=><ExportQueue/>},
 'command-usage':{title:'Command usage',render:()=><CommandUsage/>},
 'workspace-layouts':{title:'Workspace layouts',render:()=><WorkspaceLayouts/>},
 'device-preview':{title:'Side-by-side device preview',render:()=><DevicePreview/>},
};
/** Left and Right move between tabs; Home and End jump to the ends. */
export function tabListKeys(e:KeyboardEvent<HTMLElement>){if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;const tabs=[...e.currentTarget.querySelectorAll<HTMLElement>('[role=tab]')],at=tabs.indexOf(document.activeElement as HTMLElement),next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(at+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;e.preventDefault();tabs[next]?.focus();tabs[next]?.click();}
export const isLocalToolModal=(modal:string)=>Object.hasOwn(tools,modal);
/** Shared shell for local audit and automation tools, so each stays out of the main dialog switch. */
export default function LocalToolDialog({modal}:{modal:string}){
 const s=useEditor(),root=useRef<HTMLDivElement>(null),tool=tools[modal],close=()=>s.set({modal:null});
 useEffect(()=>{root.current?.querySelector<HTMLElement>('select,input,textarea,button:not([aria-label="Close dialog"])')?.focus();},[modal]);
 return <div className="modal-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)close();}}><div ref={root} role="dialog" aria-modal="true" aria-label={tool.title} className="dialog wide-dialog" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}if(e.key==='Tab'){const list=[...e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')],first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}>
  <header className="dialog-header"><div><span className="eyebrow">OANARINA FORMA</span><h2>{tool.title}</h2></div><button aria-label="Close dialog" onClick={close}><X size={18}/></button></header>
  <div className="dialog-body">{tool.render()}</div>
 </div></div>;
}
