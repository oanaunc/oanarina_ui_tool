/** Opt-in, device-local command counts. Only command IDs and tallies are kept, never project data or typed keys. */
export const COMMAND_USAGE_KEY='forma-command-usage-v1';
export const COMMAND_USAGE_LIMIT=512;
export interface CommandCount {runs:number;shortcutRuns:number;lastDay:string;}
export interface CommandUsage {version:1;enabled:boolean;commands:Readonly<Record<string,CommandCount>>;}
const empty:CommandUsage=Object.freeze({version:1,enabled:false,commands:Object.freeze({})}),validId=(id:unknown):id is string=>typeof id==='string'&&/^[a-z][a-z0-9-]{0,95}$/.test(id)&&id!=='actions';
export function parseCommandUsage(raw:string|null):CommandUsage{
 if(!raw||raw.length>200000)return empty;
 try{const v=JSON.parse(raw);if(!v||v.version!==1||typeof v.enabled!=='boolean'||!v.commands||typeof v.commands!=='object'||Array.isArray(v.commands))return empty;const commands:Record<string,CommandCount>={},entries=Object.entries(v.commands as Record<string,CommandCount>);if(entries.length>COMMAND_USAGE_LIMIT)return empty;for(const [id,c] of entries){if(!validId(id)||!c||!Number.isSafeInteger(c.runs)||c.runs<1||!Number.isSafeInteger(c.shortcutRuns)||c.shortcutRuns<0||c.shortcutRuns>c.runs||typeof c.lastDay!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(c.lastDay))return empty;commands[id]={runs:c.runs,shortcutRuns:c.shortcutRuns,lastDay:c.lastDay};}return {version:1,enabled:v.enabled,commands};}catch{return empty;}
}
let cached:CommandUsage|undefined,lastRaw:string|null|undefined;const listeners=new Set<()=>void>();
const read=()=>{try{return typeof localStorage==='undefined'?null:localStorage.getItem(COMMAND_USAGE_KEY);}catch{return null;}};
export function getCommandUsage():CommandUsage{const raw=read();if(!cached||raw!==lastRaw){lastRaw=raw;cached=parseCommandUsage(raw);}return cached;}
function publish(next:CommandUsage){cached=next;try{if(typeof localStorage!=='undefined'){const raw=JSON.stringify(next);localStorage.setItem(COMMAND_USAGE_KEY,raw);lastRaw=raw;}}catch{/* Commands must keep working when storage is blocked. */}for(const listener of [...listeners])try{listener();}catch{/* Observers cannot interrupt a command. */}}
export const subscribeCommandUsage=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export function setCommandLearning(enabled:boolean){publish({...getCommandUsage(),enabled});}
export function clearCommandUsage(){cached=empty;lastRaw=null;try{if(typeof localStorage!=='undefined')localStorage.removeItem(COMMAND_USAGE_KEY);}catch{/* See publish. */}for(const listener of [...listeners])try{listener();}catch{/* See publish. */}}
const today=(now:Date)=>now.toISOString().slice(0,10);
export function recordCommandUse(id:string,viaShortcut=false,now=new Date()){const usage=getCommandUsage();if(!usage.enabled||!validId(id))return;const old=usage.commands[id];if(!old&&Object.keys(usage.commands).length>=COMMAND_USAGE_LIMIT)return;publish({...usage,commands:{...usage.commands,[id]:{runs:(old?.runs??0)+1,shortcutRuns:(old?.shortcutRuns??0)+(viaShortcut?1:0),lastDay:today(now)}}});}
/** Everyday editing commands would dominate every list, so they are never suggested. */
const basics=new Set(['undo','redo','cut','copy','paste','delete','duplicate','save','select-all','deselect','zoom-in','zoom-out','zoom-100','fit']);
const HALF_LIFE_DAYS=30;
export const usageScore=(c:CommandCount,now=new Date())=>c.runs*.5**(Math.max(0,(now.getTime()-Date.parse(c.lastDay))/86400000)/HALF_LIFE_DAYS);
export function frequentCommands(usage:CommandUsage,allowed:readonly string[],limit=6,now=new Date()){const known=new Set(allowed);return Object.entries(usage.commands).filter(([id,c])=>known.has(id)&&!basics.has(id)&&c.runs>=3).sort(([a,x],[b,y])=>usageScore(y,now)-usageScore(x,now)||a.localeCompare(b)).slice(0,limit).map(([id])=>id);}
export interface CommandTip {id:string;label:string;kind:'use-shortcut'|'assign-shortcut';runs:number;shortcut:string;}
export const SHORTCUT_TIP_RUNS=5,ASSIGN_TIP_RUNS=10;
/** A tip needs repeated evidence: menu runs of a command with a binding, or heavy use of a command with none. */
export function commandTips(usage:CommandUsage,commands:readonly (readonly [string,string,string,string])[]):CommandTip[]{const tips:CommandTip[]=[];for(const [id,label,,shortcut] of commands){const c=usage.commands[id];if(!c||basics.has(id))continue;if(shortcut&&c.runs>=SHORTCUT_TIP_RUNS&&c.shortcutRuns/c.runs<.25)tips.push({id,label,kind:'use-shortcut',runs:c.runs,shortcut});else if(!shortcut&&c.runs>=ASSIGN_TIP_RUNS)tips.push({id,label,kind:'assign-shortcut',runs:c.runs,shortcut});}return tips.sort((a,b)=>b.runs-a.runs||a.id.localeCompare(b.id)).slice(0,12);}
