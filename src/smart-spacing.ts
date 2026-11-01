import type {ShapeHandle,SpacingHandle} from './canvas-handles';
import {nodeBounds} from './guides';
import type {Rect} from './guides';
import {isLocked} from './model';
import type {DesignNode} from './model';
import {identity,inverseMatrix,worldMatrix} from './transforms';
type Point={x:number;y:number};
export interface SmartItem {id:string;column:number;row:number;box:Rect;}
/** Loose layers that already read as a row, a column or a grid with equal gaps. */
export interface SmartGrid {items:SmartItem[];columns:number;rows:number;gapX:number;gapY:number;origin:Point;}
export interface SmartDragMemo {cells?:Map<string,{column:number;row:number}>;passed?:string;}
const TOLERANCE=.51,MAX_ITEMS=256,MIN_SWAP=24;
const same=(values:number[])=>values.every(v=>Math.abs(v-values[0])<=TOLERANCE);
const average=(values:number[])=>values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length*100)/100:0;
function line(boxes:{id:string;box:Rect}[],axis:'x'|'y'){const size=axis==='x'?'width':'height',cross=axis==='x'?'y':'x',extent=axis==='x'?'height':'width',sorted=[...boxes].sort((a,b)=>a.box[axis]-b.box[axis]);if(Math.max(...boxes.map(b=>b.box[cross]))>=Math.min(...boxes.map(b=>b.box[cross]+b.box[extent])))return undefined;const gaps=sorted.slice(1).map((b,i)=>b.box[axis]-(sorted[i].box[axis]+sorted[i].box[size]));return gaps.every(g=>g>=-TOLERANCE)&&same(gaps)?{sorted,gap:Math.max(0,average(gaps))}:undefined;}
const tracks=(boxes:{box:Rect}[],axis:'x'|'y')=>{const starts:number[]=[];for(const v of boxes.map(b=>b.box[axis]).sort((a,b)=>a-b))if(!starts.length||v-starts.at(-1)!>TOLERANCE)starts.push(v);return starts;};
/** Undefined unless every layer shares a parent outside auto layout and the gaps already match. Only then do handles promise an even result. */
export function smartSpacing(nodes:DesignNode[],selected:DesignNode[]):SmartGrid|undefined{
 if(selected.length<2||selected.length>MAX_ITEMS)return undefined;const parentId=selected[0].parentId,parent=nodes.find(n=>n.id===parentId);if(selected.some(n=>n.parentId!==parentId||n.instanceRootId||isLocked(n,nodes))||parent&&parent.layout!=='none')return undefined;
 const boxes=selected.map(n=>({id:n.id,box:nodeBounds(n,nodes)})),origin={x:Math.min(...boxes.map(b=>b.box.x)),y:Math.min(...boxes.map(b=>b.box.y))};
 const row=line(boxes,'x');if(row)return {items:row.sorted.map((b,column)=>({...b,column,row:0})),columns:boxes.length,rows:1,gapX:row.gap,gapY:0,origin};
 const column=line(boxes,'y');if(column)return {items:column.sorted.map((b,row)=>({...b,column:0,row})),columns:1,rows:boxes.length,gapX:0,gapY:column.gap,origin};
 const xs=tracks(boxes,'x'),ys=tracks(boxes,'y');if(xs.length<2||ys.length<2||xs.length*ys.length<boxes.length)return undefined;
 const nearest=(list:number[],v:number)=>list.findIndex(t=>Math.abs(t-v)<=TOLERANCE),items=boxes.map(b=>({...b,column:nearest(xs,b.box.x),row:nearest(ys,b.box.y)}));if(new Set(items.map(i=>i.row+':'+i.column)).size!==items.length)return undefined;
 const gaps=(list:number[],edge:(i:SmartItem)=>number,key:'column'|'row')=>list.slice(1).map((start,i)=>start-Math.max(...items.filter(item=>item[key]===i).map(edge))),gx=gaps(xs,i=>i.box.x+i.box.width,'column'),gy=gaps(ys,i=>i.box.y+i.box.height,'row');if(!same(gx)||!same(gy)||gx.some(g=>g<-TOLERANCE)||gy.some(g=>g<-TOLERANCE))return undefined;
 return {items,columns:xs.length,rows:ys.length,gapX:Math.max(0,average(gx)),gapY:Math.max(0,average(gy)),origin};
}
const assignment=(grid:SmartGrid)=>new Map(grid.items.map(i=>[i.id,{column:i.column,row:i.row}]));
/** Tracks take the size of whatever sits in them now, so a swap of unequal layers keeps the gap even. */
function tracksFor(grid:SmartGrid,cells:Map<string,{column:number;row:number}>,gapX:number,gapY:number){const widths=Array<number>(grid.columns).fill(0),heights=Array<number>(grid.rows).fill(0);for(const item of grid.items){const at=cells.get(item.id)!;widths[at.column]=Math.max(widths[at.column],item.box.width);heights[at.row]=Math.max(heights[at.row],item.box.height);}const place=(sizes:number[],from:number,gap:number)=>{let at=from;return sizes.map(size=>{const start=at;at+=size+gap;return start;});};return {x:place(widths,grid.origin.x,gapX),y:place(heights,grid.origin.y,gapY),widths,heights};}
function targets(grid:SmartGrid,cells:Map<string,{column:number;row:number}>,gapX:number,gapY:number){const t=tracksFor(grid,cells,gapX,gapY);return new Map(grid.items.map(item=>{const at=cells.get(item.id)!;return [item.id,{x:grid.columns>1?t.x[at.column]:item.box.x,y:grid.rows>1?t.y[at.row]:item.box.y}];}));}
export function smartHandles(grid:SmartGrid,zoom:number):{spacing:SpacingHandle[];shapes:ShapeHandle[]}{
 const cells=assignment(grid),t=tracksFor(grid,cells,grid.gapX,grid.gapY),right=t.x.at(-1)!+t.widths.at(-1)!,bottom=t.y.at(-1)!+t.heights.at(-1)!,midX=grid.columns>1?t.x[0]+t.widths[0]/2:(grid.origin.x+right)/2,midY=grid.rows>1?t.y[0]+t.heights[0]/2:(grid.origin.y+bottom)/2,half=8/zoom,id=grid.items[0].id,spacing:SpacingHandle[]=[];
 const rect=(x:number,y:number,w:number,h:number)=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
 for(let i=0;i+1<grid.columns;i++){const x=t.x[i]+t.widths[i]+grid.gapX/2;spacing.push({key:'smart-gap:x:'+i,group:'smart-gap:x',id,axis:'x',value:grid.gapX,zone:rect(x-grid.gapX/2,grid.origin.y,grid.gapX,bottom-grid.origin.y),from:{x,y:midY-half},to:{x,y:midY+half}});}
 for(let i=0;i+1<grid.rows;i++){const y=t.y[i]+t.heights[i]+grid.gapY/2;spacing.push({key:'smart-gap:y:'+i,group:'smart-gap:y',id,axis:'y',value:grid.gapY,zone:rect(grid.origin.x,y-grid.gapY/2,right-grid.origin.x,grid.gapY),from:{x:midX-half,y},to:{x:midX+half,y}});}
 const shapes=grid.items.filter(i=>Math.min(i.box.width,i.box.height)*zoom>=MIN_SWAP).map(i=>({key:'smart-swap:'+i.id,id:i.id,x:i.box.x+i.box.width/2,y:i.box.y+i.box.height/2,label:'Drag to swap places'}));
 return {spacing,shapes};
}
/** Screen moves become parent moves once; every descendant of a layer travels with it. */
export function smartMoves(nodes:DesignNode[],grid:SmartGrid){const owner=new Map(grid.items.map(i=>[i.id,i.id]));let grew=true;while(grew){grew=false;for(const n of nodes)if(!owner.has(n.id)&&n.parentId&&owner.has(n.parentId)){owner.set(n.id,owner.get(n.parentId)!);grew=true;}}const first=nodes.find(n=>n.id===grid.items[0].id),parent=nodes.find(n=>n.id===first?.parentId);return {owner,inverse:parent?inverseMatrix(worldMatrix(parent,nodes)):identity};}
export type SmartMoves=ReturnType<typeof smartMoves>;
export function shiftSmart(nodes:DesignNode[],moves:SmartMoves,deltas:Map<string,Point>){const m=moves.inverse;return nodes.map(n=>{const root=moves.owner.get(n.id),d=root?deltas.get(root):undefined;return d&&(d.x||d.y)?{...n,x:n.x+m[0]*d.x+m[2]*d.y,y:n.y+m[1]*d.x+m[3]*d.y}:n;});}
const deltasFor=(grid:SmartGrid,at:Map<string,Point>)=>new Map(grid.items.map(i=>[i.id,{x:at.get(i.id)!.x-i.box.x,y:at.get(i.id)!.y-i.box.y}]));
/** Dragging a gap changes all gaps of that axis from the first track. */
export function smartGapDrag(grid:SmartGrid,axis:'x'|'y',start:Point,pointer:Point){const value=Math.max(0,Math.round((axis==='x'?grid.gapX:grid.gapY)+(axis==='x'?pointer.x-start.x:pointer.y-start.y))),gapX=axis==='x'?value:grid.gapX,gapY=axis==='y'?value:grid.gapY;return {deltas:deltasFor(grid,targets(grid,assignment(grid),gapX,gapY)),text:String(value)};}
function cellUnder(grid:SmartGrid,cells:Map<string,{column:number;row:number}>,p:Point){const t=tracksFor(grid,cells,grid.gapX,grid.gapY),inside=(from:number[],gap:number,v:number)=>{for(let i=from.length-1;i>=0;i--)if(v>=from[i]-gap/2)return i;return 0;};const column=inside(t.x,grid.gapX,p.x),row=inside(t.y,grid.gapY,p.y);return {column,row,x:t.x[column]+t.widths[column]/2,y:t.y[row]+t.heights[row]/2};}
/** The dragged layer trades places with what it crosses. Past the middle of a neighbor it swaps once, and that neighbor cannot swap back until the pointer has left it, so unequal sizes do not flicker. */
export function smartSwapDrag(grid:SmartGrid,id:string,start:Point,pointer:Point,memo:SmartDragMemo){const cells=memo.cells??=assignment(grid),own=cells.get(id)!,under=cellUnder(grid,cells,pointer),other=grid.items.find(i=>{const at=cells.get(i.id)!;return i.id!==id&&at.column===under.column&&at.row===under.row;});
 if(memo.passed&&memo.passed!==other?.id)memo.passed=undefined;
 const crossed=grid.columns>1&&grid.rows>1?true:grid.columns>1?(under.column>own.column?pointer.x>=under.x:pointer.x<=under.x):under.row>own.row?pointer.y>=under.y:pointer.y<=under.y;
 if((under.column!==own.column||under.row!==own.row)&&crossed&&(!other||other.id!==memo.passed)){if(other){cells.set(other.id,{...own});memo.passed=other.id;}cells.set(id,{column:under.column,row:under.row});}
 const settled=deltasFor(grid,targets(grid,cells,grid.gapX,grid.gapY)),shown=new Map(settled).set(id,{x:pointer.x-start.x,y:pointer.y-start.y}),placed=cells.get(id)!;return {deltas:settled,shown,text:placed.row*grid.columns+placed.column+1+' of '+grid.items.length};
}
