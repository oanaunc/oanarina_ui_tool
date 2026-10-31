import {useContext} from 'react';
import {displayColor} from '../color-profile';
import {ArtworkOutputContext} from './artwork-output';
import {backgroundBlurClipImage} from '../background-blur';
import type {BackgroundBlurPlan} from '../background-blur';
/** Selectively replace the real preceding SourceGraphic; never source-over a duplicate backdrop. */
export function BackgroundBlurFilter({plan,id}:{plan:BackgroundBlurPlan;id:string}){const {profile}=useContext(ArtworkOutputContext);return <filter id={id} filterUnits="userSpaceOnUse" {...plan.region} colorInterpolationFilters="sRGB"><feImage href={backgroundBlurClipImage(plan)} {...plan.region} preserveAspectRatio="none" result="shape"/>{plan.flood&&<><feFlood floodColor={displayColor(plan.flood,profile)} result="backdrop"/><feMerge result="source"><feMergeNode in="backdrop"/><feMergeNode in="SourceGraphic"/></feMerge></>}<feGaussianBlur in={plan.flood?'source':'SourceGraphic'} stdDeviation={plan.effect.radius/2} edgeMode="duplicate" result="blurred"/><feComposite in="SourceGraphic" in2="shape" operator="out" result="unfiltered"/><feComposite in="blurred" in2="shape" operator="in" result="filtered"/><feComposite in="unfiltered" in2="filtered" operator="arithmetic" k2={1} k3={1}/></filter>;}
