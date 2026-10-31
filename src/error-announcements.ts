/** Failures reach assistive technology through one assertive region, separate from polite status toasts. */
const listeners=new Set<(message:string)=>void>();
let last='',lastAt=0;
/** notifyError also raises a toast, so the same text inside a moment is one announcement. A later repeat still speaks. */
export function announceError(message:string){const text=String(message).trim().slice(0,500),now=Date.now();if(!text||text===last&&now-lastAt<500)return;last=text;lastAt=now;for(const listener of [...listeners])listener(text);}
const FAILURE=/^(unable|cannot|can't|could not|couldn't|failed|invalid|error|refused|not available|no longer)\b|\b(failed|could not|couldn't|cannot|can't|unable to|was refused|were refused|is invalid|are invalid|not supported|unsupported|does not fit|too large|exceeds|(was|were) not (applied|updated|saved)|has no supported|no longer available)\b/i;
/** Toasts carry no type, and most report success. These words are how every failing toast in the app is worded. */
export const isFailureMessage=(text:string)=>FAILURE.test(text);
export function subscribeErrorAnnouncements(listener:(message:string)=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
