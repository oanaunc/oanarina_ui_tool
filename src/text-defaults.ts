import type {DesignNode,Page} from './model';
const FACTORY_TEXT_FILL='#202027',LIGHT_TEXT_FILL='#f4f2f8';
const channel=(hex:string,at:number)=>{const value=parseInt(hex.slice(at,at+2),16)/255;return value<=.03928?value/12.92:((value+.055)/1.055)**2.4;};
export const relativeLuminance=(hex:string)=>/^#[\da-f]{6}/i.test(hex)?.2126*channel(hex,1)+.7152*channel(hex,3)+.0722*channel(hex,5):1;
/** The paint a new layer lands on: the nearest visibly filled ancestor, otherwise the canvas. */
export function backdropColor(parent:DesignNode|undefined,nodes:readonly DesignNode[],page:Pick<Page,'background'>,theme:string){const seen=new Set<string>();for(let n=parent;n&&!seen.has(n.id);n=nodes.find(a=>a.id===n!.parentId)){seen.add(n.id);const paint=n.paints?n.paints.find(p=>p.visible&&p.type==='solid'&&p.opacity>.5)?.color:n.fill;if(paint&&paint!=='none'&&/^#[\da-f]{6}/i.test(paint))return paint;}const canvas=theme==='light'?'#f5f5f5':'#1e1e1e';return page.background?.visible===false?canvas:page.background?.color??canvas;}
/** A chosen default is respected; only the factory ink yields, because it disappears on a dark canvas. */
export function legibleTextFill(preferred:string,backdrop:string){return preferred.toLowerCase()===FACTORY_TEXT_FILL&&relativeLuminance(backdrop)<.18?LIGHT_TEXT_FILL:preferred;}
export function textLayerName(text:string){const line=text.split('\n').map(v=>v.trim()).find(Boolean)??'';return line.length>40?line.slice(0,39).trimEnd()+'…':line;}
/** A text layer keeps following its words until someone gives it a different name. */
export function textEditPatch(n:Pick<DesignNode,'name'|'text'>,text:string):{text:string;name?:string}{const name=textLayerName(text),automatic=n.name==='Text'||n.name===textLayerName(n.text);return name&&automatic&&name!==n.name?{text,name}:{text};}
export const textEditorColor=(n:Pick<DesignNode,'fill'|'paints'>)=>{const solid=n.paints?n.paints.find(p=>p.visible&&p.type==='solid')?.color:n.fill;return solid&&solid!=='none'?solid:'#8f8a99';};
