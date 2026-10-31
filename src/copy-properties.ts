import type {DesignNode} from './model';
const visualFields=['fill','paints','gradient','stroke','strokes','strokeWidth','effects','shadow','blur','opacity','blendMode','isolate','radius','corners','cornerSmoothing'] as const;
const textFields=['fontFamily','fontFallbacks','fontWeight','fontStyle','fontSize','lineHeight','lineHeightPx','letterSpacing','textAlign'] as const;
export interface CopiedProperties {source:string;values:Partial<DesignNode>;styleIds?:DesignNode['styleIds'];variableBindings?:DesignNode['variableBindings'];text?:Partial<DesignNode>;}
let held:CopiedProperties|null=null;
const pick=(n:DesignNode,fields:readonly (keyof DesignNode)[])=>Object.fromEntries(fields.filter(key=>n[key]!==undefined).map(key=>[key,structuredClone(n[key])])) as Partial<DesignNode>;
/** Held in this window only: a look is a working clipboard, not document data. */
export function copyProperties(n:DesignNode){held={source:n.name,values:pick(n,visualFields),styleIds:structuredClone(n.styleIds),variableBindings:structuredClone(n.variableBindings),...(n.type==='text'?{text:pick(n,textFields)}:{})};return held;}
export const clearCopiedProperties=()=>{held=null;};
export const copiedProperties=()=>held;
/** Geometry, content and layout stay on the target. Text settings only travel between text layers. */
export function propertiesPatch(n:Pick<DesignNode,'type'>,copied:CopiedProperties):Partial<DesignNode>{const clone=<T,>(v:T)=>structuredClone(v);return {...clone(copied.values),...(n.type==='text'&&copied.text?clone(copied.text):{}),styleIds:clone(copied.styleIds),variableBindings:clone(copied.variableBindings)};}
