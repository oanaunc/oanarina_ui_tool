import type {DesignNode} from './model';
import type {MaskMode} from './masks';

export interface MaskIndicatorSource {id:string;name:string;mode:MaskMode;}
export interface MaskLayerIndicator {source?:MaskIndicatorSource;maskedBy?:MaskIndicatorSource;inherited:boolean;description:string;}
const modeNames:Record<MaskMode,string>={alpha:'Alpha',vector:'Vector',luminance:'Luminance'};
export function maskModeName(mode:MaskMode){return modeNames[mode];}
/** A source name fans out into many rows. Bound chrome text without changing the model. */
function indicatorName(name:string){if(name.length<=256)return name;let end=256;const before=name.charCodeAt(end-1),after=name.charCodeAt(end);if(before>=0xd800&&before<=0xdbff&&after>=0xdc00&&after<=0xdfff)end--;return name.slice(0,end)+'…';}
/** Derived chrome only: sibling runs match the artwork renderer, then ancestor coverage propagates. */
export function maskLayerIndicators(nodes:DesignNode[]):Map<string,MaskLayerIndicator>{
 if(!nodes.some(n=>n.mask))return new Map();
 const byId=new Map(nodes.map(n=>[n.id,n])),activeByParent=new Map<string|null,MaskIndicatorSource>(),sources=new Map<string,MaskIndicatorSource>(),direct=new Map<string,MaskIndicatorSource>();
 for(const n of nodes){if(n.mask){const source={id:n.id,name:indicatorName(n.name),mode:n.mask.mode};sources.set(n.id,source);activeByParent.set(n.parentId,source);}else{const source=activeByParent.get(n.parentId);if(source)direct.set(n.id,source);}}
 const targets=new Map<string,MaskIndicatorSource|undefined>();
 for(const n of nodes){if(targets.has(n.id))continue;const path:DesignNode[]=[],seen=new Set<string>();let current:DesignNode|undefined=n,resolved:MaskIndicatorSource|undefined;
  while(current){if(targets.has(current.id)){resolved=targets.get(current.id);break;}const own=direct.get(current.id);if(own){resolved=own;break;}if(seen.has(current.id))break;seen.add(current.id);path.push(current);current=current.parentId?byId.get(current.parentId):undefined;}
  for(const item of path)targets.set(item.id,resolved);if(!targets.has(n.id))targets.set(n.id,resolved);
 }
 const result=new Map<string,MaskLayerIndicator>();for(const n of nodes){const source=sources.get(n.id),maskedBy=targets.get(n.id),inherited=!!maskedBy&&!direct.has(n.id),parts:string[]=[];if(source)parts.push(`${modeNames[source.mode]} mask source`);if(maskedBy)parts.push(`${inherited?'Inside artwork masked':'Masked'} by ${maskedBy.name} (${modeNames[maskedBy.mode]})`);if(parts.length)result.set(n.id,{source,maskedBy,inherited,description:parts.join('. ')});}
 return result;
}
