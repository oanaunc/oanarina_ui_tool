import {prepareSurfacePaint} from '../surface-paint';
import type {Paint} from '../paints';
import {imageChannelOffsets,imageHasAdjustments,imagePaintGeometry,imageToneTable} from '../image-paint';
/** Shared by the canvas, interactive crop preview and standalone SVG/raster export. */
export function ImagePaintDefinition({paint:source,id,width,height,userSpace=false}:{paint:Paint;id:string;width:number;height:number;userSpace?:boolean}){
 const p=prepareSurfacePaint(source),g=imagePaintGeometry(p.surface?{...p,offsetX:0,offsetY:0}:p,width,height),adjusted=imageHasAdjustments(p),tone=adjusted?imageToneTable(p.adjustments).join(' '):'',[r,green,b]=imageChannelOffsets(p.adjustments);
 return <>{adjusted&&<filter id={id+'-adjust'} x="-100%" y="-100%" width="300%" height="300%" colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncR type="table" tableValues={tone}/><feFuncG type="table" tableValues={tone}/><feFuncB type="table" tableValues={tone}/></feComponentTransfer><feColorMatrix type="saturate" values={String(1+(p.adjustments?.saturation??0))}/><feColorMatrix type="matrix" values={`1 0 0 0 ${r} 0 1 0 0 ${green} 0 0 1 0 ${b} 0 0 0 1 0`}/></filter>}
 <pattern id={id} width={!g.tile&&userSpace?width:g.patternWidth} height={!g.tile&&userSpace?height:g.patternHeight} patternUnits={g.tile||userSpace?'userSpaceOnUse':'objectBoundingBox'} viewBox={g.viewBox} patternTransform={p.surface?`translate(${p.offsetX??0} ${p.offsetY??0}) rotate(${p.angle})`:g.patternTransform}><image href={p.image} width={g.width} height={g.height} x={g.x} y={g.y} preserveAspectRatio={g.aspect} transform={g.transform} filter={adjusted?`url(#${id}-adjust)`:undefined}/></pattern></>;
}
