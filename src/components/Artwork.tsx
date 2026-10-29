import {effectiveVisible,polygonPoints} from '../model';
import type {DesignNode} from '../model';
export function Artwork({nodes,outlines=false,onNode}:{nodes:DesignNode[];outlines?:boolean;onNode?:(e:React.PointerEvent,id:string)=>void}) {
 return <>{nodes.map(n=><defs key={'def'+n.id}>
  <clipPath id={'clip'+n.id}><rect x={n.x} y={n.y} width={n.width} height={n.height} rx={n.radius}/></clipPath>
  <linearGradient id={'grad'+n.id} x1="0" x2="1"><stop stopColor={n.fill}/><stop offset="1" stopColor={n.fill} stopOpacity=".55"/></linearGradient>
  {(n.shadow||n.blur>0)&&<filter id={'fx'+n.id} x="-50%" y="-50%" width="200%" height="200%">{n.blur>0&&<feGaussianBlur stdDeviation={n.blur}/>} {n.shadow&&<feDropShadow dx="0" dy="5" stdDeviation="8" floodOpacity=".18"/>}</filter>}
 </defs>)}{nodes.filter(n=>effectiveVisible(n,nodes)&&n.type!=='slice').map(n=>{
 const noFill=['group','section','path','line','arrow'].includes(n.type)&&n.fill==='none';
 const props={fill:outlines?'none':noFill?'none':n.gradient?`url(#grad${n.id})`:n.fill||'none',stroke:outlines?'#a8a3b4':n.stroke||'none',strokeWidth:outlines?1:n.strokeWidth};
 let shape:React.ReactNode;
 if(n.type==='text')shape=<text {...props} fontFamily={`${n.fontFamily}, system-ui, sans-serif`} fontSize={n.fontSize} fontWeight={n.fontWeight} letterSpacing={n.letterSpacing} textAnchor={n.textAlign==='left'?'start':n.textAlign==='center'?'middle':'end'} xmlSpace="preserve">{n.text.split('\n').map((t,i)=><tspan key={i} x={n.textAlign==='left'?0:n.textAlign==='center'?n.width/2:n.width} y={n.fontSize+i*n.fontSize*n.lineHeight}>{t||' '}</tspan>)}</text>;
 else if(n.type==='ellipse')shape=<ellipse {...props} cx={n.width/2} cy={n.height/2} rx={n.width/2} ry={n.height/2}/>;
 else if(n.type==='line'||n.type==='arrow')shape=<><line {...props} x1="0" y1="0" x2={n.width} y2={n.height}/>{n.type==='arrow'&&<path d={`M ${n.width-12} ${n.height-6} L ${n.width} ${n.height} L ${n.width-12} ${n.height+6}`} fill="none" stroke={n.stroke||'#282631'} strokeWidth={n.strokeWidth} transform={`rotate(${Math.atan2(n.height,n.width)*180/Math.PI} ${n.width} ${n.height})`}/>}</>;
 else if(n.type==='polygon'||n.type==='star')shape=<polygon {...props} points={polygonPoints(n)}/>;
 else if(n.type==='path')shape=<path {...props} d={n.points.length?n.points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' '):n.path} strokeLinecap="round" strokeLinejoin="round"/>;
 else if(n.type==='image')shape=<image href={n.image} width={n.width} height={n.height} preserveAspectRatio="xMidYMid slice"/>;
 else shape=<rect {...props} width={n.width} height={n.height} rx={n.radius}/>;
 let opacity=n.opacity,anc=nodes.find(a=>a.id===n.parentId);const clips:string[]=[];
 while(anc){opacity*=anc.opacity;if(anc.clip)clips.push(anc.id);anc=nodes.find(a=>a.id===anc!.parentId);}
 let art=<g data-node-id={n.id} aria-label={n.name} onPointerDown={onNode?e=>onNode(e,n.id):undefined} opacity={opacity} transform={`translate(${n.x} ${n.y}) rotate(${n.rotation} ${n.width/2} ${n.height/2})`} filter={n.shadow||n.blur?`url(#fx${n.id})`:undefined}>{shape}</g>;
 for(const id of clips)art=<g clipPath={`url(#clip${id})`}>{art}</g>;
 return <g key={n.id}>{art}</g>;
 })}</>;
}
