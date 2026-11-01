import {shapePoints} from './geometry';
import {gridGeometry} from './grid';
import {paddingFor} from './layout';
import {layoutPadding,layoutSpan} from './layout-settings';
import {isLocked,reflow} from './model';
import type {DesignNode} from './model';
import {inverseMatrix,point,worldMatrix} from './transforms';
type Point={x:number;y:number};
export interface SpacingHandle {key:string;group?:string;id:string;axis:'x'|'y';value:number;zone:Point[];from:Point;to:Point;}
export interface ShapeHandle {key:string;id:string;x:number;y:number;label:string;}
export interface HandleModifiers {alt:boolean;shift:boolean;}
/** Arc handles remember the last sweep, so a drag stops at empty or full instead of wrapping past it. */
export interface HandleMemo {sweep?:number;}
export interface HandleDrag {patch:Partial<DesignNode>;text:string;}
const FRAMES=['frame','component','instance','section'],BOXES=['rectangle','frame','component','instance','image'];
const SPREAD=['space-between','space-around','space-evenly'];
/** Handles below these on-screen sizes would cover the layer they edit. */
const MIN_SPACING=32,MIN_BOX=48,MIN_SHAPE=40,MIN_ARC=32,MAX_GAPS=64;
const clamp=(v:number,low:number,high:number)=>Math.max(low,Math.min(high,v)),turn=(v:number)=>(v%360+360)%360,hundredths=(v:number)=>Math.round(v*100)/100;
interface Box {left:number;top:number;right:number;bottom:number;}
const childBox=(n:DesignNode,c:DesignNode):Box=>{const w=layoutSpan(c,'width'),h=layoutSpan(c,'height'),cx=c.x-n.x+c.width/2,cy=c.y-n.y+c.height/2;return {left:cx-w/2,top:cy-h/2,right:cx+w/2,bottom:cy+h/2};};
/** Children in reading order, split into wrapped lines by where layout actually put them. */
function flowLines(boxes:Box[],horizontal:boolean,wrap:boolean){const start=horizontal?'left':'top',crossStart=horizontal?'top':'left',crossEnd=horizontal?'bottom':'right';if(!wrap)return [[...boxes].sort((a,b)=>a[start]-b[start])];const lines:Box[][]=[];for(const box of [...boxes].sort((a,b)=>a[crossStart]-b[crossStart])){const line=lines.find(l=>box[crossStart]<Math.max(...l.map(i=>i[crossEnd]))&&box[crossEnd]>Math.min(...l.map(i=>i[crossStart])));if(line)line.push(box);else lines.push([box]);}return lines.map(l=>l.sort((a,b)=>a[start]-b[start]));}
/** Padding bars sit in the middle of their strip, far enough in to clear the resize edge when the padding is small. */
export function spacingHandles(n:DesignNode,nodes:DesignNode[],zoom:number):SpacingHandle[]{
 if(n.layout==='none'||!FRAMES.includes(n.type)||n.instanceRootId||isLocked(n,nodes)||n.width*zoom<MIN_SPACING||n.height*zoom<MIN_SPACING)return [];
 const m=worldMatrix(n,nodes),at=(x:number,y:number)=>point(m,x,y),rect=(x:number,y:number,w:number,h:number)=>[at(x,y),at(x+w,y),at(x+w,y+h),at(x,y+h)],W=n.width,H=n.height,half=8/zoom,clear=7/zoom,[top,right,bottom,left]=layoutPadding(n),values=paddingFor(n),inset=(v:number)=>Math.max(v/2,clear),out:SpacingHandle[]=[];
 const across=(x:number,y:number,along:'x'|'y')=>along==='x'?{from:at(x-half,y),to:at(x+half,y)}:{from:at(x,y-half),to:at(x,y+half)};
 const pad=(side:number,axis:'x'|'y',zone:Point[],x:number,y:number)=>out.push({key:'padding:'+side,id:n.id,axis,value:values[side],zone,...across(x,y,axis==='y'?'x':'y')});
 pad(0,'y',rect(0,0,W,top),W/2,inset(top));pad(1,'x',rect(W-right,0,right,H),W-inset(right),H/2);pad(2,'y',rect(0,H-bottom,W,bottom),W/2,H-inset(bottom));pad(3,'x',rect(0,0,left,H),inset(left),H/2);
 const kids=nodes.filter(c=>c.parentId===n.id&&c.visible&&!c.ignoreLayout),gap=(axis:'x'|'y',index:number,zone:Point[],x:number,y:number,value:number)=>{if(index<MAX_GAPS)out.push({key:`gap:${axis}:${index}`,id:n.id,axis,value,zone,...across(x,y,axis==='x'?'y':'x')});},gx=n.gapX??n.gap,gy=n.gapY??n.gap,contentW=Math.max(0,W-left-right),contentH=Math.max(0,H-top-bottom);
 if(n.layout==='grid'){const g=gridGeometry(n,kids),rowsEnd=g.rows.length?g.rowOffsets.at(-1)!+g.rows.at(-1)!:top,columnsEnd=g.columns.length?g.columnOffsets.at(-1)!+g.columns.at(-1)!:left;g.columns.slice(0,-1).forEach((size,i)=>{const x=g.columnOffsets[i]+size;gap('x',i,rect(x,top,gx,rowsEnd-top),x+gx/2,g.rowOffsets[0]+(g.rows[0]??0)/2,gx);});g.rows.slice(0,-1).forEach((size,i)=>{const y=g.rowOffsets[i]+size;gap('y',i,rect(left,y,columnsEnd-left,gy),g.columnOffsets[0]+(g.columns[0]??0)/2,y+gy/2,gy);});return out;}
 const horizontal=n.layout==='horizontal',lines=flowLines(kids.map(c=>childBox(n,c)),horizontal,!!n.wrap);let index=0;
 for(const line of lines){const low=n.wrap?Math.min(...line.map(b=>horizontal?b.top:b.left)):horizontal?top:left,high=n.wrap?Math.max(...line.map(b=>horizontal?b.bottom:b.right)):horizontal?top+contentH:left+contentW;for(let i=0;i+1<line.length;i++){const a=horizontal?line[i].right:line[i].bottom,b=horizontal?line[i+1].left:line[i+1].top,visual=b-a,value=SPREAD.includes(n.justifyContent??'')?visual:horizontal?gx:gy;if(horizontal)gap('x',index++,rect(a,low,visual,high-low),a+visual/2,(low+high)/2,value);else gap('y',index++,rect(low,a,high-low,visual),(low+high)/2,a+visual/2,value);}}
 if(n.wrap)for(let i=0;i+1<lines.length;i++){const a=Math.max(...lines[i].map(b=>horizontal?b.bottom:b.right)),b=Math.min(...lines[i+1].map(c=>horizontal?c.top:c.left)),visual=b-a,value=SPREAD.includes(n.wrapAlign??'')?visual:horizontal?gy:gx;if(horizontal)gap('y',i,rect(left,a,contentW,visual),left+contentW/2,a+visual/2,value);else gap('x',i,rect(a,top,visual,contentH),a+visual/2,top+contentH/2,value);}
 return out;
}
/** Convex quad test: the zone a pointer is over decides which strip lights up. */
export function spacingZoneAt(handles:readonly SpacingHandle[],p:Point){const found=handles.find(h=>{let sign=0;for(let i=0;i<4;i++){const a=h.zone[i],b=h.zone[(i+1)%4],cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);if(Math.abs(cross)<1e-9)continue;if(sign&&Math.sign(cross)!==sign)return false;sign=Math.sign(cross);}return sign!==0;});return found&&found.id+':'+found.key;}
const cornerRadii=(n:DesignNode):number[]=>{const max=Math.min(n.width,n.height)/2;return (n.corners??[n.radius,n.radius,n.radius,n.radius]).map(r=>Math.min(max,r));};
const CORNER_SIGN=[[1,1],[-1,1],[-1,-1],[1,-1]];
const arcOf=(n:DesignNode)=>({start:n.arcStart??0,sweep:clamp(n.arcSweep??360,-360,360),inner:clamp(n.arcInner??0,0,.999)});
export function shapeHandles(n:DesignNode,nodes:DesignNode[],zoom:number):ShapeHandle[]{
 if(isLocked(n,nodes)||n.booleanOp)return [];
 const m=worldMatrix(n,nodes),side=Math.min(n.width,n.height),mark=(key:string,x:number,y:number,label:string):ShapeHandle=>({key,id:n.id,...point(m,x,y),label});
 if(BOXES.includes(n.type)){if(side*zoom<MIN_BOX)return [];const reach=side/2,radii=cornerRadii(n);return ['Top left','Top right','Bottom right','Bottom left'].map((name,i)=>{const inset=Math.min(reach,Math.max(radii[i],12/zoom)),[sx,sy]=CORNER_SIGN[i];return mark('radius:'+i,sx>0?inset:n.width-inset,sy>0?inset:n.height-inset,name+' corner radius');});}
 if(n.instanceRootId)return [];
 if(n.type==='polygon'||n.type==='star'){if(side*zoom<MIN_SHAPE)return [];const out=[mark('shape-radius',n.width/2,Math.min(side/2,Math.max(n.radius,14/zoom)),'Corner radius')];if(n.type==='star'){const inner=shapePoints(n)[1];out.push(mark('star-ratio',inner.x,inner.y,'Star ratio'));}return out;}
 if(n.type==='ellipse'){if(side*zoom<MIN_ARC)return [];const {start,sweep,inner}=arcOf(n),rx=n.width/2,ry=n.height/2,on=(degrees:number,r:number)=>{const a=degrees*Math.PI/180;return [rx+Math.cos(a)*rx*r,ry+Math.sin(a)*ry*r] as const;},full=Math.abs(sweep)>=359.999,out=[mark('arc-end',...on(start+sweep,1),'Arc sweep'),mark('arc-ratio',...on(start+sweep/2,inner),'Arc ratio')];if(!full)out.unshift(mark('arc-start',...on(start,1),'Arc start'));return out;}
 return [];
}
const paddingPatch=(n:DesignNode,sides:number[],value:number):Partial<DesignNode>=>{const next=[...paddingFor(n)] as [number,number,number,number];for(const side of sides)next[side]=value;return next.every(v=>v===next[0])?{padding:next[0],paddings:undefined}:{padding:n.padding,paddings:next};};
/** Gaps of a single line keep the shared field. Wrapped and grid layouts hold each axis apart. A spread layout has no fixed gap, so dragging one gives it a fixed value. */
function gapPatch(n:DesignNode,axis:'x'|'y',value:number):Partial<DesignNode>{const patch:Partial<DesignNode>=n.layout==='grid'||n.wrap?{gap:n.gap,gapX:axis==='x'?value:n.gapX??n.gap,gapY:axis==='y'?value:n.gapY??n.gap}:{gap:value,[axis==='x'?'gapX':'gapY']:undefined};if(n.layout!=='grid'){const main=n.layout==='horizontal'?'x':'y';if(axis===main&&SPREAD.includes(n.justifyContent??''))patch.justifyContent='start';if(axis!==main&&SPREAD.includes(n.wrapAlign??''))patch.wrapAlign='start';}return patch;}
function sweepTo(next:number,start:number,memo:HandleMemo){const known=memo.sweep??(Math.abs(start)>=359.999?undefined:start);let sweep=next;if(known!==undefined&&Math.abs(sweep-known)>270)sweep=known>180?360:0;memo.sweep=sweep;return sweep;}
/** `n` and `nodes` are the layer as the gesture started, so a frame that grows under the pointer cannot feed back into the drag. */
export function canvasHandleDrag(handle:{key:string;value?:number},n:DesignNode,nodes:DesignNode[],start:Point,pointer:Point,mods:HandleModifiers,memo:HandleMemo):HandleDrag{
 const inverse=inverseMatrix(worldMatrix(n,nodes)),a=point(inverse,start.x,start.y),b=point(inverse,pointer.x,pointer.y),dx=b.x-a.x,dy=b.y-a.y,[kind,part]=handle.key.split(':');
 if(kind==='padding'){const side=Number(part),inward=[dy,-dx,-dy,dx][side],value=Math.max(0,Math.min(1e6,Math.round((handle.value??0)+inward))),sides=mods.shift?[0,1,2,3]:mods.alt?[side,(side+2)%4]:[side];return {patch:paddingPatch(n,sides,value),text:String(value)};}
 if(kind==='gap'){const axis=part as 'x'|'y',from=handle.value??0,value=Math.max(Math.min(0,from),Math.min(1e6,Math.round(from+(axis==='x'?dx:dy))));return {patch:gapPatch(n,axis,value),text:String(value)};}
 if(kind==='radius'){const i=Number(part),[sx,sy]=CORNER_SIGN[i],radii=cornerRadii(n),value=clamp(Math.round(radii[i]+(dx*sx+dy*sy)/2),0,Math.floor(Math.min(n.width,n.height)/2));if(!mods.alt)return {patch:{radius:value,corners:undefined},text:String(value)};const corners=[...(n.corners??[n.radius,n.radius,n.radius,n.radius])] as [number,number,number,number];corners[i]=value;return {patch:{radius:n.radius,corners},text:String(value)};}
 if(kind==='shape-radius'){const value=clamp(Math.round(Math.min(n.radius,Math.min(n.width,n.height)/2)+dy),0,Math.floor(Math.min(n.width,n.height)/2));return {patch:{radius:value},text:String(value)};}
 const rx=n.width/2||1,ry=n.height/2||1,nx=(b.x-rx)/rx,ny=(b.y-ry)/ry;
 if(kind==='star-ratio'){const a=-Math.PI/2+Math.PI/Math.max(3,Math.min(100,Math.round(n.pointCount??5))),value=hundredths(clamp(nx*Math.cos(a)+ny*Math.sin(a),.01,.99));return {patch:{innerRadius:value},text:Math.round(value*100)+'%'};}
 const arc=arcOf(n);
 if(kind==='arc-ratio'){const value=hundredths(clamp(Math.hypot(nx,ny),0,.99));return {patch:{arcInner:value<.01?0:value},text:Math.round(value*100)+'%'};}
 let angle=turn(Math.atan2(ny,nx)*180/Math.PI);if(mods.shift)angle=turn(Math.round(angle/15)*15);
 if(kind==='arc-end'){const sweep=hundredths(sweepTo(turn(angle-arc.start),arc.sweep,memo));return {patch:{arcSweep:sweep},text:Math.round(sweep/3.6)+'%'};}
 if(kind==='arc-start'){const sweep=hundredths(sweepTo(turn(arc.start+arc.sweep-angle),arc.sweep,memo));return {patch:{arcStart:hundredths(turn(arc.start+arc.sweep-sweep)),arcSweep:sweep},text:Math.round(sweep/3.6)+'%'};}
 throw Error('Unknown canvas handle.');
}
/** Layers are copied one level deep: reflow only writes their own geometry, and this runs on every pointer move. */
export function handlePreview(nodes:DesignNode[],id:string,patch:Partial<DesignNode>){const out=nodes.map(n=>n.id===id?{...n,...patch}:{...n});reflow(out);return out;}
export const handleChanged=(n:DesignNode,patch:Partial<DesignNode>)=>Object.entries(patch).some(([key,value])=>JSON.stringify(n[key as keyof DesignNode])!==JSON.stringify(value));
