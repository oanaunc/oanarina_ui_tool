import {useEffect,useRef} from 'react';
import type {RefObject} from 'react';
import {setShaderPointer,shaderPointerAt} from '../shader-pointer';
import {nodeShaders,findShader} from '../shaders';
import type {ShaderDocument} from '../shaders';
import type {DesignNode} from '../model';
/** Presentation listens only when an interactive shader is present, because each move re-renders that layer. Transient, like the Motion canvas toggle. */
export function useShaderStagePointer(stage:RefObject<HTMLElement|null>,nodes:DesignNode[],doc:ShaderDocument,resolve:(id:string)=>string){const latest=useRef({nodes,resolve});latest.current={nodes,resolve};const interactive=nodes.some(n=>n.visible&&nodeShaders(n).some(s=>findShader(s.binding.shaderId,doc)?.interactive));useEffect(()=>{const host=stage.current;if(!interactive||!host)return;const size=(id:string)=>{const source=latest.current.resolve(id);return latest.current.nodes.find(n=>n.id===source);},move=(e:PointerEvent)=>{setShaderPointer(e.target instanceof Element?shaderPointerAt(e.target,e.clientX,e.clientY,size):null);},leave=()=>setShaderPointer(null);host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);return ()=>{host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);setShaderPointer(null);};},[interactive,stage]);}
