import {useId} from 'react';
import type {Paint} from '../paints';
import {GradientPaintDefinition} from './GradientPaintDefinition';
export default function GradientPaintPreview({paint}:{paint:Paint}){const id='gradient-swatch-'+useId().replace(/:/g,'');return <svg className="gradient-preview" aria-label="Gradient paint preview" role="img" viewBox="0 0 100 24" preserveAspectRatio="none"><defs><GradientPaintDefinition paint={paint} id={id} width={100} height={24}/></defs><rect width="100" height="24" fill={`url(#${id})`} opacity={paint.opacity}/></svg>;}
