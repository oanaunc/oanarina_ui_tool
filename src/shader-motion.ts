import type {DesignNode} from './model';
import {findShader,nodeShaders,paramsFor,resolvedParams,shaderTrackLabel,shaderTrackProperty} from './shaders';
import type {ShaderDocument,ShaderTrackProperty,ShaderValue} from './shaders';
export interface ShaderPickerRow {property:ShaderTrackProperty;nodeId:string;label:string;}
/** One row per parameter that exists in this binding's version. A selected layer without shaders simply adds none. */
export function shaderPickerRows(nodes:DesignNode[],selection:string[],doc?:ShaderDocument):ShaderPickerRow[]{const wanted=new Set(selection),many=selection.length>1;return nodes.filter(n=>wanted.has(n.id)).flatMap(n=>nodeShaders(n).flatMap(s=>{const d=findShader(s.binding.shaderId,doc);return d?paramsFor(d,s.binding.version).map(p=>{const property=shaderTrackProperty(s.slot,s.id,p.key);return {property,nodeId:n.id,label:(many?n.name+' · ':'')+shaderTrackLabel(n,property,doc)};}):[];}));}
/** The value a keyframe should freeze: clamped like the renderer, so the canvas does not jump when the key lands. */
export function shaderValueAt(n:DesignNode,property:ShaderTrackProperty,doc?:ShaderDocument):ShaderValue{const found=nodeShaders(n).find(s=>property.startsWith(`shader:${s.slot}:${s.id}:`)),d=found&&findShader(found.binding.shaderId,doc),key=property.slice(property.lastIndexOf(':')+1);if(!found||!d)throw Error('This layer no longer has that shader parameter.');const value=resolvedParams(d,found.binding)[key];if(value===undefined)throw Error('This layer no longer has that shader parameter.');return value;}
