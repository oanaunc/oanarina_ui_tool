import type {DesignNode} from './model';
import {findShader,nodeShaders,shaderVersion} from './shaders';
import type {ShaderDocument} from './shaders';
import {shaderGlAvailable,SHADER_RASTER} from './shader-runtime';
import {unsampledLayers} from './shader-sample';
/** Embedded in exported SVG so a raster fill is never mistaken for live shader source. */
export function shaderExportWarnings(nodes:DesignNode[],doc:ShaderDocument){const found=nodes.filter(n=>n.visible).flatMap(nodeShaders);if(!found.length)return [];const out=[`Shader paints and effects are embedded as PNG frames up to ${SHADER_RASTER.exportEdge} px per edge; shader source and animation are not exported.`];if(!shaderGlAvailable())out.push('WebGL was unavailable, so shader paints use their static fallback gradient and shader effects are omitted.');else if(found.some(s=>{const d=findShader(s.binding.shaderId,doc);return !d||!shaderVersion(d,s.binding.version);}))out.push('At least one shader is missing from this file and was replaced by its static fallback.');if(unsampledLayers(nodes))out.push('A layer sampled by a shader was not ready, so it is exported without that effect. Export again.');return out;}
