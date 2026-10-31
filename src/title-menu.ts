/** These are existing local file actions; labels/shortcuts come from commands. */
export const TITLE_MENU_GROUPS=[['rename-file','file-info','file-cover'],['save','save-as'],['snapshot','history'],['open','import','export','interchange'],['home']] as const;
const normalize=(text:string)=>text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/\s+/g,' ').trim();
/** Prefix navigation wraps, and callers choose whether to include the active item. */
export function titleMenuPrefixMatch(labels:readonly string[],query:string,start:number){const prefix=normalize(query);if(!prefix||!labels.length)return-1;for(let offset=0;offset<labels.length;offset++){const i=((start+offset)%labels.length+labels.length)%labels.length;if(normalize(labels[i]).startsWith(prefix))return i;}return-1;}
