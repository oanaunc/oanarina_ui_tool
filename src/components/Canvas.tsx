import {useEffect,useRef,useState} from 'react';
import {bounds,descendants,effectiveVisible,isLocked,node,uid} from '../model';
import {contourPath,geometry,insertVectorPoint,pathProperties,vectorOperation} from '../geometry';
import {runCommand} from '../commands';
import type {DesignNode,NodeKind,VectorPoint} from '../model';
import {useEditor} from '../store';
import {Artwork} from './Artwork';
import {importImages,notifyError} from '../files';
interface Drag {kind:'move'|'create'|'pan'|'marquee'|'resize'|'pencil'|'vector'|'pen-handle';start:{x:number;y:number};screen:{x:number;y:number};nodes:DesignNode[];ids:string[];draft?:DesignNode;handle?:string;pointKeys?:string[];vectorPart?:'anchor'|'in'|'out';pan:{x:number;y:number};}
export default function Canvas(){
 const s=useEditor(),page=s.doc.pages.find(p=>p.id===s.pageId)!;
 const svg=useRef<SVGSVGElement>(null),drag=useRef<Drag|null>(null),space=useRef(false);
 const [preview,setPreview]=useState<DesignNode[]|null>(null),[box,setBox]=useState<ReturnType<typeof bounds>|null>(null),[pen,setPen]=useState<VectorPoint[]>([]);
 const [editText,setEditText]=useState<string|null>(null),[context,setContext]=useState<{x:number;y:number}|null>(null);
 const ns=preview??page.nodes;
 const selected=ns.filter(n=>s.selection.includes(n.id)),b=bounds(selected);
 const world=(e:{clientX:number;clientY:number})=>{const r=svg.current!.getBoundingClientRect();return {x:(e.clientX-r.left-s.pan.x)/s.zoom,y:(e.clientY-r.top-s.pan.y)/s.zoom};};
 const completePen=(closed=false)=>{if(pen.length>1){const b=bounds(pen.map(p=>node('rectangle',{...p,width:0,height:0})));const source=node('path',{...b,fill:closed?'#d8c9f2':'none',points:pen.map(p=>({...p,x:p.x-b.x,y:p.y-b.y})),closed,name:'Vector'});const path=geometry(source);const props=pathProperties(path);path.remove();s.add('path',{...source,...props});}setPen([]);};

 useEffect(()=>{const down=(e:KeyboardEvent)=>{if((e.target as HTMLElement).matches('input,textarea,[contenteditable]'))return;if(e.code==='Space'){space.current=true;e.preventDefault();}if(e.key==='Enter')completePen();if(e.key==='Escape'){setPen([]);setEditText(null);setPreview(null);drag.current=null;}};const up=(e:KeyboardEvent)=>{if(e.code==='Space')space.current=false;};window.addEventListener('keydown',down);window.addEventListener('keyup',up);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};},[pen]);
 useEffect(()=>{const el=svg.current;if(!el)return;const wheel=(e:WheelEvent)=>{e.preventDefault();const st=useEditor.getState();if(e.metaKey||e.ctrlKey){const r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,z=Math.min(8,Math.max(.05,st.zoom*Math.exp(-e.deltaY*.01)));st.set({zoom:z,pan:{x:x-(x-st.pan.x)*z/st.zoom,y:y-(y-st.pan.y)*z/st.zoom}});}else st.set({pan:{x:st.pan.x-e.deltaX,y:st.pan.y-e.deltaY}});};el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);},[]);
 const begin=(e:React.PointerEvent,id?:string,handle?:string)=>{
 if(e.button===2)return;e.stopPropagation();if(s.vectorEditId&&id!==s.vectorEditId&&!handle){runCommand('edit-vector');if(id)s.select(id);return;}setContext(null);if(editText)return;const p=world(e);let ids=s.selection;
 if(space.current||s.tool==='hand'||e.button===1){drag.current={kind:'pan',start:p,screen:{x:e.clientX,y:e.clientY},nodes:page.nodes,ids:[],pan:s.pan};}
 else if(handle){drag.current={kind:'resize',start:p,screen:{x:e.clientX,y:e.clientY},nodes:structuredClone(page.nodes),ids:descendants(page.nodes,s.selection),handle,pan:s.pan};}
 else if(s.tool==='comment'){s.set({modal:'comment:'+p.x+','+p.y});return;}
 else if(s.tool==='pen'){if(pen.length>2&&Math.hypot(p.x-pen[0].x,p.y-pen[0].y)<7/s.zoom){completePen(true);return;}setPen([...pen,{...p,mode:'mirrored'}]);drag.current={kind:'pen-handle',start:p,screen:{x:e.clientX,y:e.clientY},nodes:page.nodes,ids:[],pan:s.pan};svg.current!.setPointerCapture(e.pointerId);return;}
 else if(!['move','scale'].includes(s.tool)){
 const type:NodeKind=s.tool==='pencil'?'path':s.tool as NodeKind;
 const parent=page.nodes.filter(n=>['frame','section','component'].includes(n.type)&&p.x>=n.x&&p.y>=n.y&&p.x<n.x+n.width&&p.y<n.y+n.height).at(-1);
 const draft=node(type,{x:p.x,y:p.y,width:0,height:0,parentId:parent?.id??null,...(type==='path'?{points:[{x:0,y:0}],fill:'none'}:{})});
 drag.current={kind:s.tool==='pencil'?'pencil':'create',start:p,screen:{x:e.clientX,y:e.clientY},nodes:page.nodes,ids:[],draft,pan:s.pan};
 } else if(id){const n=page.nodes.find(n=>n.id===id)!;if(isLocked(n,page.nodes))return;if(!s.selection.includes(id)||e.shiftKey){s.select(id,e.shiftKey);ids=useEditor.getState().selection;}drag.current={kind:'move',start:p,screen:{x:e.clientX,y:e.clientY},nodes:structuredClone(page.nodes),ids:descendants(page.nodes,ids),pan:s.pan};}
 else {if(!e.shiftKey)s.set({selection:[]});drag.current={kind:'marquee',start:p,screen:{x:e.clientX,y:e.clientY},nodes:page.nodes,ids:s.selection,pan:s.pan};}
 svg.current!.setPointerCapture(e.pointerId);e.stopPropagation();
 };
 const update=(e:React.PointerEvent)=>{
 const d=drag.current;if(!d)return;const p=world(e);let dx=p.x-d.start.x,dy=p.y-d.start.y;
 if(d.kind==='pen-handle'){setPen(prev=>prev.map((point,i)=>i===prev.length-1?{...point,in:{x:-dx,y:-dy},out:{x:dx,y:dy}}:point));return;}
 if(d.kind==='vector'){const original=d.nodes.find(n=>n.id===s.vectorEditId);if(!original?.contours)return;const angle=-original.rotation*Math.PI/180,sx=original.width/(original.pathWidth||original.width||1),sy=original.height/(original.pathHeight||original.height||1),vx=(dx*Math.cos(angle)-dy*Math.sin(angle))/sx*(original.flipX?-1:1),vy=(dx*Math.sin(angle)+dy*Math.cos(angle))/sy*(original.flipY?-1:1);const contours=structuredClone(original.contours);for(const key of d.pointKeys??[]){const [ci,pi]=key.split(':').map(Number),point=contours[ci].points[pi];if(d.vectorPart==='anchor'){point.x+=vx;point.y+=vy;}else{const part=d.vectorPart!,other=part==='in'?'out':'in';point[part]={x:(point[part]?.x??0)+vx,y:(point[part]?.y??0)+vy};if(!e.altKey&&point.mode!=='independent'){const length=point.mode==='aligned'?Math.hypot(point[other]?.x??0,point[other]?.y??0)/Math.max(.001,Math.hypot(point[part]!.x,point[part]!.y)):1;point[other]={x:-point[part]!.x*length,y:-point[part]!.y*length};}}}setPreview(d.nodes.map(n=>n.id===original.id?{...n,contours}:n));return;}
 if(d.kind==='pan'){s.set({pan:{x:d.pan.x+e.clientX-d.screen.x,y:d.pan.y+e.clientY-d.screen.y}});return;}
 if(d.kind==='marquee'){setBox({x:Math.min(p.x,d.start.x),y:Math.min(p.y,d.start.y),width:Math.abs(dx),height:Math.abs(dy)});return;}
 if(d.kind==='create'&&d.draft){if(e.shiftKey){const size=Math.max(Math.abs(dx),Math.abs(dy));dx=Math.sign(dx)*size;dy=Math.sign(dy)*size;}d.draft={...d.draft,x:Math.min(d.start.x,d.start.x+dx),y:Math.min(d.start.y,d.start.y+dy),width:Math.abs(dx),height:Math.abs(dy)};setPreview([...d.nodes,d.draft]);return;}
 if(d.kind==='pencil'&&d.draft){d.draft.points.push({x:dx,y:dy});setPreview([...d.nodes,{...d.draft}]);return;}
 if(d.kind==='move'){if(e.shiftKey){if(Math.abs(dx)>Math.abs(dy))dy=0;else dx=0;}if(s.snap){dx=Math.round(dx);dy=Math.round(dy);}setPreview(d.nodes.map(n=>d.ids.includes(n.id)?{...n,x:n.x+dx,y:n.y+dy}:n));return;}
 if(d.kind==='resize'){const b=bounds(d.nodes.filter(n=>s.selection.includes(n.id)));let x=b.x,y=b.y,w=b.width,h=b.height;const handle=d.handle!;if(handle.includes('e'))w=Math.max(1,b.width+dx);if(handle.includes('s'))h=Math.max(1,b.height+dy);if(handle.includes('w')){w=Math.max(1,b.width-dx);x=b.x+b.width-w;}if(handle.includes('n')){h=Math.max(1,b.height-dy);y=b.y+b.height-h;}if(e.shiftKey)h=w*b.height/b.width;
 const sx=w/b.width,sy=h/b.height;const frameResize=s.tool!=='scale'&&s.selection.length===1&&d.nodes.some(n=>s.selection.includes(n.id)&&['frame','component','instance'].includes(n.type));setPreview(d.nodes.map(n=>frameResize&&d.ids.includes(n.id)&&!s.selection.includes(n.id)?{...n,x:n.x+x-b.x,y:n.y+y-b.y}:d.ids.includes(n.id)?{...n,...(n.type==='path'?{pathWidth:n.pathWidth??n.width,pathHeight:n.pathHeight??n.height}:{}),x:x+(n.x-b.x)*sx,y:y+(n.y-b.y)*sy,width:Math.max(1,n.width*sx),height:Math.max(1,n.height*sy),...(s.tool==='scale'?{fontSize:n.fontSize*sx,radius:n.radius*sx,strokeWidth:n.strokeWidth*sx}:{})}:n));}
 };
 const finish=(e:React.PointerEvent)=>{const d=drag.current;if(!d)return;drag.current=null;if(svg.current?.hasPointerCapture(e.pointerId))svg.current.releasePointerCapture(e.pointerId);
 if(d.kind==='pen-handle')return;
 if(d.kind==='marquee'&&box){s.set({selection:[...new Set([...(e.shiftKey?d.ids:[]),...page.nodes.filter(n=>!isLocked(n,page.nodes)&&effectiveVisible(n,page.nodes)&&n.x>=box.x&&n.y>=box.y&&n.x+n.width<=box.x+box.width&&n.y+n.height<=box.y+box.height).map(n=>n.id)])]});}
 else if((d.kind==='create'||d.kind==='pencil')&&d.draft){const n=d.draft;const clicked=d.kind==='create'&&n.width<3&&n.height<3;if(clicked){n.width=n.type==='frame'?390:160;n.height=n.type==='frame'?844:n.type==='text'?40:100;}
 if(n.type==='text'){n.text='Your text';n.height=Math.max(n.height,32);n.textResize=clicked?'auto-width':'fixed';}
 if(d.kind==='pencil'){const bb=bounds(n.points.map(p=>node('rectangle',{...p,width:0,height:0})));n.x+=bb.x;n.y+=bb.y;n.points=n.points.map(p=>({x:p.x-bb.x,y:p.y-bb.y}));n.width=bb.width;n.height=bb.height;}
 if(d.kind==='pencil'&&n.points.length>2)Object.assign(n,vectorOperation(n,'simplify'));
 s.edit(doc=>doc.pages.find(p=>p.id===s.pageId)!.nodes.push(n));s.set({selection:[n.id],tool:'move'});if(n.type==='text')setEditText(n.id);
 }else if(preview&&['move','resize','vector'].includes(d.kind)){s.edit(doc=>{doc.pages.find(p=>p.id===s.pageId)!.nodes=preview;});}
 setPreview(null);setBox(null);
 };
 const beginPoint=(e:React.PointerEvent,key:string,part:'anchor'|'in'|'out')=>{e.stopPropagation();const source=page.nodes.find(n=>n.id===s.vectorEditId);if(!source||isLocked(source,page.nodes))return;const keys=part==='anchor'?(e.shiftKey?(s.vectorSelection.includes(key)?s.vectorSelection.filter(k=>k!==key):[...s.vectorSelection,key]):s.vectorSelection.includes(key)?s.vectorSelection:[key]):[key];s.set({vectorSelection:keys});drag.current={kind:'vector',start:world(e),screen:{x:e.clientX,y:e.clientY},nodes:structuredClone(page.nodes),ids:[source.id],pointKeys:keys,vectorPart:part,pan:s.pan};svg.current!.setPointerCapture(e.pointerId);};
 const vector=ns.find(n=>n.id===s.vectorEditId);
 const textNode=page.nodes.find(n=>n.id===editText);
 return <div className={'canvas-wrap '+(s.rulers?'with-rulers':'')} data-canvas onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();importImages([...e.dataTransfer.files]).catch(notifyError);}}>
 {s.rulers&&<><div className="ruler ruler-top">{Array.from({length:30},(_,i)=><span key={i}>{i*100}</span>)}</div><div className="ruler ruler-left">px</div></>}
 <svg ref={svg} className={'canvas tool-'+s.tool} onPointerDown={e=>begin(e)} onPointerMove={update} onPointerUp={finish} onPointerCancel={()=>{drag.current=null;setPreview(null);setBox(null);}} onContextMenu={e=>{e.preventDefault();setContext({x:e.clientX,y:e.clientY});}} onDoubleClick={e=>{const id=(e.target as Element).closest('[data-node-id]')?.getAttribute('data-node-id');if(id&&s.vectorEditId===id){const source=page.nodes.find(n=>n.id===id)!;s.patch([id],insertVectorPoint(source,world(e)));}else if(id&&page.nodes.find(n=>n.id===id)?.type==='text')setEditText(id);else if(s.tool==='pen')completePen();else if(id){s.select(id);runCommand('edit-vector');}}}>
 <defs><pattern id="dots" width={s.zoom*16} height={s.zoom*16} patternUnits="userSpaceOnUse" x={s.pan.x} y={s.pan.y}><circle cx="1" cy="1" r=".7" fill="#77717e"/></pattern></defs>
 {s.grid&&<rect width="100%" height="100%" fill="url(#dots)" pointerEvents="none"/>}
 <g transform={`translate(${s.pan.x} ${s.pan.y}) scale(${s.zoom})`}>
 {ns.filter(n=>['frame','section','component'].includes(n.type)&&!n.parentId&&n.visible).map(n=><text key={n.id} x={n.x} y={n.y-14/s.zoom} fill={n.type==='component'?'#b89af3':'#a29da9'} fontSize={11/s.zoom} onPointerDown={e=>begin(e,n.id)}>{n.type==='component'?'◇  ':'▦  '}{n.name}</text>)}
 <Artwork nodes={ns} outlines={s.outlines} onNode={(e,id)=>begin(e,id)}/>
 {pen.length>0&&<path d={contourPath(pen)} fill="none" stroke="#c7adf4" strokeWidth={2/s.zoom}/>}
 {pen.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r={3/s.zoom} fill="#fff"/>)}
 {selected.length>0&&!s.vectorEditId&&<g className="selection"><rect x={b.x} y={b.y} width={b.width} height={b.height} fill="none" stroke="#bfa4f4" strokeWidth={1/s.zoom} pointerEvents="none"/>
 {(['nw','n','ne','w','e','sw','s','se'] as const).map(h=>{const x=h.includes('w')?b.x:h.includes('e')?b.x+b.width:b.x+b.width/2,y=h.includes('n')?b.y:h.includes('s')?b.y+b.height:b.y+b.height/2;return <rect key={h} x={x-3/s.zoom} y={y-3/s.zoom} width={6/s.zoom} height={6/s.zoom} fill="#e6dcf8" stroke="#9874d2" strokeWidth={1/s.zoom} style={{cursor:h+'-resize'}} onPointerDown={e=>begin(e,undefined,h)}/>;})}
 <rect x={b.x+b.width/2-38/s.zoom} y={b.y+b.height+12/s.zoom} width={76/s.zoom} height={21/s.zoom} rx={4/s.zoom} fill="#ba9ce9"/>
 <text x={b.x+b.width/2} y={b.y+b.height+26/s.zoom} textAnchor="middle" fontSize={10/s.zoom} fill="#221d2d">{Math.round(b.width)} × {Math.round(b.height)}</text></g>}
 {vector?.contours&&<g transform={`translate(${vector.x} ${vector.y}) rotate(${vector.rotation} ${vector.width/2} ${vector.height/2}) translate(${vector.width/2} ${vector.height/2}) scale(${vector.flipX?-1:1} ${vector.flipY?-1:1}) translate(${-vector.width/2} ${-vector.height/2}) scale(${vector.width/(vector.pathWidth||vector.width||1)} ${vector.height/(vector.pathHeight||vector.height||1)})`}>
 {vector.contours.flatMap((contour,ci)=>contour.points.map((p,pi)=>{const key=ci+':'+pi,active=s.vectorSelection.includes(key),r=3/s.zoom;return <g key={key}>{active&&(['in','out'] as const).map(part=>{const h=p[part];return h&&Math.hypot(h.x,h.y)>.01?<g key={part}><line x1={p.x} y1={p.y} x2={p.x+h.x} y2={p.y+h.y} stroke="#bba0ed" strokeWidth={1/s.zoom}/><circle cx={p.x+h.x} cy={p.y+h.y} r={r} fill="#aaa0ba" stroke="#2d233b" strokeWidth={1/s.zoom} onPointerDown={e=>beginPoint(e,key,part)}/></g>:null;})}<rect data-vector-key={key} role="button" aria-label={'Vector point '+key} x={p.x-r} y={p.y-r} width={r*2} height={r*2} fill={active?'#ba97ed':'#f4eefb'} stroke="#9d73cd" strokeWidth={1/s.zoom} onPointerDown={e=>beginPoint(e,key,'anchor')}/></g>;}))}</g>}
 {box&&<rect {...box} fill="#bb9df320" stroke="#bfa4f4" strokeWidth={1/s.zoom}/>}
 {page.comments.filter(c=>!c.resolved).map((c,i)=><g key={c.id} transform={`translate(${c.x} ${c.y})`} onPointerDown={e=>{e.stopPropagation();s.set({modal:'comments'});}} style={{cursor:'pointer'}}><circle r={13/s.zoom} fill="#e7b5d1"/><text textAnchor="middle" y={4/s.zoom} fontSize={11/s.zoom} fill="#28212c">{i+1}</text></g>)}
 </g></svg>
 {textNode&&<textarea aria-label="Edit text" autoFocus className="canvas-text-editor" style={{left:textNode.x*s.zoom+s.pan.x,top:textNode.y*s.zoom+s.pan.y,width:Math.max(150,textNode.width*s.zoom),height:Math.max(60,textNode.height*s.zoom+20),fontSize:textNode.fontSize*s.zoom,fontFamily:textNode.fontFamily}} defaultValue={textNode.text} onBlur={e=>{s.patch([textNode.id],{text:e.target.value});setEditText(null);}} onKeyDown={e=>{if(e.key==='Escape')e.currentTarget.blur();e.stopPropagation();}}/>}
 <div className="canvas-bottom"><span><i className="live-dot"/> Local workspace</span><span>{s.tool==='pen'?'Click to add points · Enter to finish':s.tool==='move'?'Space to pan · ⌘ scroll to zoom':s.tool+' · Drag to draw'}</span></div>
 {context&&<div className="context-menu menu" style={{left:context.x,top:context.y}} onMouseLeave={()=>setContext(null)}>{[['copy','Copy'],['paste','Paste'],['duplicate','Duplicate'],['group','Group selection'],['component','Create component'],['front','Bring to front'],['back','Send to back'],['delete','Delete']].map(([id,label])=><button key={id} onClick={()=>{window.dispatchEvent(new CustomEvent('command',{detail:id}));setContext(null);}}>{label}</button>)}</div>}
 <button className="help-fab" title="Help and keyboard shortcuts" onClick={()=>s.set({modal:'shortcuts'})}>?</button>
 </div>;
}
export function addComment(text:string,x:number,y:number){const s=useEditor.getState();s.edit(d=>d.pages.find(p=>p.id===s.pageId)!.comments.push({id:uid(),x,y,text,resolved:false}));}
