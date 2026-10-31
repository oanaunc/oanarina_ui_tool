import type {KeyboardEvent} from 'react';
import type {DesignNode} from './model';
import {formatTextRange,rangeTextStyle,replaceRichText} from './rich-text';
import type {TextStyle} from './rich-text';
import type {TextField} from './text-surface';
export type FormatKey='bold'|'italic'|'underline';
/** Command on Mac, Control elsewhere. Shifted and Option combinations stay with the browser. */
export const formatKeyName=(e:{key:string;metaKey:boolean;ctrlKey:boolean;altKey:boolean;shiftKey:boolean}):FormatKey|undefined=>(e.metaKey||e.ctrlKey)&&!e.altKey&&!e.shiftKey?({b:'bold',i:'italic',u:'underline'} as const)[e.key.toLowerCase() as 'b']:undefined;
const toggled=(key:FormatKey,style:TextStyle,mixed:readonly string[]):TextStyle=>key==='bold'?{fontWeight:(style.fontWeight??400)>=600&&!mixed.includes('fontWeight')?400:700}:key==='italic'?{fontStyle:style.fontStyle==='italic'&&!mixed.includes('fontStyle')?'normal':'italic'}:{decorations:mixed.includes('decorations')||!style.decorations?.includes('underline')?[...new Set([...(style.decorations??[]),'underline' as const])]:(style.decorations??[]).filter(d=>d!=='underline')};
/** A selection formats its characters; a caret toggles the layer, matching the Text menu command. */
export function textFormatPatch(n:DesignNode,start:number,end:number,key:FormatKey):Partial<DesignNode>{if(start!==end){const {style,mixed}=rangeTextStyle(n,start,end);return {textRuns:formatTextRange(n,start,end,toggled(key,style,mixed))};}return key==='bold'?{fontWeight:n.fontWeight>=600?400:700}:key==='italic'?{fontStyle:n.fontStyle==='italic'?'normal':'italic'}:{decorations:n.decorations?.includes('underline')?n.decorations.filter(d=>d!=='underline'):[...(n.decorations??[]),'underline']};}
/** Commits the uncontrolled canvas editor's text with the format so the caret and selection survive. */
export function canvasFormatKey(e:KeyboardEvent,n:DesignNode,patch:(ids:string[],value:Partial<DesignNode>)=>void,target:TextField=e.currentTarget as unknown as TextField,remapped?:FormatKey|false){const key=remapped===false?undefined:remapped??formatKeyName(e);if(!key||e.nativeEvent.isComposing)return false;const live={...n,...replaceRichText(n,target.value)},start=target.selectionStart,end=target.selectionEnd;e.preventDefault();patch([n.id],{text:live.text,textRuns:live.textRuns,paragraphStyles:live.paragraphStyles,...textFormatPatch(live,start,end,key)});target.setSelectionRange(start,end);return true;}
