import type {DesignNode} from './model';
import type {Paint} from './paints';
import {SHADER_CATALOG} from './shader-catalog';
/** Document model for shader paints/effects. Pure data: no GL here, so headless tests and files never need a GPU. */
export const SHADER_LIMITS={params:24,source:20_000,versions:16,shaders:64,name:80,description:400,tags:8,time:3600} as const;
export type ShaderKind='fill'|'effect';
export type ShaderSource='bundled'|'document';
export type ShaderValue=number|string;
export interface ShaderParam {key:string;label:string;type:'number'|'color';value:ShaderValue;min?:number;max?:number;step?:number;since?:number;}
export interface ShaderVersion {version:number;glsl:string;}
export interface ShaderDefinition {id:string;name:string;description:string;kinds:ShaderKind[];tags:string[];params:ShaderParam[];versions:ShaderVersion[];animated?:boolean;interactive?:boolean;fallback:[string,string];}
export interface ListedShader extends ShaderDefinition {source:ShaderSource;}
export interface ShaderBinding {shaderId:string;version:number;params:Record<string,ShaderValue>;time:number;animate:boolean;seed:number;}
export type ShaderSlot='fill'|'stroke'|'effect';
export type ShaderTrackProperty=`shader:${ShaderSlot}:${string}`;
export interface ShaderDocument {shaders?:ShaderDefinition[];}
const hex=(v:unknown):v is string=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v),text=(v:unknown,limit:number)=>typeof v==='string'&&v.length<=limit&&!/[\u0000-\u001f\u007f-\u009f]/.test(v),keyPattern=/^[a-z][a-zA-Z0-9]{0,23}$/;
const reserved=new Set(['time','resolution','pointer','seed']);
export const latestShaderVersion=(d:Pick<ShaderDefinition,'versions'>)=>d.versions[d.versions.length-1].version;
export function validateShaderBinding(value:unknown):asserts value is ShaderBinding{const b=value as ShaderBinding;if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!['shaderId','version','params','time','animate','seed'].includes(k))||typeof b.shaderId!=='string'||!/^[a-zA-Z0-9._-]{1,96}$/.test(b.shaderId)||!Number.isSafeInteger(b.version)||b.version<1||typeof b.animate!=='boolean'||!Number.isFinite(b.time)||b.time<0||b.time>SHADER_LIMITS.time||!Number.isInteger(b.seed)||b.seed<0||b.seed>65535||!b.params||typeof b.params!=='object'||Array.isArray(b.params))throw Error('Invalid shader assignment.');const entries=Object.entries(b.params);if(entries.length>SHADER_LIMITS.params||entries.some(([k,v])=>!keyPattern.test(k)||!(typeof v==='number'?Number.isFinite(v)&&Math.abs(v)<=1e6:hex(v))))throw Error('Invalid shader parameters.');}
/** Rejected before compilation. WebGL 1 GLSL additionally forbids while loops and unbounded for loops, and no samplers are ever bound. */
export function shaderSourceIssue(glsl:unknown){if(typeof glsl!=='string'||!glsl.trim())return 'Shader source is empty.';if(glsl.length>SHADER_LIMITS.source)return 'Shader source exceeds 20,000 characters.';if(/[^\t\n\r -~]/.test(glsl))return 'Shader source must be plain ASCII.';if(/^\s*#\s*(extension|version|pragma|include|line)\b/m.test(glsl))return 'Shader source cannot use #extension, #version, #pragma, #include or #line.';if(/\b(sampler\w*|texture\w*|gl_FragData|gl_FragColor|discard)\b/.test(glsl))return 'Shader source cannot use textures, discard or write gl_FragColor directly. Return a color from shade().';if(!/\bvec4\s+shade\s*\(\s*vec2\s+\w+\s*\)/.test(glsl))return 'Shader source must define vec4 shade(vec2 uv).';}
export function validateShaderDefinition(value:unknown):asserts value is ShaderDefinition{const d=value as ShaderDefinition;if(!d||typeof d!=='object'||Array.isArray(d)||Object.keys(d).some(k=>!['id','name','description','kinds','tags','params','versions','animated','interactive','fallback'].includes(k))||typeof d.id!=='string'||!/^[a-zA-Z0-9._-]{1,96}$/.test(d.id)||d.id.startsWith('forma.')||!text(d.name,SHADER_LIMITS.name)||!d.name.trim()||!text(d.description,SHADER_LIMITS.description)||!Array.isArray(d.kinds)||!d.kinds.length||d.kinds.some(k=>k!=='fill'&&k!=='effect')||!Array.isArray(d.tags)||d.tags.length>SHADER_LIMITS.tags||d.tags.some(t=>!text(t,32))||!Array.isArray(d.fallback)||d.fallback.length!==2||!d.fallback.every(hex)||d.animated!==undefined&&typeof d.animated!=='boolean'||d.interactive!==undefined&&typeof d.interactive!=='boolean')throw Error('Invalid file shader.');if(!Array.isArray(d.params)||d.params.length>SHADER_LIMITS.params||new Set(d.params.map(p=>p?.key)).size!==d.params.length)throw Error('Invalid file shader parameters.');for(const p of d.params){const numeric=p?.type==='number';if(!p||typeof p!=='object'||Object.keys(p).some(k=>!['key','label','type','value','min','max','step','since'].includes(k))||!keyPattern.test(p.key)||reserved.has(p.key)||!text(p.label,SHADER_LIMITS.name)||numeric&&(![p.value,p.min,p.max].every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1e6)||p.min!>p.max!||(p.value as number)<p.min!||(p.value as number)>p.max!||p.step!==undefined&&!(Number.isFinite(p.step)&&p.step>0))||!numeric&&(p.type!=='color'||!hex(p.value)||p.min!==undefined||p.max!==undefined||p.step!==undefined)||p.since!==undefined&&(!Number.isSafeInteger(p.since)||p.since<1))throw Error('Invalid file shader parameter.');}if(!Array.isArray(d.versions)||!d.versions.length||d.versions.length>SHADER_LIMITS.versions)throw Error('File shaders keep 1 to 16 versions.');let previous=0;for(const v of d.versions){if(!v||typeof v!=='object'||Object.keys(v).some(k=>!['version','glsl'].includes(k))||!Number.isSafeInteger(v.version)||v.version<=previous)throw Error('File shader versions must ascend.');previous=v.version;const issue=shaderSourceIssue(v.glsl);if(issue)throw Error(issue);}}
export function validateDocumentShaders(d:{shaders?:unknown}){const list=d.shaders;if(list===undefined)return;if(!Array.isArray(list)||list.length>SHADER_LIMITS.shaders)throw Error('A file keeps up to 64 shaders.');list.forEach(validateShaderDefinition);if(new Set(list.map(s=>s.id)).size!==list.length)throw Error('File shader identifiers must be unique.');}
export const allShaders=(doc?:ShaderDocument):ListedShader[]=>[...SHADER_CATALOG.map(s=>({...s,source:'bundled' as const})),...(doc?.shaders??[]).map(s=>({...s,source:'document' as const}))];
export const findShader=(id:string,doc?:ShaderDocument)=>SHADER_CATALOG.find(s=>s.id===id)??doc?.shaders?.find(s=>s.id===id);
export const shaderVersion=(d:ShaderDefinition,version:number)=>d.versions.find(v=>v.version===version);
export const paramsFor=(d:ShaderDefinition,version:number)=>d.params.filter(p=>(p.since??1)<=version);
export const defaultShader=(kind:ShaderKind)=>SHADER_CATALOG.find(s=>s.kinds.includes(kind))!;
export function createShaderBinding(d:ShaderDefinition):ShaderBinding{const version=latestShaderVersion(d);return {shaderId:d.id,version,params:Object.fromEntries(paramsFor(d,version).map(p=>[p.key,p.value])),time:0,animate:!!d.animated,seed:1};}
/** Saved values are advisory: a stale or hand-edited file is clamped here instead of reaching a uniform out of range. */
export function resolvedParams(d:ShaderDefinition,b:ShaderBinding){return Object.fromEntries(d.params.map(p=>{const v=b.params[p.key];return [p.key,p.type==='color'?(hex(v)?v:p.value):typeof v==='number'?Math.max(p.min!,Math.min(p.max!,v)):p.value];})) as Record<string,ShaderValue>;}
export interface ShaderUpdate {from:number;to:number;added:string[];}
export function shaderUpdate(b:ShaderBinding,doc?:ShaderDocument):ShaderUpdate|undefined{const d=findShader(b.shaderId,doc);if(!d)return;const to=latestShaderVersion(d);return to>b.version?{from:b.version,to,added:d.params.filter(p=>(p.since??1)>b.version&&(p.since??1)<=to).map(p=>p.label)}:undefined;}
export function updateShaderBinding(b:ShaderBinding,d:ShaderDefinition):ShaderBinding{const version=latestShaderVersion(d),known=paramsFor(d,version);return {...b,version,params:Object.fromEntries(known.map(p=>[p.key,b.params[p.key]??p.value]))};}
export interface ShaderQuery {query:string;kind:'all'|ShaderKind;source:'all'|ShaderSource;tag:string;}
export function filterShaders(list:ListedShader[],q:ShaderQuery){const words=q.query.toLowerCase().split(/\s+/).filter(Boolean);return list.filter(s=>(q.kind==='all'||s.kinds.includes(q.kind))&&(q.source==='all'||s.source===q.source)&&(!q.tag||s.tags.includes(q.tag))&&words.every(w=>[s.name,s.description,...s.tags].join(' ').toLowerCase().includes(w)));}
export const shaderTags=(list:ListedShader[])=>[...new Set(list.flatMap(s=>s.tags))].sort();
/** Duplicates carry every version's newest source only; a copy starts its own history at version 1. */
export function duplicateShader(d:ShaderDefinition,id:string=crypto.randomUUID()):ShaderDefinition{const glsl=d.versions[d.versions.length-1].glsl;return {...structuredClone(d),id:'file.'+id,name:(d.name+' copy').slice(0,SHADER_LIMITS.name),versions:[{version:1,glsl}],params:d.params.map(p=>{const {since,...rest}=p;void since;return rest;})};}
export function addShaderVersion(d:ShaderDefinition,glsl:string){const issue=shaderSourceIssue(glsl);if(issue)throw Error(issue);if(d.versions[d.versions.length-1].glsl===glsl)throw Error('The source is unchanged.');if(d.versions.length>=SHADER_LIMITS.versions)throw Error('This shader already keeps 16 versions. Duplicate it to continue.');d.versions.push({version:latestShaderVersion(d)+1,glsl});}
const paintBinding=(p:Paint|undefined)=>p?.type==='shader'?p.shader:undefined;
export interface NodeShader {slot:ShaderSlot;id:string;binding:ShaderBinding;}
export function nodeShaders(n:DesignNode):NodeShader[]{const out:NodeShader[]=[];for(const p of n.paints??[]){const b=paintBinding(p);if(b)out.push({slot:'fill',id:p.id,binding:b});}for(const s of n.strokes??[]){const b=paintBinding(s.paint);if(b)out.push({slot:'stroke',id:s.id,binding:b});}for(const e of n.effects??[])if(e.type==='shader'&&e.shader)out.push({slot:'effect',id:e.id,binding:e.shader});return out;}
export function shaderUsage(pages:{nodes:DesignNode[]}[],id:string){return pages.reduce((sum,p)=>sum+p.nodes.reduce((c,n)=>c+nodeShaders(n).filter(s=>s.binding.shaderId===id).length,0),0);}
const trackPattern=/^shader:(fill|stroke|effect):(.+):([a-z][a-zA-Z0-9]{0,23})$/;
export const isShaderTrack=(property:string):property is ShaderTrackProperty=>trackPattern.test(property);
export const shaderTrackProperty=(slot:ShaderSlot,id:string,key:string):ShaderTrackProperty=>`shader:${slot}:${id}:${key}`;
function trackBinding(n:DesignNode,property:string){const m=trackPattern.exec(property);if(!m)return;const found=nodeShaders(n).find(s=>s.slot===m[1]&&s.id===m[2]);return found&&{binding:found.binding,key:m[3]};}
export function shaderTrackValue(n:DesignNode,property:ShaderTrackProperty,doc?:ShaderDocument):ShaderValue{const t=trackBinding(n,property);if(!t)return 0;const d=findShader(t.binding.shaderId,doc);return t.binding.params[t.key]??d?.params.find(p=>p.key===t.key)?.value??0;}
/** Applied to a sampled copy only. Orphaned tracks are ignored so deleting a paint never breaks playback. */
export function applyShaderTrack(n:DesignNode,property:ShaderTrackProperty,value:ShaderValue){const t=trackBinding(n,property);if(t)t.binding.params[t.key]=value;}
export function shaderTrackLabel(n:DesignNode|undefined,property:ShaderTrackProperty,doc?:ShaderDocument){const t=n&&trackBinding(n,property);if(!t)return 'Removed shader parameter';const d=findShader(t.binding.shaderId,doc);return `${d?.name??'Missing shader'} ${d?.params.find(p=>p.key===t.key)?.label??t.key}`;}
/** Inspectors read sampled nodes while Motion is open. Saving must keep the stored binding, never the sampled time or track values. */
export function withSavedShaders(paints:Paint[],saved:Paint[]|undefined){return saved?paints.map(p=>{const base=p.type==='shader'?saved.find(v=>v.id===p.id):undefined;return base?.shader?{...p,shader:base.shader}:p;}):paints;}
function stampPaint(p:Paint,time:number):Paint{return p.type==='shader'&&p.shader?.animate?{...p,shader:{...p.shader,time:Math.min(SHADER_LIMITS.time,p.shader.time+time)}}:p;}
/** Motion time reaches shaders through sampled copies, so the saved poster time never changes during playback. */
export function stampShaderTime(nodes:DesignNode[],time:number){if(!time)return nodes;let any=false;const out=nodes.map(n=>{if(!nodeShaders(n).some(s=>s.binding.animate))return n;any=true;const next={...n};if(n.paints)next.paints=n.paints.map(p=>stampPaint(p,time));if(n.strokes)next.strokes=n.strokes.map(s=>({...s,paint:stampPaint(s.paint,time)}));if(n.effects)next.effects=n.effects.map(e=>e.type==='shader'&&e.shader?.animate?{...e,shader:{...e.shader,time:Math.min(SHADER_LIMITS.time,e.shader.time+time)}}:e);return next;});return any?out:nodes;}
const hexColor=(c:string)=>[1,3,5].map(i=>(parseInt(c.slice(i,i+2),16)/255).toFixed(5));
export const SHADER_VERTEX='attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=vec2(a_position.x*.5+.5,.5-a_position.y*.5);gl_Position=vec4(a_position,0.,1.);}';
export const SHADER_PRELUDE=`precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform float u_seed;
float f_hash(vec2 p){return fract(sin(p.x*91.37+p.y*47.11+u_seed*3.71)*24634.6345);}
float f_noise(vec2 p){vec2 i=floor(p),f=fract(p),s=f*f*(3.-2.*f);return mix(mix(f_hash(i),f_hash(i+vec2(1.,0.)),s.x),mix(f_hash(i+vec2(0.,1.)),f_hash(i+vec2(1.,1.)),s.x),s.y);}
float f_fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*f_noise(p);p=p*2.03+vec2(11.3,7.9);a*=.5;}return v;}
`;
export const shaderUniformName=(key:string)=>'u_'+key;
export function shaderFragment(d:ShaderDefinition,glsl:string){return `${SHADER_PRELUDE}${d.params.map(p=>`uniform ${p.type==='color'?'vec3':'float'} ${shaderUniformName(p.key)};`).join('\n')}\n#line 1\n${glsl}\nvoid main(){vec4 c=shade(v_uv);gl_FragColor=clamp(c,0.,1.);}`;}
export const shaderColorUniform=(color:string)=>hexColor(color).map(Number) as [number,number,number];
