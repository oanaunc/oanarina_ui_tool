export type FontRow={kind:'head';label:string}|{kind:'font';family:string};
const byName=(a:string,b:string)=>a.localeCompare(b,undefined,{sensitivity:'base'});
/** Recents first, then every family A to Z. A search drops the headings and puts names that start with it first. */
export function fontRows(families:readonly string[],recents:readonly string[],query:string):FontRow[]{
 const all=[...new Set(families.filter(Boolean))].sort(byName),q=query.trim().toLowerCase(),font=(family:string):FontRow=>({kind:'font',family});
 if(q){const hits=all.filter(f=>f.toLowerCase().includes(q)),starts=(f:string)=>f.toLowerCase().startsWith(q);return [...hits.filter(starts),...hits.filter(f=>!starts(f))].map(font);}
 const recent=recents.filter(f=>all.includes(f));return [...(recent.length?[{kind:'head',label:'Recents'} as FontRow,...recent.map(font)]:[]),{kind:'head',label:'All fonts'},...all.map(font)];
}
/** The next font row from `from`, stepping over headings and stopping at either end. */
export function stepFontRow(rows:readonly FontRow[],from:number,delta:number){const fonts=rows.flatMap((row,i)=>row.kind==='font'?[i]:[]);if(!fonts.length)return -1;let at=fonts.indexOf(from);if(at<0)at=delta>0?-1:fonts.length;return fonts[Math.max(0,Math.min(fonts.length-1,at+delta))];}
