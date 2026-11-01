import type {DesignNode} from '../model';
import {displayColor} from '../color-profile';
import type {DocumentColorProfile} from '../color-profile';
import {fontFamilyStack} from '../font-fallback';
import {fontSettings,positionedTextStyle,shownSegments} from '../rich-text';
/** Plain text stays a bare string, so documents without ranges keep their exact markup. Ranges are tspans on the same baseline. */
export default function TextPathRuns({n,fill,maskVector,profile}:{n:DesignNode;fill:unknown;maskVector:boolean;profile:DocumentColorProfile|undefined}){
 if(!n.textRuns?.length)return <>{n.text}</>;let shift=0;
 return <>{shownSegments(n).map(segment=>{const style=segment.style,position=positionedTextStyle(style),dy=position.baselineShift-shift;shift=position.baselineShift;const color=style.fill;return <tspan key={segment.start} data-text-range={`${segment.start}:${segment.end}`} fontFamily={fontFamilyStack(style)} fontSize={position.fontSize} fontWeight={style.fontWeight} fontStyle={style.fontStyle} letterSpacing={style.letterSpacing} dy={dy||undefined} fill={fill==='none'?undefined:maskVector?(color==='none'?'none':'#ffffff'):!color||color===n.fill?undefined:color==='none'?'none':displayColor(color,profile)} textDecoration={[style.underline||style.decorations?.includes('underline')?'underline':'',style.decorations?.includes('line-through')?'line-through':''].filter(Boolean).join(' ')||undefined} style={{fontVariantCaps:style.smallCaps?'small-caps':undefined,fontVariationSettings:fontSettings(style.fontAxes),fontFeatureSettings:fontSettings(style.fontFeatures)}}>{segment.text}</tspan>;})}</>;
}
