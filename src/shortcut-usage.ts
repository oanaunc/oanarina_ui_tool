import type {DesignDocument,DesignNode} from './model';
/** Session-only named editor keyboard dispatches. Never stores typed keys or project data. */
export interface ShortcutUse {id:string;binding:string;provenance:'editor-keydown';count:number;order:number;}
export const SHORTCUT_USAGE_LIMIT=64;
let recent:readonly ShortcutUse[]=Object.freeze([]),serial=0;
const listeners=new Set<()=>void>();
export function getShortcutUsage(){return recent;}
export function subscribeShortcutUsage(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function recordShortcutUse(id:string,binding:string){if(!/^[a-z][a-z0-9-]{0,95}$/.test(id)||!binding||binding.length>80)return;const old=recent.find(r=>r.id===id);recent=Object.freeze([{id,binding,provenance:'editor-keydown' as const,count:Math.min(999,(old?.count??0)+1),order:++serial},...recent.filter(r=>r.id!==id)].slice(0,SHORTCUT_USAGE_LIMIT));for(const listener of listeners)try{listener();}catch{/* Help observers cannot interrupt keyboard dispatch. */}}
export function clearShortcutUsage(){if(!recent.length)return;recent=Object.freeze([]);serial=0;for(const listener of listeners)try{listener();}catch{/* See recordShortcutUse. */}}
export interface ShortcutHelpRow {id:string;label:string;category:string;binding:string;note?:string;}
export const contextualShortcutRows:readonly ShortcutHelpRow[]=[
 {id:'context-hand',label:'Temporary Hand pan',category:'Canvas',binding:'Space + drag',note:'Hold Space and drag the canvas. Counts only completed pans that change the camera.'},
 {id:'context-nudge',label:'Nudge selected layers',category:'Canvas',binding:'Arrow keys / ⇧Arrow keys',note:'Uses the configured small / large nudge distance. Counts only when layers move.'},
 {id:'context-opacity',label:'Set selection opacity',category:'Canvas',binding:'1–9 / 0',note:'10–90% / 100%; requires number-key opacity preference and an unlocked selection.'},
 {id:'context-vector-finish',label:'Finish vector point editing',category:'Vector',binding:'Enter / Esc',note:'Within an active vector editing session.'},
 {id:'context-edit-selection',label:'Edit selected text or vector',category:'Canvas',binding:'Enter',note:'On the focused canvas, for a selected editable leaf.'},
];
export function shortcutHelpRows(commands:readonly (readonly [string,string,string,string])[]):ShortcutHelpRow[]{return [...commands.filter(c=>c[3]).map(([id,label,category,binding])=>({id,label,category,binding,...(id==='actions'?{note:'Command / is also supported.'}:{})})),...contextualShortcutRows];}
export function filterShortcutHelp(rows:readonly ShortcutHelpRow[],category:string,query:string,recentOnly:boolean,usage:readonly ShortcutUse[]){const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean).slice(0,20),used=new Set(usage.map(r=>r.id));return rows.filter(r=>(category==='All'||r.category===category)&&(!recentOnly||used.has(r.id))&&words.every(w=>(r.label+' '+r.category+' '+r.binding+' '+(r.note??'')).toLowerCase().includes(w)));}

export function shortcutSelectionChanged(before:DesignDocument,after:DesignDocument,ids:readonly string[],fields:readonly (keyof DesignNode)[]){if(before===after||!ids.length)return false;const selected=new Set(ids),old=new Map(before.pages.flatMap(p=>p.nodes).filter(n=>selected.has(n.id)).map(n=>[n.id,n]));return after.pages.some(p=>p.nodes.some(n=>selected.has(n.id)&&old.has(n.id)&&fields.some(field=>old.get(n.id)![field]!==n[field])));}
export function shortcutHelpCategories(rows:readonly ShortcutHelpRow[]){const used=new Set(rows.map(r=>r.category)),order=['Tools','Canvas','File','Edit','Object','Text','Arrange','Vector','View','Page','Resources','Prototype','Help'];return ['All',...order.filter(name=>used.delete(name)),...[...used].sort()];}
