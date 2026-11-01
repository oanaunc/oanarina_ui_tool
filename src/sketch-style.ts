import type {DesignNode,VectorPoint} from './model';
import type {Effect} from './effects';
import {createPaint,createStroke} from './paints';
import type {Paint,StrokeStyle} from './paints';
import type {TextRun,TextStyle} from './rich-text';
import {figFontWeight} from './fig-text';
import {SKETCH_LIMITS,SketchImportError} from './sketch-limits';
import type {SketchErrorCode} from './sketch-limits';
export type Raw=Record<string,unknown>;
export const fail=(code:SketchErrorCode='json'):never=>{throw new SketchImportError(code);};
export const object=(v:unknown):Raw=>!v||typeof v!=='object'||Array.isArray(v)?fail():v as Raw;
export const optional=(v:unknown)=>v===undefined?{}:object(v);
export const list=(v:unknown,max=100):unknown[]=>v===undefined?[]:!Array.isArray(v)||v.length>max?fail('budget'):v;
export const text=(v:unknown,fallback='',max=100000)=>v===undefined?fallback:typeof v!=='string'||v.length>max?fail():v;
export const number=(v:unknown,fallback?:number):number=>v===undefined&&fallback!==undefined?fallback:typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e6?fail('geometry'):v;
export const unit=(v:unknown,fallback=1)=>{const n=number(v,fallback);if(n<0||n>1)fail('geometry');return n;};
export const flag=(v:unknown,fallback=false):boolean=>v===undefined?fallback:typeof v!=='boolean'?fail():v;
export const color=(v:unknown)=>{const c=object(v);return{color:'#'+['red','green','blue'].map(k=>Math.round(unit(c[k],0)*255).toString(16).padStart(2,'0')).join(''),opacity:unit(c.alpha)};};
export const point=(v:unknown)=>{const match=/^\{\s*([-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?),\s*([-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?)\s*\}$/i.exec(text(v));if(!match)fail('geometry');return{x:number(Number(match![1])),y:number(Number(match![2]))};};
export const same=(a:number,b:number)=>Math.abs(a-b)<=1e-7;
export interface SketchContext {issue:(code:string,message:string)=>void;image:(v:unknown)=>{data:string;width:number;height:number}|undefined;}
const blends=['normal','darken','multiply','color-burn','lighten','screen','color-dodge','overlay','soft-light','hard-light','difference','exclusion','hue','saturation','color','luminosity'];
/** Layer blending from the documented enum. Plus-darker and plus-lighter have no Forma mode. */
export function sketchBlend(ctx:SketchContext,settings:unknown):string|undefined{const mode=number(optional(settings).blendMode,0);if(mode===0)return;const out=blends[mode];if(!out)ctx.issue('blend','Plus Darker and Plus Lighter blending use normal compositing.');return out;}
const paintAlpha=(ctx:SketchContext,settings:unknown)=>{const c=optional(settings);if(number(c.blendMode,0)!==0)ctx.issue('blend','Per-fill and per-border blend modes use normal compositing.');return unit(c.opacity);};
function gradientPaint(ctx:SketchContext,raw:Raw,out:Paint){
 const g=object(raw.gradient),from=point(g.from),to=point(g.to),kind=number(g.gradientType,0),stops=list(g.stops,100).map(object).map(s=>{const c=color(s.color);return {id:crypto.randomUUID(),position:Math.max(0,Math.min(1,number(s.position,0))),color:c.color,opacity:c.opacity};}).sort((a,b)=>a.position-b.position);if(stops.length<2){ctx.issue('paint','Gradients without two color stops use a neutral gray solid.');return;}
 out.stops=stops;out.color=stops[0].color;const length=Math.hypot(to.x-from.x,to.y-from.y),inside=[from.x,from.y,to.x,to.y].every(v=>Math.abs(v)<=10);
 if(kind===0){out.type='linear';out.angle=Math.atan2(to.y-from.y,to.x-from.x)*180/Math.PI;if(inside&&length>=.0001){out.linearStart=from;out.linearEnd=to;}else ctx.issue('gradient','A gradient beyond the supported range uses its angle only.');}
 else if(kind===1){out.type='radial';out.cx=from.x;out.cy=from.y;out.radius=Math.max(.0001,length);if(number(g.elipseLength,1)!==1&&number(g.elipseLength,0)!==0)ctx.issue('gradient','Elliptical radial gradients are placed as a circle in the layer box.');}
 else if(kind===2)out.type='angular';else ctx.issue('paint','Unknown gradient types use their stops as a linear gradient.');
}
const modes=['tile','fill','stretch','fit'] as const;
function imagePaint(ctx:SketchContext,raw:Raw,out:Paint){const image=ctx.image(raw.image);if(!image){ctx.issue('paint','A pattern fill without a local image uses a neutral gray solid.');return;}const mode=modes[number(raw.patternFillType,1)]??'fill';Object.assign(out,{type:'image',image:image.data,imageWidth:image.width,imageHeight:image.height,scaleMode:mode,...(mode==='tile'?{scale:Math.max(.01,number(raw.patternTileScale,1))}:{})});}
export function sketchPaint(ctx:SketchContext,raw:Raw):Paint{
 const out=createPaint('#b5b5bd'),alpha=paintAlpha(ctx,raw.contextSettings),kind=number(raw.fillType,0);
 if(kind===0){const c=color(raw.color);out.color=c.color;out.opacity=c.opacity*alpha;return out;}
 out.opacity=alpha;if(kind===1)gradientPaint(ctx,raw,out);else if(kind===4)imagePaint(ctx,raw,out);else ctx.issue('paint','Noise and unsupported paints become neutral gray solid placeholders.');return out;
}
export function sketchPaints(ctx:SketchContext,raw:unknown):Paint[]{const all=list(raw).map(object),active=all.filter(p=>flag(p.isEnabled,true));if(all.length!==active.length)ctx.issue('disabled-paint','Disabled paint and border definitions are omitted; visible artwork stays editable.');return active.map(p=>sketchPaint(ctx,p));}
export function sketchStrokes(ctx:SketchContext,style:Raw):StrokeStyle[]{
 const borders=list(style.borders).map(object),enabled=borders.filter(b=>flag(b.isEnabled,true)),opts=optional(style.borderOptions);if(borders.length!==enabled.length)ctx.issue('disabled-paint','Disabled paint and border definitions are omitted; visible artwork stays editable.');if(style.borderOptions!==undefined)ctx.issue('border-options','Border options use materialized cap/join/dash values; native enable-state, dash phase and border rasterization require comparison.');
 return enabled.map(b=>{const stroke=createStroke(),paint=sketchPaint(ctx,b);stroke.paint=paint;stroke.width=number(b.thickness,1);if(stroke.width<=0||stroke.width>10000)fail('geometry');const position=number(b.position,0);if(![0,1,2].includes(position))fail();stroke.align=(['center','inside','outside'] as const)[position];stroke.cap=(['butt','round','square'] as const)[number(opts.lineCapStyle,0)]??'butt';stroke.join=(['miter','round','bevel'] as const)[number(opts.lineJoinStyle,0)]??'miter';stroke.miterLimit=Math.max(1,number(style.miterLimit,4));stroke.dash=list(opts.dashPattern).map(v=>{const n=number(v);if(n<0)fail('geometry');return n;});return stroke;});
}
const clamp=(v:number,limit:number)=>Math.max(-limit,Math.min(limit,v));
export function sketchEffects(ctx:SketchContext,style:Raw):Effect[]{
 const out:Effect[]=[],shadow=(s:Raw,type:'drop-shadow'|'inner-shadow')=>{const c=color(s.color);out.push({id:crypto.randomUUID(),type,visible:true,color:c.color,opacity:c.opacity*unit(optional(s.contextSettings).opacity),x:clamp(number(s.offsetX,0),10000),y:clamp(number(s.offsetY,0),10000),radius:Math.min(1000,Math.max(0,number(s.blurRadius,0))),spread:clamp(number(s.spread,0),1000)});};
 for(const s of list(style.shadows).map(object))if(flag(s.isEnabled,true))shadow(s,'drop-shadow');for(const s of list(style.innerShadows).map(object))if(flag(s.isEnabled,true))shadow(s,'inner-shadow');
 const blur=optional(style.blur);if(flag(blur.isEnabled)){const kind=number(blur.type,0);if(kind===3)ctx.issue('effect','Background blur was omitted; Forma applies it to root-level shapes only.');else{if(kind!==0)ctx.issue('effect','Motion and zoom blur use a uniform layer blur.');out.push({id:crypto.randomUUID(),type:'layer-blur',visible:true,color:'#000000',opacity:1,x:0,y:0,radius:Math.min(1000,Math.max(0,number(blur.radius,0))),spread:0});}}
 if(flag(optional(style.colorControls).isEnabled))ctx.issue('effect','Sketch color controls are omitted from the editable conversion.');return out;
}
const markers:Record<number,DesignNode['arrowStart']>={1:'open',2:'triangle',3:'bar',4:'circle',5:'circle',6:'diamond',7:'diamond'};
export const sketchMarker=(v:unknown)=>markers[number(v,0)];
/** PostScript names carry family and style in one token. */
export function sketchFont(name:string){const [family,...rest]=name.split('-'),style=rest.join(' ');return {fontFamily:(family.replace(/([a-z])([A-Z])/g,'$1 $2')||'Inter').slice(0,512),fontWeight:figFontWeight(style),fontStyle:/italic|oblique/i.test(style)?'italic' as const:'normal' as const};}
const attributeStyle=(attrs:Raw):TextStyle=>{const out:TextStyle={},font=optional(optional(attrs.MSAttributedStringFontAttribute).attributes);if(font.name!==undefined)Object.assign(out,sketchFont(text(font.name,'Inter',256)));if(font.size!==undefined){const size=number(font.size);if(size<=0||size>10000)fail('geometry');out.fontSize=size;}if(attrs.MSAttributedStringColorAttribute!==undefined)out.fill=color(attrs.MSAttributedStringColorAttribute).color;if(attrs.kerning!==undefined)out.letterSpacing=clamp(number(attrs.kerning),10000);const under=number(attrs.underlineStyle,0)!==0,strike=number(attrs.strikethroughStyle,0)!==0;if(attrs.underlineStyle!==undefined||attrs.strikethroughStyle!==undefined)out.decorations=[...(under?['underline' as const]:[]),...(strike?['line-through' as const]:[])];return out;};
/** Base style comes from the first run; later runs state only what differs from it. */
export function sketchTextStyle(ctx:SketchContext,n:DesignNode,raw:Raw,style:Raw){
 const a=object(raw.attributedString),content=text(a.string,'',SKETCH_LIMITS.text),runs=list(a.attributes,10000).map(object),base=optional(optional(style.textStyle).encodedAttributes),attrs=runs.length?{...base,...optional(runs[0].attributes)}:base,baseStyle=attributeStyle(attrs),paragraph=optional(attrs.paragraphStyle),font=sketchFont(text(optional(optional(attrs.MSAttributedStringFontAttribute).attributes).name,'Inter',256)),transform=number(attrs.MSAttributedStringTextTransformAttribute,0);
 n.text=content;if(transform===1)n.textCase='upper';else if(transform===2)n.textCase='lower';
 Object.assign(n,font);n.fontSize=baseStyle.fontSize??14;n.textResize='fixed';n.textAlign=(['left','right','center','justify','left'] as const)[number(paragraph.alignment,0)]??'left';n.letterSpacing=baseStyle.letterSpacing??0;n.decorations=baseStyle.decorations??[];n.verticalAlign=(['top','middle','bottom'] as const)[number(attrs.textStyleVerticalAlignmentKey,0)]??'top';
 const height=number(paragraph.maximumLineHeight,0);if(height>0)n.lineHeight=Math.max(.1,height/n.fontSize);if(paragraph.paragraphSpacing!==undefined)n.paragraphSpacing=Math.max(0,number(paragraph.paragraphSpacing));
 const ranged:TextRun[]=[],keys=Object.keys(baseStyle) as (keyof TextStyle)[];for(const run of runs){const start=number(run.location,0),end=start+number(run.length,0),style=attributeStyle(optional(run.attributes)),own:TextStyle={};for(const key of new Set([...keys,...Object.keys(style) as (keyof TextStyle)[]]))if(JSON.stringify(style[key])!==JSON.stringify(baseStyle[key])&&style[key]!==undefined)(own as Record<string,unknown>)[key]=style[key];if(!Object.keys(own).length)continue;const edge=(at:number)=>at<=0||at>=n.text.length||!(n.text.charCodeAt(at)>=0xdc00&&n.text.charCodeAt(at)<=0xdfff);if(start<0||end>n.text.length||end<=start||!edge(start)||!edge(end)){ctx.issue('text-range','A text range outside the characters was omitted.');continue;}ranged.push({...own,start,end});}if(ranged.length)n.textRuns=ranged;
 return baseStyle;
}
const tangent=(a:{x:number;y:number},b:{x:number;y:number})=>{const l=Math.hypot(b.x-a.x,b.y-a.y);return {x:(b.x-a.x)/(l||1),y:(b.y-a.y)/(l||1),l};};
/** A rounded anchor between straight edges becomes the two ends of a true circular fillet. Curved neighbors keep the sharp anchor. */
export function sketchFilletContour(points:VectorPoint[],closed:boolean,radii:number[],ctx:SketchContext):VectorPoint[]{
 const out:VectorPoint[]=[],count=points.length;for(let i=0;i<count;i++){const p=points[i],r=radii[i]??0,atEnd=!closed&&(i===0||i===count-1);if(r<=0||atEnd){out.push(p);continue;}const a=points[(i-1+count)%count],b=points[(i+1)%count];if(p.in||p.out||a.out||b.in){ctx.issue('rounding','Rounded anchors next to curves keep a sharp corner.');out.push(p);continue;}const u=tangent(p,a),v=tangent(p,b),cos=Math.max(-1,Math.min(1,u.x*v.x+u.y*v.y)),angle=Math.acos(cos);if(angle<1e-3||Math.abs(angle-Math.PI)<1e-3||!u.l||!v.l){out.push(p);continue;}const t=Math.min(r/Math.tan(angle/2),u.l/2,v.l/2),radius=t*Math.tan(angle/2),handle=4/3*Math.tan((Math.PI-angle)/4)*radius;out.push({x:p.x+u.x*t,y:p.y+u.y*t,out:{x:-u.x*handle,y:-u.y*handle}},{x:p.x+v.x*t,y:p.y+v.y*t,in:{x:-v.x*handle,y:-v.y*handle}});}return out;
}
