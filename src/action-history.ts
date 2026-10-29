/** Local command IDs only; history is independent of project documents. */
export const ACTION_HISTORY_KEY='oui-action-history';
export const ACTION_HISTORY_LIMIT=20;
const empty:readonly string[]=Object.freeze([]);
let history:readonly string[]=empty,loaded=false,lastRaw:string|null=null;
const listeners=new Set<()=>void>();
const validId=(id:unknown):id is string=>typeof id==='string'&&/^[a-z][a-z0-9-]{0,95}$/.test(id)&&id!=='actions';
function read():string|null|undefined{try{return typeof localStorage==='undefined'?undefined:localStorage.getItem(ACTION_HISTORY_KEY);}catch{return undefined;}}
function decode(raw:string|null):readonly string[]{
 if(!raw||raw.length>4096)return empty;
 try{const data=JSON.parse(raw);if(!data||data.version!==1||!Array.isArray(data.ids)||data.ids.length>ACTION_HISTORY_LIMIT)return empty;
  if(data.ids.some((id:unknown)=>!validId(id)))return empty;return Object.freeze([...new Set<string>(data.ids)]);
 }catch{return empty;}
}
function sync(){const raw=read();if(raw===undefined){loaded=true;return;}if(!loaded||raw!==lastRaw){lastRaw=raw;history=decode(raw);loaded=true;}}
export function getRecentActions(allowedIds?:readonly string[]):readonly string[]{sync();if(!allowedIds)return history;const allowed=new Set(allowedIds);return history.filter(id=>allowed.has(id));}
function publish(next:readonly string[],remove=false){
 history=Object.freeze([...next]);loaded=true;
 try{if(typeof localStorage!=='undefined'){if(remove)localStorage.removeItem(ACTION_HISTORY_KEY);else localStorage.setItem(ACTION_HISTORY_KEY,JSON.stringify({version:1,ids:next}));lastRaw=read()??null;}}catch{/* Storage may be blocked. Commands and session history must keep working. */}
 for(const listener of listeners)try{listener();}catch{/* Observers must never prevent a command. */}
}
export function recordAction(id:string):void{if(!validId(id))return;const previous=getRecentActions();if(previous[0]===id)return;publish([id,...previous.filter(item=>item!==id)].slice(0,ACTION_HISTORY_LIMIT));}
export function clearRecentActions():void{sync();publish(empty,true);}
export function subscribeActionHistory(listener:()=>void):()=>void{
 listeners.add(listener);const changed=(event:StorageEvent)=>{if(event.key===ACTION_HISTORY_KEY||event.key===null){const previous=getRecentActions();loaded=false;sync();if(previous!==history)listener();}};
 if(typeof window!=='undefined')window.addEventListener('storage',changed);
 return()=>{listeners.delete(listener);if(typeof window!=='undefined')window.removeEventListener('storage',changed);};
}
