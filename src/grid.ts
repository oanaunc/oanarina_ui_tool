import {layoutPadding,layoutChildOutset,layoutSpan} from './layout-settings';
import type {DesignDocument,DesignNode} from './model';

export interface GridTrack {sizing:'fixed'|'fr'|'hug';value:number;min?:number;max?:number;}
export type GridAlignment='start'|'center'|'end'|'stretch';
export interface GridPlacement {id:string;column:number;row:number;columnSpan:number;rowSpan:number;}
export interface GridGeometry {columns:number[];rows:number[];columnOffsets:number[];rowOffsets:number[];placements:GridPlacement[];width:number;height:number;}
const MAX_TRACKS=4096,MAX_CELLS=1_000_000;
const sum=(values:number[])=>values.reduce((a,b)=>a+b,0);
const bounded=(value:number,t:GridTrack)=>Math.max(t.min??0,Math.min(t.max??1e6,value));
export function gridColumnCount(n:DesignNode){return Math.max(1,Math.min(MAX_TRACKS,Math.round(n.columns)));}
/** Explicitly placed objects reserve their cells first. Collisions move forward; no layers are dropped. */
export function placeGrid(parent:DesignNode,kids:DesignNode[]):{placements:GridPlacement[];columnCount:number;rowCount:number}{
 const columnCount=gridColumnCount(parent),placements:GridPlacement[]=[],occupied=new Map<number,Uint8Array>();let cursor=0,rowCount=Math.max(0,parent.gridRows??0),attempts=0;
 const fits=(row:number,col:number,cs:number,rs:number)=>{if(col+cs>columnCount)return false;if((row+rs)*columnCount>MAX_CELLS)throw Error('Grid exceeds the 1,000,000 cell layout limit.');for(let r=row;r<row+rs;r++){const line=occupied.get(r);if(line)for(let c=col;c<col+cs;c++)if(line[c])return false;}return true;};
 const place=(n:DesignNode,manual:boolean)=>{const cs=Math.min(columnCount,n.gridColumnSpan??1),rs=n.gridRowSpan??1;let start=manual?Math.max(0,((n.gridRow??1)-1)*columnCount+Math.min(columnCount-cs,(n.gridColumn??1)-1)):cursor;
  while(!fits(Math.floor(start/columnCount),start%columnCount,cs,rs)){if(++attempts>MAX_CELLS*2)throw Error('Grid placement exceeds the layout work limit.');start++;}
  const row=Math.floor(start/columnCount),col=start%columnCount;for(let r=row;r<row+rs;r++){let line=occupied.get(r);if(!line){line=new Uint8Array(columnCount);occupied.set(r,line);}line.fill(1,col,col+cs);}placements.push({id:n.id,column:col,row,columnSpan:cs,rowSpan:rs});rowCount=Math.max(rowCount,row+rs);if(!manual)cursor=start+cs;
 };
 for(const n of kids)if(n.gridColumn!==undefined||n.gridRow!==undefined)place(n,true);
 for(const n of kids)if(n.gridColumn===undefined&&n.gridRow===undefined)place(n,false);
 if(rowCount*columnCount>MAX_CELLS)throw Error('Grid exceeds the 1,000,000 cell layout limit.');
 const order=new Map(kids.map((n,i)=>[n.id,i]));placements.sort((a,b)=>order.get(a.id)!-order.get(b.id)!);return {placements,columnCount,rowCount};
}
function resolveTracks(tracks:GridTrack[],placements:GridPlacement[],byId:Map<string,DesignNode>,axis:'width'|'height',gap:number,available:number,hug:boolean){
 const sizes=tracks.map(t=>bounded(t.sizing==='fixed'?t.value:0,t)),start=axis==='width'?'column':'row',span=axis==='width'?'columnSpan':'rowSpan';
 // Small spans establish intrinsic sizes before larger spans distribute their unmet minimums.
 for(const placement of [...placements].sort((a,b)=>a[span]-b[span])){const n=byId.get(placement.id)!,from=placement[start],length=placement[span],fill=(axis==='width'?n.sizingX:n.sizingY)==='fill',needed=fill?(axis==='width'?n.minWidth:n.minHeight)??0:n[axis];let deficit=needed-(sum(sizes.slice(from,from+length))+(length-1)*gap),pending=Array.from({length},(_,i)=>from+i).filter(i=>tracks[i].sizing!=='fixed');
  while(deficit>1e-7&&pending.length){const share=deficit/pending.length;let gained=0;for(const i of pending){const next=bounded(sizes[i]+share,tracks[i]);gained+=next-sizes[i];sizes[i]=next;}deficit-=gained;pending=pending.filter(i=>sizes[i]<(tracks[i].max??1e6)-1e-7);if(gained<1e-7)break;}
 }
 if(!hug){const flexible=tracks.flatMap((t,i)=>t.sizing==='fr'?[i]:[]),availableForFlex=Math.max(0,available-Math.max(0,tracks.length-1)*gap)-sum(sizes.filter((_,i)=>tracks[i].sizing!=='fr'));
  // Solve sum(clamp(weight * unit)) = available, including simultaneous minimum/maximum limits.
  let low=0,high=Math.max(1,...flexible.map(i=>(tracks[i].max??Math.max(0,availableForFlex)+(tracks[i].min??0))/tracks[i].value));
  for(let pass=0;pass<70;pass++){const unit=(low+high)/2,total=sum(flexible.map(i=>bounded(unit*tracks[i].value,tracks[i])));if(total>availableForFlex)high=unit;else low=unit;}
  for(const i of flexible)sizes[i]=Math.round(bounded((low+high)/2*tracks[i].value,tracks[i])*1e9)/1e9;
 }

 return sizes;
}
/** Frame-local cell geometry, shared by layout, inspectors and canvas overlays. */
export function gridGeometry(parent:DesignNode,kids:DesignNode[],width=parent.width,height=parent.height):GridGeometry{
 const {placements,columnCount,rowCount}=placeGrid(parent,kids),byId=new Map(kids.map(n=>{const o=layoutChildOutset(parent,n),width=layoutSpan(n,'width',o),height=layoutSpan(n,'height',o);return [n.id,o||width!==n.width||height!==n.height?{...n,width,height,minWidth:(n.minWidth??0)+2*o,minHeight:(n.minHeight??0)+2*o}:n];})),[top,right,bottom,left]=layoutPadding(parent),gx=parent.gapX??parent.gap,gy=parent.gapY??parent.gap;
 const columns=resolveTracks(Array.from({length:columnCount},(_,i)=>parent.gridColumns?.[i]??{sizing:'fr',value:1}),placements,byId,'width',gx,Math.max(0,width-left-right),parent.sizingX==='hug'),rows=resolveTracks(Array.from({length:rowCount},(_,i)=>parent.gridRowTracks?.[i]??{sizing:'hug',value:0}),placements,byId,'height',gy,Math.max(0,height-top-bottom),parent.sizingY==='hug');
 const offsets=(sizes:number[],gap:number,padding:number)=>{let pos=padding;return sizes.map(size=>{const value=pos;pos+=size+gap;return value;});};
 return {columns,rows,columnOffsets:offsets(columns,gx,left),rowOffsets:offsets(rows,gy,top),placements,width:Math.max(0,sum(columns)+Math.max(0,columnCount-1)*gx+left+right),height:Math.max(0,sum(rows)+Math.max(0,rowCount-1)*gy+top+bottom)};
}
export function gridCell(geometry:GridGeometry,p:GridPlacement,gapX:number,gapY:number){return {x:geometry.columnOffsets[p.column],y:geometry.rowOffsets[p.row],width:Math.max(0,sum(geometry.columns.slice(p.column,p.column+p.columnSpan))+(p.columnSpan-1)*gapX),height:Math.max(0,sum(geometry.rows.slice(p.row,p.row+p.rowSpan))+(p.rowSpan-1)*gapY)};}
export function validateGridNode(n:DesignNode){
 for(const key of ['gridRows','gridColumn','gridRow','gridColumnSpan','gridRowSpan'] as const){const v=n[key];if(v!==undefined&&(!Number.isInteger(v)||v<(key==='gridRows'?0:1)||v>(key==='gridColumnSpan'||key==='gridRowSpan'?256:MAX_TRACKS)))throw Error('Invalid grid count or placement.');}
 for(const key of ['gridAlignX','gridAlignY'] as const)if(n[key]!==undefined&&!['start','center','end','stretch'].includes(n[key]!))throw Error('Invalid grid cell alignment.');
 for(const key of ['gridColumns','gridRowTracks'] as const){const tracks=n[key];if(tracks===undefined)continue;if(!Array.isArray(tracks)||tracks.length>MAX_TRACKS)throw Error('Invalid grid tracks.');for(const t of tracks){if(!t||typeof t!=='object'||!['fixed','fr','hug'].includes(t.sizing)||!Number.isFinite(t.value)||t.value<0||t.value>1e6||t.sizing==='fr'&&t.value<.001)throw Error('Invalid grid track.');for(const v of [t.min,t.max])if(v!==undefined&&(!Number.isFinite(v)||v<0||v>1e6))throw Error('Invalid grid track limit.');if(t.min!==undefined&&t.max!==undefined&&t.min>t.max)throw Error('Grid track minimum exceeds maximum.');}}
}
export function validateGrids(d:DesignDocument){for(const page of d.pages){const children=new Map<string,DesignNode[]>();for(const n of page.nodes){validateGridNode(n);if(n.parentId&&n.visible&&!n.ignoreLayout){const group=children.get(n.parentId)??[];group.push(n);children.set(n.parentId,group);}}for(const n of page.nodes)if(n.layout==='grid')placeGrid(n,children.get(n.id)??[]);}}
