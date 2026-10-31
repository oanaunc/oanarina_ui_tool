/** Session-only runtime error ring. Nothing is persisted or transmitted; it exists only to fill a bug report you save yourself. */
export interface LoggedError {at:string;kind:'error'|'rejection'|'render';message:string;source:string;count:number;}
export const ERROR_LOG_LIMIT=50;
let entries:LoggedError[]=[];
/** Message text can quote layer names or file paths, so anything resembling user content is removed before it is kept. */
export function redactErrorText(value:unknown,known:readonly string[]=[]){
 let text=String(value??'').slice(0,2000);for(const item of known)if(item.length>=3)text=text.split(item).join('[document text]');
 return text.replace(/data:[^\s"'`)]+/gi,'[data]').replace(/\b[a-z][a-z0-9+.-]*:\/\/[^\s"'`)]+/gi,'[url]').replace(/(?:~|[A-Za-z]:)?(?:[\\/][^\s"'`\\/:]+){2,}/g,'[path]').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g,'[email]').replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,'[id]').replace(/"[^"]*"|“[^”]*”|'[^']*'|`[^`]*`/g,'[text]').replace(/[A-Za-z0-9+/=]{60,}/g,'[data]').slice(0,300);
}
/** Keeps only this app's own script name and line, never a full path or a third-party frame. */
export function errorSource(stack:unknown){const line=typeof stack==='string'?stack.split('\n').find(l=>/\/(assets|src)\/[\w.-]+\.(js|ts|tsx)/.test(l)):undefined,match=line?.match(/\/([\w.-]+\.(?:js|ts|tsx))(?:\?[^:]*)?:(\d+):(\d+)/);return match?match[1]+':'+match[2]+':'+match[3]:'';}
export function logRuntimeError(kind:LoggedError['kind'],error:unknown,at=new Date().toISOString()){
 const message=redactErrorText(error instanceof Error?error.name+': '+error.message:error),source=errorSource(error instanceof Error?error.stack:undefined),same=entries.find(e=>e.kind===kind&&e.message===message&&e.source===source);
 if(same){same.count=Math.min(9999,same.count+1);same.at=at;return;}entries=[{at,kind,message,source,count:1},...entries].slice(0,ERROR_LOG_LIMIT);
}
export const recentRuntimeErrors=():readonly LoggedError[]=>entries;
export function clearRuntimeErrors(){entries=[];}
export function installRuntimeErrorLog(target:Pick<Window,'addEventListener'|'removeEventListener'>=window){const error=(e:Event)=>logRuntimeError('error',(e as ErrorEvent).error??(e as ErrorEvent).message),rejection=(e:Event)=>logRuntimeError('rejection',(e as PromiseRejectionEvent).reason);target.addEventListener('error',error);target.addEventListener('unhandledrejection',rejection);return()=>{target.removeEventListener('error',error);target.removeEventListener('unhandledrejection',rejection);};}
