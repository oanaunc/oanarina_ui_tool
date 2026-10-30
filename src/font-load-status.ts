import {create} from 'zustand';
export type FontLoadSource='catalog'|'lookup'|'cache'|'bundled'|'google'|'embedded'|'imported';
export type FontLoadPhase='checking'|'downloading'|'registering';
export type FontLoadResult='ready'|'failed'|'unavailable'|'superseded';
export interface FontLoadEntry {id:number;family:string;source:FontLoadSource;phase:FontLoadPhase;result?:FontLoadResult;message?:string;}
export const FONT_LOAD_HISTORY_LIMIT=40;
let serial=0;
export const useFontLoads=create<{active:FontLoadEntry[];history:FontLoadEntry[]}>(()=>({active:[],history:[]}));
/** Volatile operation identities keep concurrent registrations/retries from overwriting each other. */
export function beginFontLoad(family:string,source:FontLoadSource,phase:FontLoadPhase='checking'){
 const id=++serial;let settled=false;
 useFontLoads.setState(s=>({active:[...s.active,{id,family,source,phase}]}));
 return {phase(next:FontLoadPhase,origin?:FontLoadSource){if(settled)return;useFontLoads.setState(s=>({active:s.active.map(e=>e.id===id?{...e,phase:next,source:origin??e.source}:e)}));},finish(result:FontLoadResult,message?:string){if(settled)return;settled=true;useFontLoads.setState(s=>{const entry=s.active.find(e=>e.id===id);return {active:s.active.filter(e=>e.id!==id),history:entry?[{...entry,result,message},...s.history].slice(0,FONT_LOAD_HISTORY_LIMIT):s.history};});}};
}
