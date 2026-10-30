import type {DesignNode} from './model';
import {maskModes} from './masks';
import type {MaskMode} from './masks';
import {maskLayerIndicators} from './mask-indicators';
export function previewMaskNodes(nodes:DesignNode[],sourceId:string,mode:MaskMode){if(!maskModes.includes(mode))throw Error('Choose a valid mask preview mode.');const source=nodes.find(n=>n.id===sourceId);if(!source?.mask)throw Error('This mask source no longer exists.');if(source.mask.mode===mode)return nodes;return nodes.map(n=>n.id===sourceId?{...n,mask:{mode}}:n);}
export type MaskOutlineKind='source'|'source-content'|'target'|'context';
/** Source-group descendants and sibling targets remain distinct, even across nested masks. */
export function maskOutlineKinds(nodes:DesignNode[]){const indicators=maskLayerIndicators(nodes),byId=new Map(nodes.map(n=>[n.id,n])),inside=new Map<string,boolean>(),result=new Map<string,MaskOutlineKind>();for(const n of nodes){if(inside.has(n.id))continue;const path:DesignNode[]=[],seen=new Set<string>();let current:DesignNode|undefined=n,value=false;while(current){if(inside.has(current.id)){value=inside.get(current.id)!;break;}if(seen.has(current.id))break;seen.add(current.id);path.push(current);const parent=byId.get(current.parentId??'');if(parent?.mask){value=true;break;}current=parent;}for(const item of path)inside.set(item.id,value);}for(const n of nodes)result.set(n.id,n.mask?'source':inside.get(n.id)?'source-content':indicators.get(n.id)?.maskedBy?'target':'context');return result;}
