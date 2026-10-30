import type {DesignNode} from './model';
export interface TextOutline {signature:string;path:string;}
const fields=['text','fontFamily','fontSize','fontWeight','fontStyle','textAlign','verticalAlign','textResize','lineHeight','letterSpacing','paragraphSpacing','paragraphIndent','maxLines','textOverflow','listStyle','hyperlink','textRuns','fontAxes','fontFeatures','underline','decorations','width','height','clip'] as const;
/** Keep original glyph geometry only until an appearance/layout-affecting text edit. */
export function textOutlineSignature(n:DesignNode){const values:unknown[]=fields.map(key=>n[key]??null);if(n.smallCaps||n.textPosition&&n.textPosition!=='normal')values.push(n.smallCaps??false,n.textPosition??'normal');if(n.paragraphStyles?.length||n.listIndent!==undefined||n.markerGap!==undefined||n.listItemSpacing||n.listHanging)values.push(n.paragraphStyles??null,n.listIndent??null,n.markerGap??null,n.listItemSpacing??0,n.listHanging??false);if(n.lineHeightPx!==undefined)values.push('lineHeightPx',n.lineHeightPx);if(n.textDirection!==undefined)values.push('textDirection',n.textDirection);if(n.textWrap!==undefined)values.push('textWrap',n.textWrap);if(n.hangingQuotes!==undefined)values.push('hangingQuotes',n.hangingQuotes);if(n.textVerticalTrim!==undefined)values.push('textVerticalTrim',n.textVerticalTrim);return JSON.stringify(values);}
export function currentTextOutline(n:DesignNode){return n.type==='text'&&n.textOutline?.signature===textOutlineSignature(n)?n.textOutline.path:undefined;}
/** This metadata accepts path data only, never markup, URLs or arbitrary SVG. */
export function validateTextOutline(value:unknown){
 if(value===undefined)return;
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid imported text outline.');
 const o=value as TextOutline;
 if(Object.keys(o).some(k=>!['signature','path'].includes(k))||typeof o.signature!=='string'||!o.signature||o.signature.length>1_000_000||typeof o.path!=='string'||o.path.length>2_000_000)throw Error('Invalid imported text outline.');
 const pattern=/[MLQCZ]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi,tokens=o.path.match(pattern)??[];
 if(o.path.replace(pattern,'').replace(/[\s,]/g,''))throw Error('Invalid imported text outline path.');
 if(tokens.length>200_000)throw Error('Imported text outline is too complex.');
 let i=0,started=false;while(i<tokens.length){const command=tokens[i++],count=({M:2,L:2,Q:4,C:6,Z:0} as Record<string,number>)[command];if(count===undefined||!started&&command!=='M')throw Error('Invalid imported text outline command.');started=true;for(let j=0;j<count;j++){const raw=tokens[i++],v=Number(raw);if(raw===undefined||!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(raw)||!Number.isFinite(v)||Math.abs(v)>1e6)throw Error('Invalid imported text outline coordinate.');}}
}
