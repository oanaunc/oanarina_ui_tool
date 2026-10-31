/** Failures reach assistive technology through one assertive region, separate from polite status toasts. */
const listeners=new Set<(message:string)=>void>();
export function announceError(message:string){const text=String(message).trim().slice(0,500);if(!text)return;for(const listener of [...listeners])listener(text);}
export function subscribeErrorAnnouncements(listener:(message:string)=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
