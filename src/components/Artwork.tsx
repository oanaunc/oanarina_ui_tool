import type {CSSProperties} from 'react';
import {effectsFor} from '../effects';
import {EffectFilter} from './EffectFilter';
import {scaledLocalPath} from '../geometry';
import {textLines} from '../text-layout';
import {fillsFor,rasterGradient,strokesFor} from '../paints';
import type {Paint,StrokeStyle} from '../paints';
import type {DesignNode} from '../model';
function paintValue(p:Paint,id:string){return p.type==='solid'?p.color:`url(#${id})`;}
function PaintDefinition({paint:p,id,n}:{paint:Paint;id:string;n:DesignNode}){
 const stops=[...p.stops].sort((a,b)=>a.position-b.position).map(s=><stop key={s.id} offset={s.position} stopColor={s.color} stopOpacity={s.opacity}/>),a=p.angle*Math.PI/180;
 if(p.type==='linear')return <linearGradient id={id} x1={.5-Math.cos(a)/2} y1={.5-Math.sin(a)/2} x2={.5+Math.cos(a)/2} y2={.5+Math.sin(a)/2}>{stops}</linearGradient>;
 if(p.type==='radial')return <radialGradient id={id} cx={p.cx} cy={p.cy} r={p.radius}>{stops}</radialGradient>;
 if(p.type==='angular'||p.type==='diamond')return <pattern id={id} width="1" height="1" patternContentUnits="objectBoundingBox"><image href={rasterGradient(p)} width="1" height="1" preserveAspectRatio="none"/></pattern>;
 if(p.type==='image'){
  const scale=p.scale??1,tile=p.scaleMode==='tile',w=(p.imageWidth??n.width)*scale,h=(p.imageHeight??n.height)*scale;
  return <pattern id={id} width={tile?w:1} height={tile?h:1} patternUnits={tile?'userSpaceOnUse':'objectBoundingBox'} viewBox={tile?`0 0 ${w} ${h}`:`0 0 ${n.width} ${n.height}`} patternTransform={tile?`rotate(${p.angle})`:undefined}><image href={p.image} width={tile?w:n.width*scale} height={tile?h:n.height*scale} x={p.offsetX??0} y={p.offsetY??0} preserveAspectRatio={p.scaleMode==='fit'?'xMidYMid meet':'xMidYMid slice'} transform={tile?undefined:`rotate(${p.angle} ${n.width/2} ${n.height/2})`}/></pattern>;
 }
 return null;
}
function Shape({n,...props}:{n:DesignNode}&React.SVGProps<SVGPathElement>){
 if(n.type==='text')return <text {...props as React.SVGProps<SVGTextElement>} fontFamily={`${n.fontFamily}, system-ui, sans-serif`} fontSize={n.fontSize} fontWeight={n.fontWeight} fontStyle={n.fontStyle??'normal'} textDecoration={n.decorations?.join(' ')} letterSpacing={n.letterSpacing} textAnchor={n.textAlign==='center'?'middle':n.textAlign==='right'?'end':'start'} xmlSpace="preserve" style={{fontSynthesis:'style'}}>{textLines(n).map((line,i)=><tspan key={i} x={n.textAlign==='center'?n.width/2:n.textAlign==='right'?n.width:line.x} y={line.y} textLength={n.textAlign==='justify'&&!line.paragraphEnd?n.width-line.x:undefined} lengthAdjust={n.textAlign==='justify'?'spacing':undefined}>{line.text||' '}</tspan>)}</text>;
 return <path d={scaledLocalPath(n)} {...props} fillRule={n.type==='ellipse'?'evenodd':'nonzero'}/>;
}
function Stroke({n,s,id}:{n:DesignNode;s:StrokeStyle;id:string}){
 const alignment=['line','arrow'].includes(n.type)?'center':s.align;
 const props={fill:'none',stroke:paintValue(s.paint,id),strokeWidth:s.width*(alignment==='center'?1:2),opacity:s.paint.opacity,strokeLinecap:s.cap,strokeLinejoin:s.join,strokeMiterlimit:s.miterLimit,strokeDasharray:s.dash.length?s.dash.join(' '):undefined,strokeDashoffset:s.dashOffset};
 return <g clipPath={alignment==='inside'?`url(#local-clip-${n.id})`:undefined} mask={alignment==='outside'?`url(#outside-mask-${n.id})`:undefined}><Shape n={n} {...props}/>{n.type==='arrow'&&<path d={`M ${n.width-12} ${n.height-6} L ${n.width} ${n.height} L ${n.width-12} ${n.height+6}`} fill="none" stroke={s.paint.color} strokeWidth={s.width} transform={`rotate(${Math.atan2(n.height,n.width)*180/Math.PI} ${n.width} ${n.height})`}/>}</g>;
}
export function Artwork({nodes,outlines=false,onNode}:{nodes:DesignNode[];outlines?:boolean;onNode?:(e:React.PointerEvent,id:string)=>void}) {
 const ids=new Set(nodes.map(n=>n.id)),children=new Map<string|null,DesignNode[]>();
 for(const n of nodes){const parent=n.parentId&&ids.has(n.parentId)?n.parentId:null;const list=children.get(parent)??[];list.push(n);children.set(parent,list);}
 const render=(n:DesignNode,parent?:DesignNode):React.ReactNode=>{
  if(!n.visible||n.type==='slice')return null;
  const content=outlines?<Shape n={n} fill="none" stroke="#a8a3b4" strokeWidth={1}/>:<>
   {fillsFor(n).filter(p=>p.visible&&p.opacity>0).reverse().map(p=><Shape key={p.id} n={n} fill={paintValue(p,`fill-${n.id}-${p.id}`)} stroke="none" opacity={p.opacity}/>)}
   {strokesFor(n).filter(s=>s.visible&&s.width>0&&s.paint.visible).reverse().map(s=><Stroke key={s.id} n={n} s={s} id={`stroke-${n.id}-${s.id}`}/>)}</>;
  return <g key={n.id} data-node-id={n.id} aria-label={n.name} onPointerDown={onNode?e=>{e.stopPropagation();onNode(e,n.id);}:undefined} opacity={n.opacity} transform={`translate(${n.x-(parent?.x??0)} ${n.y-(parent?.y??0)}) rotate(${n.rotation} ${n.width/2} ${n.height/2})`} filter={!outlines&&effectsFor(n).some(e=>e.visible)?`url(#fx${n.id})`:undefined} style={{mixBlendMode:n.blendMode as CSSProperties['mixBlendMode'],isolation:n.isolate?'isolate':undefined}}><g transform={n.flipX||n.flipY?`translate(${n.width/2} ${n.height/2}) scale(${n.flipX?-1:1} ${n.flipY?-1:1}) translate(${-n.width/2} ${-n.height/2})`:undefined}>
   <g clipPath={n.type==='text'&&n.clip?`url(#local-clip-${n.id})`:undefined}>{content}</g>
   {!n.booleanOp&&<g clipPath={n.clip?`url(#local-clip-${n.id})`:undefined}>{(children.get(n.id)??[]).map(c=>render(c,n))}</g>}
  </g></g>;
 };
 return <>{nodes.map(n=><defs key={'def'+n.id}>
  <clipPath id={'local-clip-'+n.id}><Shape n={n}/></clipPath>
  <mask id={'outside-mask-'+n.id} x="-100%" y="-100%" width="300%" height="300%"><rect x={-n.width} y={-n.height} width={n.width*3} height={n.height*3} fill="white"/><Shape n={n} fill="black" stroke="none"/></mask>
  {fillsFor(n).map(p=><PaintDefinition key={p.id} paint={p} id={`fill-${n.id}-${p.id}`} n={n}/>)}
  {strokesFor(n).map(s=><PaintDefinition key={s.id} paint={s.paint} id={`stroke-${n.id}-${s.id}`} n={n}/>)}
  <EffectFilter n={n}/>
 </defs>)}{(children.get(null)??[]).map(n=>render(n))}</>;
}
