import {outsideSrgb,p3ToSrgbHex,srgbToP3Hex} from './color-profile';
import type {DocumentColorProfile} from './color-profile';
import type {DesignDocument} from './model';
const hex=/^#[0-9a-f]{6}([0-9a-f]{2})?$/i;
/** Keys that only ever hold paint. A hex-looking string anywhere else may be someone's text, so an allow list decides, never a pattern alone. */
const colorKeys=new Set(['color','fill','stroke','background','textBackground']);
/** Private notes, editor metadata and copied third-party baselines describe artwork; they do not paint it. */
const skipped=new Set(['comments','annotations','code','spec','widget','propertyValues','propertyDefinitions','componentProperties','codeConnect','devResources','fonts','shaders','fileCover','paragraphStyles','exportSettings','bindings','variableBindings','overrideKeys','overrideBindings','componentLibraries','libraryPublication','colorProfile','variables','variableCollections','colors','motion','text','name','description','image','path','points','contours','media','prototypeAudio']);
export interface ColorConversionReport {colors:number;clipped:number;}
function walk(value:unknown,visit:(host:Record<string,unknown>,key:string)=>void,depth=0){if(depth>64||!value||typeof value!=='object')return;if(Array.isArray(value)){for(const item of value)walk(item,visit,depth+1);return;}const host=value as Record<string,unknown>;for(const key of Object.keys(host)){if(skipped.has(key))continue;const child=host[key];if(typeof child==='string'){if(colorKeys.has(key)&&hex.test(child))visit(host,key);}else walk(child,visit,depth+1);}}
const shaderParams=(paint:unknown,visit:(host:Record<string,unknown>,key:string)=>void)=>{const params=(paint as {shader?:{params?:Record<string,unknown>}}).shader?.params;if(params)for(const key of Object.keys(params))if(typeof params[key]==='string'&&hex.test(params[key] as string))visit(params,key);};
function shadersIn(value:unknown,visit:(host:Record<string,unknown>,key:string)=>void,depth=0){if(depth>64||!value||typeof value!=='object')return;if(Array.isArray(value)){for(const item of value)shadersIn(item,visit,depth+1);return;}const host=value as Record<string,unknown>;if(host.shader&&typeof host.shader==='object')shaderParams(host,visit);for(const key of Object.keys(host))if(!skipped.has(key)&&typeof host[key]==='object')shadersIn(host[key],visit,depth+1);}
/** Everything in a document that paints: layers, page settings, styles, palette, color variables, keyframes and shader settings. */
function visitDocument(doc:DesignDocument,visit:(host:Record<string,unknown>,key:string)=>void){
 for(const root of [doc.pages,doc.styles,doc.whiteboard,doc.slides,doc.site]){walk(root,visit);shadersIn(root,visit);}
 for(const c of doc.colors??[])if(hex.test(c.value))visit(c as unknown as Record<string,unknown>,'value');
 for(const v of doc.variables??[])if(v.type==='color')for(const mode of Object.keys(v.values))if(typeof v.values[mode]==='string'&&hex.test(v.values[mode] as string))visit(v.values,mode);
 for(const p of doc.pages)for(const track of p.motion?.tracks??[])if(track.property!=='text')for(const k of track.keyframes)if(typeof k.value==='string'&&hex.test(k.value))visit(k as unknown as Record<string,unknown>,'value');
 for(const s of doc.shaders??[])for(const param of s.params??[])if(param.type==='color'&&typeof param.value==='string'&&hex.test(param.value))visit(param as unknown as Record<string,unknown>,'value');
}
export function colorConversionRefusal(doc:DesignDocument,target:DocumentColorProfile){if((doc.colorProfile??'srgb')===target)return 'The file already uses this color profile.';if(doc.componentLibraries?.length)return 'Linked libraries keep their own color values. Detach them before converting this file.';return '';}
export function previewColorConversion(doc:DesignDocument,target:DocumentColorProfile):ColorConversionReport{let colors=0,clipped=0;visitDocument(doc,(host,key)=>{colors++;if(target==='srgb'&&outsideSrgb((host[key] as string).slice(0,7)))clipped++;});return {colors,clipped};}
/** Rewrites saved values so colors look the same under the new profile. Rounding to 8 bits can move a channel by a step. Colors outside sRGB clip on the way down. */
export function convertDocumentColors(doc:DesignDocument,target:DocumentColorProfile):ColorConversionReport{const refused=colorConversionRefusal(doc,target);if(refused)throw Error(refused);const change=target==='display-p3'?srgbToP3Hex:p3ToSrgbHex,report=previewColorConversion(doc,target);visitDocument(doc,(host,key)=>{const value=host[key] as string;host[key]=change(value.slice(0,7))+value.slice(7);});if(target==='srgb')delete doc.colorProfile;else doc.colorProfile=target;return report;}
