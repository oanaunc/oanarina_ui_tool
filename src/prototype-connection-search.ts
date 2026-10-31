import {reactionsFor} from './prototype';
import type {PrototypeAction} from './prototype';
import type {DesignDocument,DesignNode,Page} from './model';
/** Depth-first, including every conditional branch. Stored actions are validated, so this terminates on saved documents. */
export function flattenActions(actions:PrototypeAction[]):PrototypeAction[]{return actions.flatMap(a=>[a,...(a.branches??[]).flatMap(b=>flattenActions(b.actions))]);}
const branchConditions=(actions:PrototypeAction[]):string[]=>actions.flatMap(a=>(a.branches??[]).flatMap(b=>[b.condition,...branchConditions(b.actions)]));
/** Everything a connection can be found by: its source, trigger, destinations and action details. */
export function connectionTerms(n:DesignNode,page:Page,doc?:Pick<DesignDocument,'pages'|'variables'>){const pages=doc?.pages??[page],name=(id?:string)=>id?pages.flatMap(p=>p.nodes.find(x=>x.id===id)?.name??[])[0]:undefined,reactions=reactionsFor(n),actions=reactions.flatMap(r=>flattenActions(r.actions));return [n.name,...reactions.map(r=>r.trigger),...actions.flatMap(a=>[a.type,name(a.targetId),name(a.componentId),a.url,a.expression,doc?.variables?.find(v=>v.id===a.variableId)?.name]),...reactions.flatMap(r=>branchConditions(r.actions))].filter((v):v is string=>!!v);}
export function searchConnections(page:Page,query:string,doc?:Pick<DesignDocument,'pages'|'variables'>){const q=query.trim().toLowerCase();return page.nodes.filter(n=>reactionsFor(n).length&&(!q||connectionTerms(n,page,doc).some(term=>term.toLowerCase().includes(q))));}
