import type {EffectRegion} from '../progressive-blur';
import {progressiveEffectRegion} from '../progressive-blur';
import {ProgressiveBlurPrimitives} from './ProgressiveBlurPrimitives';
import {strokeBoxOutsets} from '../edge-strokes';
import {pathControlBounds} from '../path-control-bounds';
import {hasVariableWidth} from '../variable-width';
import {textPathBounds} from '../text-path-bounds';
import {strokesFor} from '../paints';
import {Fragment,useContext} from 'react';
import {displayColor} from '../color-profile';
import {ShaderEffectPrimitives} from './ShaderPaintDefinition';
import {ArtworkOutputContext} from './artwork-output';
import {effectPadding,effectsFor} from '../effects';
import type {DesignNode} from '../model';
/** SVG filter primitives follow https://www.w3.org/TR/filter-effects-1/ . */
/** A network can extend past its coordinate box; an effect region must cover the artwork it filters. */
function networkEffectRegion(n:DesignNode,padding:number){if(!n.vectorNetwork&&!hasVariableWidth(n)&&!n.textPath)return null;const hull=n.textPath?textPathBounds(n):pathControlBounds(n);if(!hull)return null;const reach=padding+(n.vectorNetwork?Math.max(0,...strokesFor(n).map(s=>s.width))/2:0),x=Math.min(0,hull.x)-reach,y=Math.min(0,hull.y)-reach;return {x,y,width:Math.max(n.width,hull.x+hull.width)+reach-x,height:Math.max(n.height,hull.y+hull.height)+reach-y};}
export function EffectFilter({n,nodes=[n],progressiveRegion}:{n:DesignNode;nodes?:DesignNode[];progressiveRegion?:EffectRegion}){const {profile}=useContext(ArtworkOutputContext),effects=effectsFor(n).filter(e=>e.visible&&e.type!=='background-blur'),padding=Math.max(1,effectPadding(effects));if(!effects.length)return null;const [top,right,bottom,left]=n.strokes?.some(s=>s.edgeWidths)?strokeBoxOutsets(n.strokes,n):[0,0,0,0];const region=effects.some(e=>e.type==='progressive-blur')?(progressiveRegion??progressiveEffectRegion(n,nodes)):networkEffectRegion(n,padding)??{x:-padding-left,y:-padding-top,width:n.width+padding*2+left+right,height:n.height+padding*2+top+bottom};let input='SourceGraphic';return <filter id={'fx'+n.id} filterUnits="userSpaceOnUse" {...region} colorInterpolationFilters="sRGB">{[...effects].reverse().map((e,i)=>{const previous=input,p='effect'+i;input=p;if(e.type==='progressive-blur')return <ProgressiveBlurPrimitives key={e.id} n={n} e={e} region={region} input={previous} result={p}/>;if(e.type==='shader')return <ShaderEffectPrimitives key={e.id} n={n} e={e} input={previous} result={p} nodes={nodes}/>;if(e.type==='layer-blur')return <feGaussianBlur key={e.id} in={previous} stdDeviation={e.radius/2} result={p}/>;const inner=e.type==='inner-shadow';return <Fragment key={e.id}>
 {e.spread!==0&&<feMorphology in="SourceAlpha" operator={(e.spread>=0)!==inner?'dilate':'erode'} radius={Math.abs(e.spread)} result={p+'spread'}/>}
 <feGaussianBlur in={e.spread!==0?p+'spread':'SourceAlpha'} stdDeviation={e.radius/2} result={p+'blur'}/>
 <feOffset in={p+'blur'} dx={e.x} dy={e.y} result={p+'offset'}/>
 {inner&&<feComposite in="SourceAlpha" in2={p+'offset'} operator="out" result={p+'inner-alpha'}/>}
 <feFlood floodColor={displayColor(e.color,profile)} floodOpacity={e.opacity} result={p+'color'}/>
 <feComposite in={p+'color'} in2={p+(inner?'inner-alpha':'offset')} operator="in" result={p+'shadow'}/>
 {inner&&<feComposite in={p+'shadow'} in2="SourceAlpha" operator="in" result={p+'inner'}/>}
 <feMerge result={p}>{inner?<><feMergeNode in={previous}/><feMergeNode in={p+'inner'}/></>:<><feMergeNode in={p+'shadow'}/><feMergeNode in={previous}/></>}</feMerge>
 </Fragment>;})}</filter>;}
