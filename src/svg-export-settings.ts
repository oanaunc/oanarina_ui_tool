export interface SvgExportSettings {textMode?:'appearance'|'text';includeLayerIds?:boolean;preserveAttributes?:boolean;}
export function validateSvgExportSettings(value:unknown):asserts value is SvgExportSettings|undefined {
 if(value===undefined)return;
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid SVG export options.');
 const v=value as Record<string,unknown>;
 if(Object.keys(v).some(k=>!['textMode','includeLayerIds','preserveAttributes'].includes(k))||v.textMode!==undefined&&!['appearance','text'].includes(v.textMode as string)||['includeLayerIds','preserveAttributes'].some(k=>v[k]!==undefined&&typeof v[k]!=='boolean'))throw Error('Use valid text, ID and presentation-attribute SVG options.');
}
