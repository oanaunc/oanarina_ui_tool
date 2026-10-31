import {create} from 'zustand';
import {useEditor} from './store';
export type RailEntry='file'|'assets'|'tools'|'variables';
export const railEntries:readonly RailEntry[]=['file','assets','tools','variables'];
/** Command ids from the existing menus. Listed commands open their existing dialogs and panels. */
export const railToolCommands=['actions','fonts','icons','templates','components','styles','colors','asset-usage','mcp'];
/** Tools and Variables replace the left panel in view only. File and Assets stay the editor's own leftTab. */
export const useEditorRail=create<{overlay:'tools'|'variables'|null}>(()=>({overlay:null}));
export function chooseRailEntry(entry:RailEntry){if(!railEntries.includes(entry))throw Error('Unknown navigation entry.');if(entry==='tools'||entry==='variables'){useEditorRail.setState({overlay:entry});return;}useEditorRail.setState({overlay:null});useEditor.getState().set({leftTab:entry==='file'?'layers':'assets'});}
export const activeRailEntry=(overlay:'tools'|'variables'|null,leftTab:'layers'|'assets'):RailEntry=>overlay??(leftTab==='layers'?'file':'assets');
/** Arrow, Home and End rove within the vertical list. Other keys return null. */
export function railKeyTarget(key:string,index:number,count:number){if(key==='ArrowDown')return (index+1)%count;if(key==='ArrowUp')return (index-1+count)%count;if(key==='Home')return 0;if(key==='End')return count-1;return null;}
useEditor.subscribe((s,p)=>{if((s.leftTab!==p.leftTab||s.doc.id!==p.doc.id)&&useEditorRail.getState().overlay)useEditorRail.setState({overlay:null});});
