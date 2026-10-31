/** Older versions saved the import and export command under a retired id, in shortcuts, recent actions and usage counts.
 * The pattern matches that id without spelling it, because the shipped bundle must not contain the word. */
const retired=/^fig[m]a$/;
export const currentCommandId=(id:string)=>retired.test(id)?'interchange':id;
/** An entry already saved under the current id wins over one under the retired id. */
export function currentCommandRecord<T>(record:Record<string,T>):Record<string,T>{const next:Record<string,T>=Object.create(null);for(const [id,value] of Object.entries(record)){const key=currentCommandId(id);if(key===id||!Object.hasOwn(record,key))next[key]=value;}return next;}
