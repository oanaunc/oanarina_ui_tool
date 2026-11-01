import {createContext} from 'react';
import type {DesignNode} from './model';
import {effectsFor} from './effects';
/** The canvas draws less when things are too small to see, as design tools do. Exports never set this, so they always carry full detail. */
export const CanvasDetailContext=createContext<number|undefined>(undefined);
const TINY_TEXT_PX=3.5,TINY_EFFECT_PX=2,FULL_DETAIL_ZOOM=.7;
/** Half-octave steps, rounded up, so a small zoom change never rebuilds the page and nothing goes coarse sooner than it should. */
export const detailZoom=(zoom:number)=>!(zoom>0)||zoom>=FULL_DETAIL_ZOOM?undefined:2**(Math.ceil(Math.log2(zoom)*2)/2);
export const tinyText=(n:Pick<DesignNode,'fontSize'|'textRuns'>,zoom:number|undefined)=>zoom!==undefined&&Math.max(n.fontSize,...(n.textRuns??[]).map(r=>r.fontSize??0))*zoom<TINY_TEXT_PX;
/** A shadow or blur that spans under two screen pixels can't be told from none, and filters are the slowest thing on the canvas. */
export function shownEffects(n:DesignNode,zoom:number|undefined){const effects=effectsFor(n).filter(e=>e.visible&&e.type!=='background-blur');if(zoom===undefined||!effects.length||effects.some(e=>e.type!=='drop-shadow'&&e.type!=='inner-shadow'&&e.type!=='layer-blur'))return effects;return Math.max(...effects.map(e=>e.radius+Math.abs(e.x)+Math.abs(e.y)+Math.abs(e.spread)))*zoom<TINY_EFFECT_PX?[]:effects;}
/** Lines of text as one path of bars: what text looks like at this size, for a fraction of the cost. */
export function textBars(n:Pick<DesignNode,'text'|'width'|'height'|'fontSize'|'lineHeight'|'textAlign'>){
 const line=Math.max(1,n.fontSize*n.lineHeight),count=Math.max(1,Math.min(12,Math.round(n.height/line))),length=Math.min(n.width*count,[...n.text].length*n.fontSize*.5),bar=n.fontSize*.56;let d='',left=length;
 for(let i=0;i<count&&left>0;i++){const width=Math.min(n.width,left),x=n.textAlign==='center'?(n.width-width)/2:n.textAlign==='right'?n.width-width:0,y=i*line+(line-bar)/2;d+=`M${x} ${y}h${width}v${bar}h${-width}z`;left-=width;}
 return d;
}
