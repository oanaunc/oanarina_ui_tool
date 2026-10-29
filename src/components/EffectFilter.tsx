import {Fragment} from 'react';
import {effectPadding,effectsFor} from '../effects';
import type {DesignNode} from '../model';
/** SVG filter primitives follow https://www.w3.org/TR/filter-effects-1/ . */
export function EffectFilter({n}:{n:DesignNode}){const effects=effectsFor(n).filter(e=>e.visible),padding=Math.max(1,effectPadding(effects));if(!effects.length)return null;let input='SourceGraphic';return <filter id={'fx'+n.id} filterUnits="userSpaceOnUse" x={-padding} y={-padding} width={n.width+padding*2} height={n.height+padding*2} colorInterpolationFilters="sRGB">{[...effects].reverse().map((e,i)=>{const previous=input,p='effect'+i;input=p;if(e.type==='layer-blur')return <feGaussianBlur key={e.id} in={previous} stdDeviation={e.radius/2} result={p}/>;const inner=e.type==='inner-shadow';return <Fragment key={e.id}>
 <feMorphology in="SourceAlpha" operator={(e.spread>=0)!==inner?'dilate':'erode'} radius={Math.abs(e.spread)} result={p+'spread'}/>
 <feGaussianBlur in={p+'spread'} stdDeviation={e.radius/2} result={p+'blur'}/>
 <feOffset in={p+'blur'} dx={e.x} dy={e.y} result={p+'offset'}/>
 {inner&&<feComposite in="SourceAlpha" in2={p+'offset'} operator="out" result={p+'inner-alpha'}/>}
 <feFlood floodColor={e.color} floodOpacity={e.opacity} result={p+'color'}/>
 <feComposite in={p+'color'} in2={p+(inner?'inner-alpha':'offset')} operator="in" result={p+'shadow'}/>
 {inner&&<feComposite in={p+'shadow'} in2="SourceAlpha" operator="in" result={p+'inner'}/>}
 <feMerge result={p}>{inner?<><feMergeNode in={previous}/><feMergeNode in={p+'inner'}/></>:<><feMergeNode in={p+'shadow'}/><feMergeNode in={previous}/></>}</feMerge>
 </Fragment>;})}</filter>;}
