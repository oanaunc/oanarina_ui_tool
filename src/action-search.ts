export type PaletteCommand=readonly[id:string,label:string,category:string,shortcut:string];
const keywords:Record<string,string>={
 preferences:'settings configuration nudge defaults behavior',fonts:'typeface typography google installed missing font',
 figma:'interchange bridge import export',import:'upload insert picture raster vector svg',export:'download png jpg svg pdf',
 mcp:'automation assistant model context protocol local server',roadmap:'features requirements progress implementation register',
 shortcuts:'hotkeys keyboard bindings help',history:'versions snapshots restore',snapshot:'checkpoint version backup',
 'auto-layout':'stack flex spacing padding responsive',component:'symbol reusable main',instance:'symbol reusable copy',
 'main-component':'source symbol master',variants:'component states variations',detach:'unlink disconnect instance',
 mask:'clip clipping crop alpha',union:'boolean add merge shapes',subtract:'boolean difference minus',intersect:'boolean overlap',exclude:'boolean xor difference',
 'edit-vector':'path points bezier anchors nodes',flatten:'convert vector outlines',
 'new-whiteboard':'figjam sticky notes brainstorm diagram', 'new-slides':'deck slides presentation keynote',
 'toggle-ui':'panels interface hide distraction',theme:'appearance dark light',present:'preview play presentation prototype',
 inspect:'developer dev code properties',motion:'animation keyframes timeline',
 'text-bold':'font weight strong', 'text-italic':'font oblique emphasis', 'text-strike':'strike through crossed',
 'text-link':'hyperlink url website', 'text-bullets':'unordered list', 'text-numbered':'ordered list',
 'local-widgets':'widget extension interactive plugin install','flip-x':'mirror horizontal', 'flip-y':'mirror vertical', grid:'pixel grid',rulers:'measurement guides',
};
function normalized(value:string){return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/[-_/…·]/g,' ').replace(/\s+/g,' ').trim();}
/** Every query word must occur in the label, ID, category, shortcut or curated aliases. */
export function searchActions(commands:readonly PaletteCommand[],query:string):PaletteCommand[]{
 const q=normalized(query),terms=q.split(' ').filter(Boolean);
 return commands.filter(c=>c[0]!=='actions').map((command,index)=>{const [id,label,category,shortcut]=command,l=normalized(label),haystack=normalized(`${id} ${label} ${category} ${shortcut} ${keywords[id]??''}`);return{command,index,matches:terms.every(term=>haystack.includes(term)),rank:!q?0:l===q?0:l.startsWith(q)?1:l.includes(q)?2:3};}).filter(c=>c.matches).sort((a,b)=>a.rank-b.rank||a.index-b.index).map(c=>c.command);
}
export function moveActiveAction(index:number,key:string,count:number):number{
 if(!count)return-1;if(key==='Home')return 0;if(key==='End')return count-1;
 if(key==='ArrowDown')return(index+1+count)%count;if(key==='ArrowUp')return(index-1+count)%count;
 return Math.max(0,Math.min(index,count-1));
}
