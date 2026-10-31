export interface SvgExportSettings {textMode?:'appearance'|'text'|'outline';includeLayerIds?:boolean;preserveAttributes?:boolean;outlineStrokes?:boolean;simplifyStrokes?:boolean;}
export function validateSvgExportSettings(value:unknown):asserts value is SvgExportSettings|undefined {
 if(value===undefined)return;
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid SVG export options.');
 const v=value as Record<string,unknown>;
 if(Object.keys(v).some(k=>!['textMode','includeLayerIds','preserveAttributes','outlineStrokes','simplifyStrokes'].includes(k))||v.textMode!==undefined&&!['appearance','text','outline'].includes(v.textMode as string)||['includeLayerIds','preserveAttributes','outlineStrokes','simplifyStrokes'].some(k=>v[k]!==undefined&&typeof v[k]!=='boolean'))throw Error('Use valid text, ID and presentation-attribute SVG options.');
 if(v.outlineStrokes===true&&v.simplifyStrokes===true)throw Error('Choose either Outline supported strokes or Simplify aligned strokes, not both.');
}
