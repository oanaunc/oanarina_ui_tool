/** Hands a link that arrived from outside the app to the Version history dialog, which owns all the preview checks. */
let pending='';
const listeners=new Set<()=>void>();
export function requestVersionLink(link:string){pending=link;for(const listener of [...listeners])listener();}
export function takeVersionLink(){const link=pending;pending='';return link;}
export function subscribeVersionLink(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
