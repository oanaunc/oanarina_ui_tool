import {currentTextOutline} from '../text-outline';
import type {CSSProperties} from 'react';
import {effectsFor} from '../effects';
import {EffectFilter} from './EffectFilter';
import {scaledLocalPath} from '../geometry';
import {textLines} from '../text-layout';
import {fontSettings} from '../rich-text';
import {fillsFor,rasterGradient,strokesFor} from '../paints';
import type {Paint,StrokeStyle} from '../paints';
import type {DesignNode} from '../model';
import {maskRegion,maskRuns,vectorPaintVisible} from '../masks';
import type {MaskMode} from '../masks';
function paintValue(p:Paint,id:string){return p.type==='solid'?p.color:`url(#${id})`;}
function PaintDefinition({paint:p,id,n}:{paint:Paint;id:string;n:DesignNode}){
 const stops=[...p.stops].sort((a,b)=>a.position-b.position).map(s=><stop key={s.id} offset={s.position} stopColor={s.color} stopOpacity={s.opacity}/>),a=p.angle*Math.PI/180;
 if(p.type==='linear')return <linearGradient id={id} x1={.5-Math.cos(a)/2} y1={.5-Math.sin(a)/2} x2={.5+Math.cos(a)/2} y2={.5+Math.sin(a)/2}>{stops}</linearGradient>;
 if(p.type==='radial')return <radialGradient id={id} cx={p.cx} cy={p.cy} r={p.radius}>{stops}</radialGradient>;
 if(p.type==='angular'||p.type==='diamond')return <pattern id={id} width="1" height="1" patternContentUnits="objectBoundingBox"><image href={rasterGradient(p)} width="1" height="1" preserveAspectRatio="none"/></pattern>;
 if(p.type==='image'){
  const scale=p.scale??1,tile=p.scaleMode==='tile',w=(p.imageWidth??n.width)*scale,h=(p.imageHeight??n.height)*scale;
  return <pattern id={id} width={tile?w:1} height={tile?h:1} patternUnits={tile?'userSpaceOnUse':'objectBoundingBox'} viewBox={tile?`0 0 ${w} ${h}`:`0 0 ${n.width} ${n.height}`} patternTransform={tile?`rotate(${p.angle})`:undefined}><image href={p.image} width={tile?w:n.width*scale} height={tile?h:n.height*scale} x={p.offsetX??0} y={p.offsetY??0} preserveAspectRatio={p.scaleMode==='stretch'?'none':p.scaleMode==='fit'?'xMidYMid meet':'xMidYMid slice'} transform={tile?undefined:`rotate(${p.angle} ${n.width/2} ${n.height/2})`}/></pattern>;
 }
 return null;
}
function Shape({n,hyperlinks=false,maskVector=false,...props}:{n:DesignNode;hyperlinks?:boolean;maskVector?:boolean}&React.SVGProps<SVGPathElement>){
 if(n.type==='text'){const outline=currentTextOutline(n);if(outline!==undefined){const path=<path d={outline} {...props} fillRule="nonzero" clipRule="nonzero" role="img" aria-label={n.text}/>;return hyperlinks&&!maskVector&&n.hyperlink?<a href={n.hyperlink} target="_blank" rel="noopener noreferrer">{path}</a>:path;}}
 if(n.type==='text')return <text {...props as React.SVGProps<SVGTextElement>} fontFamily={`${n.fontFamily}, system-ui, sans-serif`} fontSize={n.fontSize} fontWeight={n.fontWeight} fontStyle={n.fontStyle??'normal'} letterSpacing={n.letterSpacing} textAnchor={n.textAlign==='center'?'middle':n.textAlign==='right'?'end':'start'} xmlSpace="preserve" style={{fontSynthesis:'style',fontVariationSettings:fontSettings(n.fontAxes),fontFeatureSettings:fontSettings(n.fontFeatures)}}>{textLines(n).map((line,i)=><tspan key={i} x={n.textAlign==='center'?n.width/2:n.textAlign==='right'?n.width:line.x} y={line.y} textLength={n.textAlign==='justify'&&!line.paragraphEnd?n.width-line.x:undefined} lengthAdjust={n.textAlign==='justify'?'spacing':undefined}>{line.runs.length?line.runs.map((run,j)=>{const style=run.style,u=style.underline;const span=<tspan key={j} data-text-href={style.hyperlink||undefined} data-text-range={run.start>=0?`${run.start}:${run.end}`:undefined} fontFamily={style.fontFamily} fontSize={style.fontSize} fontWeight={style.fontWeight} fontStyle={style.fontStyle} letterSpacing={style.letterSpacing} fill={props.fill==='none'?undefined:maskVector?(style.fill==='none'||/^#(?:[\da-f]{3}0|[\da-f]{6}00)$/i.test(style.fill??'')?'none':'#ffffff'):style.fill===n.fill?undefined:style.fill} textDecoration={style.decorations?.join(' ')||'none'} style={{fontVariationSettings:fontSettings(style.fontAxes),fontFeatureSettings:fontSettings(style.fontFeatures),textDecorationColor:u?.color,textDecorationStyle:u?.style,textDecorationThickness:u?`${u.thickness}px`:undefined,textUnderlineOffset:u?`${u.offset}px`:undefined,textDecorationSkipInk:u?(u.skipInk?'auto':'none'):undefined}}>{run.text}</tspan>;return hyperlinks&&style.hyperlink?<a key={j} href={style.hyperlink} target="_blank" rel="noopener noreferrer">{span}</a>:span;}):' '}</tspan>)}</text>;
 return <path d={scaledLocalPath(n)} {...props} fillRule={n.fillRule??(n.type==='ellipse'?'evenodd':'nonzero')} clipRule={n.fillRule??(n.type==='ellipse'?'evenodd':'nonzero')}/>;
}
function Stroke({n,s,id,maskVector=false}:{n:DesignNode;s:StrokeStyle;id:string;maskVector?:boolean}){
 const alignment=['line','arrow'].includes(n.type)?'center':s.align;
 const props={fill:'none',stroke:maskVector?'#ffffff':paintValue(s.paint,id),strokeWidth:s.width*(alignment==='center'?1:2),opacity:maskVector?1:s.paint.opacity,strokeLinecap:s.cap,strokeLinejoin:s.join,strokeMiterlimit:s.miterLimit,strokeDasharray:s.dash.length?s.dash.join(' '):undefined,strokeDashoffset:s.dashOffset};
 return <g clipPath={alignment==='inside'?`url(#local-clip-${n.id})`:undefined} mask={alignment==='outside'?`url(#outside-mask-${n.id})`:undefined}><Shape n={n} {...props}/>{n.type==='arrow'&&<path d={`M ${n.width-12} ${n.height-6} L ${n.width} ${n.height} L ${n.width-12} ${n.height+6}`} fill="none" stroke={maskVector?'#ffffff':s.paint.color} strokeWidth={s.width} transform={`rotate(${Math.atan2(n.height,n.width)*180/Math.PI} ${n.width} ${n.height})`}/>}</g>;
}
export function Artwork({nodes,outlines=false,hyperlinks=false,onNode,onInteraction}:{nodes:DesignNode[];outlines?:boolean;hyperlinks?:boolean;onNode?:(e:React.PointerEvent,id:string)=>void;onInteraction?:(e:React.SyntheticEvent,id:string,type:'click'|'pointerdown'|'pointerup'|'pointerenter'|'pointerleave')=>void}) {
 const ids=new Set(nodes.map(n=>n.id)),children=new Map<string|null,DesignNode[]>();
 for(const n of nodes){const parent=n.parentId&&ids.has(n.parentId)?n.parentId:null;const list=children.get(parent)??[];list.push(n);children.set(parent,list);}
 const regions=new Map<string,ReturnType<typeof maskRegion>>(),regionFor=(parent?:DesignNode)=>{const key=parent?.id??'',cached=regions.get(key);if(cached)return cached;const value=maskRegion(nodes,parent);regions.set(key,value);return value;};
 const renderSiblings=(siblings:DesignNode[],parent?:DesignNode,sourceMode?:MaskMode):React.ReactNode=>outlines?siblings.map(n=>render(n,parent,sourceMode)):maskRuns(siblings).map((run,i)=>run.source?<g key={'mask-run-'+run.source.id} data-mask-run={run.source.id}><defs><mask id={'layer-mask-'+run.source.id} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" {...regionFor(parent)} style={{maskType:sourceMode!=='vector'&&run.source.mask!.mode==='luminance'?'luminance':'alpha'}} data-mask-mode={sourceMode==='vector'?'vector':run.source.mask!.mode}>{render(run.source,parent,sourceMode==='vector'?'vector':run.source.mask!.mode)}</mask></defs><g mask={`url(#layer-mask-${run.source.id})`}>{run.nodes.map(n=>render(n,parent,sourceMode))}</g></g>:<g key={'unmasked-'+i}>{run.nodes.map(n=>render(n,parent,sourceMode))}</g>);
 const render=(n:DesignNode,parent?:DesignNode,sourceMode?:MaskMode):React.ReactNode=>{
  if(!n.visible||n.type==='slice')return null;
  const vector=sourceMode==='vector',interactive=!sourceMode,content=outlines?<Shape n={n} fill="none" stroke="#a8a3b4" strokeWidth={1}/>:<>
   {fillsFor(n).filter(p=>vector?vectorPaintVisible(p):p.visible&&p.opacity>0).reverse().map(p=><Shape key={p.id} n={n} maskVector={vector} hyperlinks={interactive&&hyperlinks} fill={vector?'#ffffff':paintValue(p,`fill-${n.id}-${p.id}`)} stroke="none" opacity={vector?1:p.opacity}/>)}
   {strokesFor(n).filter(s=>s.visible&&s.width>0&&(vector?vectorPaintVisible(s.paint):s.paint.visible)).reverse().map(s=><Stroke key={s.id} n={n} s={s} maskVector={vector} id={`stroke-${n.id}-${s.id}`}/>)}</>;
  return <g key={n.id} data-node-id={interactive?n.id:undefined} data-mask-source-id={sourceMode?n.id:undefined} aria-label={interactive?n.name:undefined} onPointerDown={interactive?e=>{if(onNode){e.stopPropagation();onNode(e,n.id);}else onInteraction?.(e,n.id,'pointerdown');}:undefined} onPointerUp={interactive&&onInteraction?e=>onInteraction(e,n.id,'pointerup'):undefined} onClick={interactive&&onInteraction?e=>onInteraction(e,n.id,'click'):undefined} onPointerEnter={interactive&&onInteraction?e=>onInteraction(e,n.id,'pointerenter'):undefined} onPointerLeave={interactive&&onInteraction?e=>onInteraction(e,n.id,'pointerleave'):undefined} opacity={vector?(n.opacity>0?1:0):n.opacity} transform={`translate(${n.x-(parent?.x??0)} ${n.y-(parent?.y??0)}) rotate(${n.rotation} ${n.width/2} ${n.height/2})`} filter={!outlines&&!vector&&effectsFor(n).some(e=>e.visible)?`url(#fx${n.id})`:undefined} style={{mixBlendMode:vector?'normal':n.blendMode as CSSProperties['mixBlendMode'],isolation:n.isolate?'isolate':undefined}}><g transform={n.flipX||n.flipY||n.motionScaleX!==undefined||n.motionScaleY!==undefined?`translate(${n.width/2} ${n.height/2}) scale(${(n.flipX?-1:1)*(n.motionScaleX??1)} ${(n.flipY?-1:1)*(n.motionScaleY??1)}) translate(${-n.width/2} ${-n.height/2})`:undefined}>
   {interactive&&onInteraction&&<rect width={n.width} height={n.height} fill="transparent" pointerEvents="all"/>}
   <g clipPath={n.type==='text'&&n.clip?`url(#local-clip-${n.id})`:undefined}>{content}</g>
   {!n.booleanOp&&<g clipPath={n.clip?`url(#local-clip-${n.id})`:undefined}>{renderSiblings(children.get(n.id)??[],n,sourceMode)}</g>}
  </g></g>;
 };
 return <>{nodes.map(n=><defs key={'def'+n.id}>
  <clipPath id={'local-clip-'+n.id}><Shape n={n}/></clipPath>
  <mask id={'outside-mask-'+n.id} x="-100%" y="-100%" width="300%" height="300%"><rect x={-n.width} y={-n.height} width={n.width*3} height={n.height*3} fill="white"/><Shape n={n} fill="black" stroke="none"/></mask>
  {fillsFor(n).map(p=><PaintDefinition key={p.id} paint={p} id={`fill-${n.id}-${p.id}`} n={n}/>)}
  {strokesFor(n).map(s=><PaintDefinition key={s.id} paint={s.paint} id={`stroke-${n.id}-${s.id}`} n={n}/>)}
  <EffectFilter n={n}/>
 </defs>)}{renderSiblings(children.get(null)??[])}</>;
}
