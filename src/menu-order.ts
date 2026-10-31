import menuPlan from '../public/menu-order.json';

/** Commands are registered in history order; menus read in the order someone reaches for them. The native menus read the same file. Unlisted commands keep their place in a final group. */
const groups:Record<string,string[][]>=menuPlan;
export type MenuEntry<C>={separator:string}|{command:C};
export function orderedMenu<C extends readonly [string,string,string,string]>(group:string,commands:readonly C[]):MenuEntry<C>[]{const own=commands.filter(c=>c[2]===group),plan=groups[group];if(!plan)return own.map(command=>({command}));const byId=new Map(own.map(c=>[c[0],c])),used=new Set<string>(),out:MenuEntry<C>[]=[];const section=(rows:C[],key:string)=>{if(!rows.length)return;if(out.length)out.push({separator:key});for(const command of rows){used.add(command[0]);out.push({command});}};plan.forEach((ids,i)=>section(ids.map(id=>byId.get(id)).filter((c):c is C=>!!c),group+i));section(own.filter(c=>!used.has(c[0])),group+'-rest');return out;}
