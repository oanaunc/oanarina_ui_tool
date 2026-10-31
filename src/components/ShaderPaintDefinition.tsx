import {useContext,useSyncExternalStore} from 'react';
import type {Effect} from '../effects';
import type {DesignNode} from '../model';
import type {Paint} from '../paints';
import {bindingFrame,shaderEpoch,SHADER_RASTER,subscribeShaderEpoch} from '../shader-runtime';
import type {ShaderFrame} from '../shader-runtime';
import type {ShaderBinding} from '../shaders';
import {shaderPointerFor,subscribeShaderPointer} from '../shader-pointer';
import {useEditor} from '../store';
import {GradientPaintDefinition} from './GradientPaintDefinition';
import {ArtworkOutputContext} from './artwork-output';
function useShaderFrame(binding:ShaderBinding,nodeId:string,width:number,height:number,untagged=false):ShaderFrame{
 const output=useContext(ArtworkOutputContext),exporting=output.rasterScale!==undefined;useSyncExternalStore(subscribeShaderEpoch,shaderEpoch,shaderEpoch);
 const pointer=useSyncExternalStore(subscribeShaderPointer,()=>exporting?undefined:shaderPointerFor(nodeId),()=>undefined);
 return bindingFrame(binding,{doc:{shaders:output.shaders},width,height,scale:exporting?output.rasterScale!:Math.min(2,typeof window==='undefined'?1:window.devicePixelRatio||1),maxEdge:exporting?SHADER_RASTER.exportEdge:useEditor.getState().motionPlaying?SHADER_RASTER.playingEdge:SHADER_RASTER.liveEdge,budgetMs:exporting?SHADER_RASTER.exportBudgetMs:SHADER_RASTER.liveBudgetMs,profile:untagged?undefined:output.profile,pointer});
}
/** Same pattern shape on every path. outset extends the texture beneath strokes, which straddle the layer box. */
export function ShaderPaintDefinition({paint:p,id,n,strokeSpace=false,outset=0,direct=false}:{paint:Paint;id:string;n:DesignNode;strokeSpace?:boolean;outset?:number;direct?:boolean}){
 const width=Math.max(1,n.width)+outset*2,height=Math.max(1,n.height)+outset*2,frame=useShaderFrame(p.shader!,n.id,width,height);
 if(!frame.image)return <GradientPaintDefinition paint={{...p,type:'linear',angle:90}} id={id} width={width} height={height} userSpace={strokeSpace}/>;
 if(direct)return null;
 return <pattern id={id} data-shader-paint={p.shader!.shaderId} x={-outset} y={-outset} width={width} height={height} patternUnits="userSpaceOnUse"><image href={frame.image} width={width} height={height} preserveAspectRatio="none"/></pattern>;
}
/** WebKit flattens pattern tiles into an sRGB buffer, so Display P3 fills draw the frame directly through the layer clip. fallback paints the gradient definition. */
export function ShaderFillImage({paint:p,n,fallback}:{paint:Paint;n:DesignNode;fallback:React.ReactNode}){const width=Math.max(1,n.width),height=Math.max(1,n.height),frame=useShaderFrame(p.shader!,n.id,width,height);if(!frame.image)return <>{fallback}</>;return <g data-shader-paint={p.shader!.shaderId} clipPath={`url(#local-clip-${n.id})`} opacity={p.opacity}><image href={frame.image} width={width} height={height} preserveAspectRatio="none"/></g>;}
/** Blends a generated texture through the filter chain. WebGL never reads layer pixels; Displace bends them with feDisplacementMap instead. */
export function ShaderEffectPrimitives({n,e,input,result}:{n:DesignNode;e:Effect;input:string;result:string}){
 const outset=e.shaderClip?0:e.spread,width=Math.max(1,n.width)+outset*2,height=Math.max(1,n.height)+outset*2,displace=e.shaderMode==='displace',frame=useShaderFrame(e.shader!,n.id,width,height,displace);
 if(!frame.image)return <feOffset in={input} dx={0} dy={0} result={result}/>;
 const texture=result+'-texture',image=<feImage data-shader-effect={e.shader!.shaderId} href={frame.image} x={-outset} y={-outset} width={width} height={height} preserveAspectRatio="none" result={texture}/>;
 if(displace)return <>{image}<feDisplacementMap in={input} in2={texture} scale={e.radius*e.opacity} xChannelSelector="R" yChannelSelector="G" result={result}/></>;
 const clipped=e.shaderClip?texture+'-clip':texture;
 return <>{image}{e.shaderClip&&<feComposite in={texture} in2="SourceAlpha" operator="in" result={clipped}/>}<feComponentTransfer in={clipped} result={texture+'-alpha'}><feFuncA type="linear" slope={e.opacity}/></feComponentTransfer><feBlend in={texture+'-alpha'} in2={input} mode={e.shaderBlend} result={result}/></>;
}
