import {startPluginSandbox} from './local-plugin-sandbox';
import {pluginKeys,pluginObject} from './local-plugin-manifest';
import type {LocalPlugin} from './local-plugin-manifest';
import {pluginSuggestions} from './local-plugin-parameters';
import type {PluginParameter,PluginParameterValues,PluginSuggestion} from './local-plugin-parameters';
export const PLUGIN_SUGGEST_LIMITS={debounceMs:180,deadlineMs:1500,rows:50,labelLength:120,failures:3} as const;
export interface PluginSuggestState {status:'idle'|'waiting'|'ready'|'timeout'|'failed'|'stopped';rows:PluginSuggestion[];}
export interface PluginSuggester {ask:(query:string,values:PluginParameterValues)=>void;stop:()=>void;}
/** Each settled query gets one fresh worker, and only one at a time. It holds no grant, so it sees only the text and the earlier fields it is handed, and a new query or a missed deadline simply ends it. Repeated failures stop asking until the field is opened afresh. */
export function startPluginSuggester(plugin:LocalPlugin,field:Extract<PluginParameter,{type:'text'}>,publish:(state:PluginSuggestState)=>void):PluginSuggester{
 let waiting:ReturnType<typeof setTimeout>|undefined,deadline:ReturnType<typeof setTimeout>|undefined,run:ReturnType<typeof startPluginSandbox>|undefined,failures=0,serial=0,rows:PluginSuggestion[]=[];
 const halt=()=>{serial++;clearTimeout(waiting);clearTimeout(deadline);run?.dispose();run=undefined;};
 const finish=(status:PluginSuggestState['status'],next:PluginSuggestion[])=>{halt();rows=next;publish({status,rows});};
 const failed=(status:'timeout'|'failed')=>{failures++;finish(failures>=PLUGIN_SUGGEST_LIMITS.failures?'stopped':status,[]);};
 const launch=(query:string,values:PluginParameterValues,ticket:number)=>{deadline=setTimeout(()=>{if(ticket===serial)failed('timeout');},PLUGIN_SUGGEST_LIMITS.deadlineMs);try{run=startPluginSandbox(plugin.code,{request:(method,params)=>{if(ticket!==serial)throw Error('This suggestion query was replaced.');if(method!=='suggest.result')throw Error('Suggestions have no document, storage or network access.');const p=pluginObject(params);pluginKeys(p,['rows']);const next=pluginSuggestions(p.rows,field.maxLength,PLUGIN_SUGGEST_LIMITS.rows,PLUGIN_SUGGEST_LIMITS.labelLength);failures=0;finish('ready',next);return {accepted:true};},done:()=>{if(ticket===serial)finish('ready',[]);},error:()=>{if(ticket===serial)failed('failed');}},{suggest:{key:field.key,query,values}});}catch{if(ticket===serial)failed('failed');}};
 return {ask:(query,values)=>{halt();if(failures>=PLUGIN_SUGGEST_LIMITS.failures){publish({status:'stopped',rows:[]});return;}publish({status:'waiting',rows});const ticket=serial;waiting=setTimeout(()=>launch(query,structuredClone(values),ticket),PLUGIN_SUGGEST_LIMITS.debounceMs);},stop:halt};
}
