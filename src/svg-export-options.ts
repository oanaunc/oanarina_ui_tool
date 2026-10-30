import {DOMParser,XMLSerializer} from '@xmldom/xmldom';
import type {DesignNode} from './model';
import {identity,multiply,nodeMatrix} from './transforms';
import type {Matrix} from './transforms';

import {validateSvgExportSettings} from './svg-export-settings';
import type {SvgExportSettings} from './svg-export-settings';
export {validateSvgExportSettings} from './svg-export-settings';
export type {SvgExportSettings} from './svg-export-settings';
export function svgLayerId(id:string){return 'forma-layer-'+Array.from(new TextEncoder().encode(id),v=>v.toString(16).padStart(2,'0')).join('');}
/** Visibility changes belong to an immutable export snapshot, never the editor. */
export function exportVisibility(nodes:DesignNode[],includeHidden=false){return includeHidden?nodes.map(n=>({...n,visible:true})):nodes;}
/** Hidden subtrees must not retain their image/font resources in SVG definitions. */
export function visibleExportNodes(nodes:DesignNode[]){
 const map=new Map(nodes.map(n=>[n.id,n])),shown=new Map<string,boolean>();
 for(const start of nodes){if(shown.has(start.id))continue;const trail:DesignNode[]=[],seen=new Set<string>();let n:DesignNode|undefined=start;while(n&&!shown.has(n.id)&&!seen.has(n.id)){seen.add(n.id);trail.push(n);n=map.get(n.parentId??'');}let visible=n?(shown.get(n.id)??false):true;for(const next of trail.reverse()){visible=visible&&next.visible;shown.set(next.id,visible);}}
 return nodes.flatMap(n=>{if(shown.get(n.id))return [n];if(n.mask&&(!n.parentId||shown.get(n.parentId))){const stub:DesignNode={...n,type:'rectangle',paints:[],strokes:[],effects:[],image:'',text:'',textRuns:undefined,textOutline:undefined,path:'',contours:undefined,points:[],fill:'none',stroke:'',shadow:false,blur:0};delete (stub as unknown as {media?:unknown}).media;return [stub];}return [];});
}
export function svgTextNodes(nodes:DesignNode[],options?:SvgExportSettings){validateSvgExportSettings(options);return options?.textMode==='text'?nodes.map(n=>n.type==='text'?{...n,textOutline:undefined}:n):nodes;}
/** Prevent recursive SVG rendering or overflowing composed transforms. */
export function validateExportHierarchy(nodes:DesignNode[]){
 const map=new Map(nodes.map(n=>[n.id,n])),resolved=new Map<string,{matrix:Matrix;depth:number}>();
 for(const start of nodes){if(resolved.has(start.id))continue;const trail:DesignNode[]=[],seen=new Set<string>();let n:DesignNode|undefined=start;
  while(n&&!resolved.has(n.id)){if(seen.has(n.id)||trail.length>=256)throw Error('Export supports at most 256 ancestor levels without cycles.');seen.add(n.id);trail.push(n);if(n.parentId&&!map.has(n.parentId))throw Error('An export ancestor is missing.');n=map.get(n.parentId??'');}
  let entry=n?resolved.get(n.id)!:{matrix:identity,depth:0};
  for(const next of trail.reverse()){const depth=entry.depth+1,matrix=multiply(entry.matrix,nodeMatrix(next,map.get(next.parentId??'')));if(depth>256||matrix.some(v=>!Number.isFinite(v)))throw Error('Export hierarchy exceeds supported depth or finite transforms.');entry={matrix,depth};resolved.set(next.id,entry);}
 }
}
const presentation=['fill','fill-opacity','fill-rule','clip-rule','stroke','stroke-width','stroke-opacity','stroke-linecap','stroke-linejoin','stroke-miterlimit','stroke-dasharray','stroke-dashoffset','opacity','font-size','font-weight','font-style','letter-spacing','text-anchor','text-decoration','stop-color','stop-opacity'];
/** Convert only presentation attributes: geometry, references and transforms stay intact. */
export function formatExportSvg(raw:string,options?:SvgExportSettings){
 validateSvgExportSettings(options);if(!options||!options.includeLayerIds&&options.preserveAttributes!==false)return raw;
 if(raw.length>100_000_000)throw Error('SVG export exceeds 100 MB.');
 const xml=new DOMParser({onError:(_level,message)=>{throw Error('SVG export formatting failed: '+message);}}).parseFromString(raw,'image/svg+xml');
 const elements=Array.from(xml.getElementsByTagName('*')),used=new Set(elements.map(el=>el.getAttribute('id')).filter(Boolean));
 for(const el of elements){const source=el.getAttribute('data-node-id')??el.getAttribute('data-mask-source-id');
  if(options.includeLayerIds&&source){const base=svgLayerId(source);let id=base,i=2;while(used.has(id))id=base+'-'+i++;el.setAttribute('id',id);used.add(id);}
  if(options.preserveAttributes===false){const declarations:string[]=[];for(const name of presentation)if(el.hasAttribute(name)){const value=el.getAttribute(name)!;if(/[;{}\u0000-\u001f]/.test(value)||/\/\*|\*\/|!important/i.test(value))continue;declarations.push(name+':'+value);el.removeAttribute(name);}if(declarations.length)el.setAttribute('style',declarations.join(';')+';'+(el.getAttribute('style')??''));}
 }
 return new XMLSerializer().serializeToString(xml);
}
