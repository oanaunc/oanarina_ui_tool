import type {EditorPreferences} from './preferences';
/** Names are reserved as a batch so multiple duplicated roots cannot collide with one another. */
export function duplicateRootNames(names:string[],existing:Iterable<string>,mode:EditorPreferences['duplicateNaming']){
 if(!['preserve','copy','increment'].includes(mode))throw Error('Invalid duplicate naming style.');if(mode==='preserve')return [...names];const used=new Set(existing),nextNumbers=new Map<string,number>();
 return names.map(original=>{let stem:string,number:number,suffix:string;if(mode==='copy'){stem=original.replace(/ copy(?: \d+)?$/,'').slice(0,490);number=1;suffix=' copy';}else{const match=original.match(/^(.*?)(?: (\d+))$/);stem=(match?.[1]??original).slice(0,490);number=match&&Number.isSafeInteger(Number(match[2]))?Math.min(Number(match[2])+1,1e9):2;suffix=' ';}const counterKey=JSON.stringify([stem,suffix,number]);number=nextNumbers.get(counterKey)??number;let name=stem+suffix+(mode==='copy'?(number===1?'':' '+number):number);while(used.has(name)){number++;name=stem+suffix+(mode==='copy'?' ':'')+number;}nextNumbers.set(counterKey,number+1);used.add(name);return name;});
}
/** Recent-file limits change presentation only; every entry remains in storage and All files. */
export function recentFileRows<T>(rows:T[],view:string,limit:number){if(!Number.isSafeInteger(limit)||limit<0||limit>1000)throw Error('Invalid recent-file limit.');return view==='recent'&&limit>0?rows.slice(0,limit):rows;}
/** Keep the selected artwork's center stationary on screen while changing keyboard zoom. */
export function selectionZoomCamera(camera:{zoom:number;pan:{x:number;y:number}},zoom:number,bounds:{x:number;y:number;width:number;height:number}){const x=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;return {zoom,pan:{x:camera.pan.x+x*(camera.zoom-zoom),y:camera.pan.y+y*(camera.zoom-zoom)}};}
