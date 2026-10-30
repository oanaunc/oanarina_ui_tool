import {Fragment} from 'react';
import type {DesignNode} from '../model';
import type {Effect} from '../effects';
import {PROGRESSIVE_BLUR_LEVELS,progressiveWeightImage} from '../progressive-blur';
import type {EffectRegion} from '../progressive-blur';
/** Partition-of-unity alpha weights are added, never over-composited. */
export function ProgressiveBlurPrimitives({n,e,region,input,result}:{n:DesignNode;e:Effect;region:EffectRegion;input:string;result:string}){const start=e.progressive!.startRadius;if(start===e.radius)return <feGaussianBlur in={input} stdDeviation={e.radius/2} result={result}/>;return <>{Array.from({length:PROGRESSIVE_BLUR_LEVELS},(_,i)=>{const name=result+'level'+i,radius=start+(e.radius-start)*i/(PROGRESSIVE_BLUR_LEVELS-1);return <Fragment key={i}><feGaussianBlur in={input} stdDeviation={radius/2} result={name+'blur'}/><feImage href={progressiveWeightImage(n,e,region,i)} {...region} preserveAspectRatio="none" result={name+'weight'}/><feComposite in={name+'blur'} in2={name+'weight'} operator="in" result={name+'weighted'}/>{i>0&&<feComposite in={i===1?result+'level0weighted':result+'sum'+(i-1)} in2={name+'weighted'} operator="arithmetic" k1={0} k2={1} k3={1} k4={0} result={i===PROGRESSIVE_BLUR_LEVELS-1?result:result+'sum'+i}/>}</Fragment>;})}</>;}
