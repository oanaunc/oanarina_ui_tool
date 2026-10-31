import type {FontAsset} from './font-data';
import type {FontFamily} from './font-downloads';
export interface NamedFontStyle {key:string;label:string;weight:number;italic:boolean;}
const weightNames:Record<number,string>={100:'Thin',200:'ExtraLight',300:'Light',400:'Regular',500:'Medium',600:'SemiBold',700:'Bold',800:'ExtraBold',900:'Black'};
export const fontStyleKey=(weight:number,italic:boolean)=>weight+(italic?':italic':'');
export function fontStyleName(weight:number,italic:boolean){const base=weightNames[weight]??'Weight '+weight;return italic?(weight===400?'Italic':base+' Italic'):base;}
const style=(weight:number,italic:boolean):NamedFontStyle=>({key:fontStyleKey(weight,italic),label:fontStyleName(weight,italic),weight,italic});
function assetWeights(raw:string){const numbers=raw.trim().split(/\s+/).map(Number).filter(Number.isFinite);if(numbers.length===2)return Object.keys(weightNames).map(Number).filter(w=>w>=numbers[0]&&w<=numbers[1]);return numbers.length===1?[numbers[0]]:[];}
/** Faces known for a family: catalog weights, its variable wght range, then faces embedded in the project. Upright sorts before italic, lightest first. */
export function namedFontStyles(family:string,catalog:readonly FontFamily[],assets:readonly Pick<FontAsset,'family'|'weight'|'style'>[]):NamedFontStyle[]{const found=catalog.find(f=>f.family===family),upright=new Set<number>(found?.weights??[]),italic=new Set<number>(found?.italicWeights??[]),axis=found?.axes.find(a=>a.tag==='wght');if(axis)for(const w of Object.keys(weightNames).map(Number))if(w>=axis.min&&w<=axis.max){upright.add(w);if(italic.size)italic.add(w);}for(const asset of assets)if(asset.family===family)for(const w of assetWeights(asset.weight))(asset.style==='italic'||asset.style==='oblique'?italic:upright).add(w);return [...[...upright].map(w=>style(w,false)),...[...italic].map(w=>style(w,true))].sort((a,b)=>Number(a.italic)-Number(b.italic)||a.weight-b.weight);}
/** Installed fonts have no face list here: the common pair stays available, and the current face is always shown. */
export function fontStyleChoices(known:readonly NamedFontStyle[],weight:number,italic:boolean){const list=known.length?[...known]:[style(400,false),style(700,false),style(400,true),style(700,true)];return list.some(s=>s.weight===weight&&s.italic===italic)?list:[style(weight,italic),...list];}
