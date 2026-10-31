import type {LayerAnnotationSet} from './layer-annotations';
import type {DevelopmentStatus} from './development-status';
import {validateLayerParentPaths} from './layer-parent-validation';
import type {ComponentLibrary,LibraryPublication} from './local-library-metadata';
import type {DocumentCover} from './document-cover';
import {validateDocumentSurfaces} from './surface-paint';
import {validateStrokeStack} from './paints';
import type {ArrowheadStyle} from './arrowheads';
import type {EmbeddedVideo} from './media';
import type {TextOutline} from './text-outline';
import type {FrameExportSetting} from './frame-export-settings';
import {validateDocumentMetadata} from './document-metadata';
import {validateGrids} from './grid';
import type {GridTrack,GridAlignment} from './grid';
import {validateMasks} from './masks';
import type {LayerMask} from './masks';
import {validateRichTextDocument} from './rich-text';
import type {TextRun,UnderlineStyle} from './rich-text';
import {validateSlides} from './slides';
import type {SlideDeck} from './slides';
import {validateWhiteboard} from './whiteboard';
import type {WhiteboardData} from './whiteboard';
import {validateFontAsset} from './font-data';
import type {FontAsset} from './font-data';
import {validatePrototype} from './prototype';
import type {PrototypeReaction,PrototypeFlow,PrototypeSettings} from './prototype';
import {validateGuides} from './guides';
import type {LayoutGuideBindings} from './responsive-guides';
import type {LayoutGuide,LayoutGuideStyle,CanvasGuide,SnapPreferences} from './guides';
import {validateMotionStyles,validateTimeline} from './motion';
import type {MotionStyle,Timeline} from './motion';
import {validateDesignSystems} from './design-systems';
import type {BindingField,VariableCollection,DesignVariable,DesignStyle,StyleKind} from './design-systems';
import {validateComponents} from './components-model';
import type {ComponentMetadata,ComponentSet} from './components-model';
import type {Sizing,Constraint,Distribution} from './layout';
export {reflow} from './layout';
import {validateEffect} from './effects';
import type {Effect} from './effects';
import {validatePaint} from './paints';
import type {Paint,StrokeStyle} from './paints';
export type NodeKind = 'frame'|'section'|'slice'|'rectangle'|'ellipse'|'line'|'arrow'|'polygon'|'star'|'text'|'path'|'image'|'group'|'component'|'instance';
export type Tool = NodeKind|'move'|'hand'|'scale'|'pen'|'pencil'|'brush'|'comment';
export interface VectorPoint {x:number;y:number;in?:{x:number;y:number};out?:{x:number;y:number};mode?:'mirrored'|'aligned'|'independent';widthScale?:number;}
export interface VectorContour {points:VectorPoint[];closed:boolean;}
export interface DesignNode {strokeScaleMode?:import('./stroke-scaling').StrokeScaleMode;rotationOrigin?:{x:number;y:number};cornerSmoothing?:number;
  id:string; type:NodeKind; name:string; parentId:string|null;
  x:number; y:number; width:number; height:number; rotation:number;
  fill:string; paints?:Paint[]; strokes?:StrokeStyle[]; blendMode?:string; effects?:Effect[]; isolate?:boolean; stroke:string; strokeWidth:number; opacity:number; radius:number;
  aspectLocked?:boolean;layoutAspectRatio?:number;mask?:LayerMask;exportGhost?:boolean;motionScaleX?:number;motionScaleY?:number;visible:boolean; locked:boolean; text:string; fontSize:number; fontFamily:string; fontFallbacks?:string[]; fontWeight:number;
  annotations?:LayerAnnotationSet;developmentStatus?:DevelopmentStatus;accessibilityLabel?:string;textDescription?:string;hangingQuotes?:boolean;textVerticalTrim?:import('./text-vertical-trim').TextVerticalTrim;textWrap?:import('./text-wrap').TextWrap;textDirection?:import('./text-direction').TextDirection;textBackground?:string;exportSettings?:FrameExportSetting[];readyForDevelopment?:boolean;devResources?:import('./developer-resources').DeveloperResource[];media?:EmbeddedVideo;
  textPath?:import('./text-path').TextPathSettings;smallCaps?:boolean;textPosition?:'normal'|'superscript'|'subscript';paragraphStyles?:import('./paragraphs').ParagraphOverride[];listIndent?:number;markerGap?:number;listItemSpacing?:number;listHanging?:boolean;textOutline?:TextOutline;textRuns?:TextRun[];fontAxes?:Record<string,number>;fontFeatures?:Record<string,number>;underline?:UnderlineStyle;
  textAlign:'left'|'center'|'right'|'justify'; fontStyle?:'normal'|'italic';decorations?:('underline'|'line-through')[];textResize?:'auto-width'|'auto-height'|'fixed';verticalAlign?:'top'|'middle'|'bottom';paragraphSpacing?:number;paragraphIndent?:number;maxLines?:number;textOverflow?:'visible'|'ellipsis';listStyle?:'none'|'bullet'|'number';hyperlink?:string; lineHeight:number;lineHeightPx?:number; letterSpacing:number;
  arrowStart?:ArrowheadStyle;arrowEnd?:ArrowheadStyle;arrowSize?:number;fillRule?:'nonzero'|'evenodd';path:string; points:VectorPoint[]; contours?:VectorContour[]; closed?:boolean; pathWidth?:number;pathHeight?:number;booleanOp?:'union'|'subtract'|'intersect'|'exclude';pointCount?:number;innerRadius?:number;arcStart?:number;arcSweep?:number;arcInner?:number;corners?:[number,number,number,number];flipX?:boolean;flipY?:boolean; image:string; shadow:boolean; blur:number;
  layout:'none'|'horizontal'|'vertical'|'grid'; gap:number; padding:number; columns:number;
  gridRows?:number;gridColumns?:GridTrack[];gridRowTracks?:GridTrack[];gridColumn?:number;gridRow?:number;gridColumnSpan?:number;gridRowSpan?:number;gridAlignX?:GridAlignment;gridAlignY?:GridAlignment;
  sizingX?:Sizing;sizingY?:Sizing;minWidth?:number;maxWidth?:number;minHeight?:number;maxHeight?:number;constraintX?:Constraint;constraintY?:Constraint;ignoreLayout?:boolean;paddings?:[number,number,number,number];gapX?:number;gapY?:number;justifyContent?:Distribution;alignItems?:'start'|'center'|'end'|'stretch'|'baseline';wrap?:boolean;layoutStacking?:'last-on-top'|'first-on-top';layoutIncludeStroke?:boolean;wrapDirection?:'forward'|'reverse';wrapAlign?:import('./layout-settings').WrapAlignment;
  variableBindings?:Partial<Record<BindingField,string>>;variableModes?:Record<string,string>;styleIds?:Partial<Record<StyleKind,string>>;
  sourceId?:string;instanceRootId?:string;overrideKeys?:string[];componentKey?:string;componentMetadata?:ComponentMetadata;propertyValues?:Record<string,string|boolean>;
  layoutGuideBindings?:LayoutGuideBindings;layoutGuides?:LayoutGuide[];layoutGuideStyleId?:string;reactions?:PrototypeReaction[];prototypeScroll?:'none'|'horizontal'|'vertical'|'both';prototypePosition?:'normal'|'fixed'|'sticky';
  clip:boolean; componentId:string|null; targetId:string|null; gradient:boolean;
}
export interface Comment {id:string; x:number;y:number; text:string; resolved:boolean;author?:string;createdAt?:string;editedAt?:string;replies?:import('./comment-threads').CommentReply[];anchor?:import('./comment-threads').CommentAnchor;}
export interface Page {developmentStatus?:DevelopmentStatus;background?:{color:string;opacity:number;visible:boolean};id:string;name:string;nodes:DesignNode[];comments:Comment[];motion?:Timeline;flows?:PrototypeFlow[];prototypeSettings?:PrototypeSettings;guides?:CanvasGuide[];guidesLocked?:boolean;guidesVisible?:boolean;}
export interface DesignDocument {fileCover?:DocumentCover;libraryPublication?:LibraryPublication;componentLibraries?:ComponentLibrary[];format:'oanarina-ui';version:2;id:string;name:string;description?:string;pages:Page[];colors:{name:string;value:string}[];updatedAt:string;workspace?:'design'|'whiteboard'|'slides';whiteboard?:WhiteboardData;slides?:SlideDeck;motionStyles?:MotionStyle[];componentSets?:ComponentSet[];variableCollections?:VariableCollection[];variables?:DesignVariable[];variableModes?:Record<string,string>;styles?:DesignStyle[];fonts?:FontAsset[];layoutGuideStyles?:LayoutGuideStyle[];snapping?:SnapPreferences;layoutGuidesVisible?:boolean;}
export const uid = () => crypto.randomUUID();
export const containers:NodeKind[]=['frame','group','section','component','instance'];
export function node(type:NodeKind, props:Partial<DesignNode>={}):DesignNode {
  return {id:uid(),type,name:type[0].toUpperCase()+type.slice(1),parentId:null,x:0,y:0,width:160,height:100,rotation:0,
    fill:type==='text'?'#202027':type==='frame'?'#ffffff':'#d8c9f2',stroke:type==='line'||type==='arrow'||type==='path'?'#2b2935':'',strokeWidth:2,opacity:1,radius:0,
    visible:true,locked:false,text:'Your text',fontSize:24,fontFamily:'Inter',fontWeight:400,textAlign:'left',lineHeight:1.3,letterSpacing:0,path:'',points:[],image:'',shadow:false,blur:0,
    layout:'none',gap:16,padding:24,columns:3,clip:type==='frame',componentId:null,targetId:null,gradient:false,...props};
}
export function blankDocument():DesignDocument {return {format:'oanarina-ui',version:2,id:uid(),name:'Untitled',pages:[{id:uid(),name:'Page 1',nodes:[],comments:[]}],colors:[{name:'Rose',value:'#edb5d3'},{name:'Ink',value:'#282631'},{name:'Lavender',value:'#c8b9ee'},{name:'Sky',value:'#addce2'}],updatedAt:new Date().toISOString()};}
export function descendants(nodes:DesignNode[], ids:string[]):string[] {
  const found=new Set(ids);let changed=true;
  while(changed){changed=false;for(const n of nodes)if(n.parentId&&found.has(n.parentId)&&!found.has(n.id)){found.add(n.id);changed=true;}}
  return [...found];
}
export function bounds(nodes:DesignNode[]) {
  if(!nodes.length)return {x:0,y:0,width:1440,height:1000};
  const x=Math.min(...nodes.map(n=>n.x)),y=Math.min(...nodes.map(n=>n.y));
  return {x,y,width:Math.max(1,...nodes.map(n=>n.x+n.width-x)),height:Math.max(1,...nodes.map(n=>n.y+n.height-y))};
}
export function effectiveVisible(n:DesignNode,nodes:DesignNode[]):boolean {
  const visited=new Set<string>();let current:DesignNode|undefined=n;
  while(current){if(!current.visible||visited.has(current.id))return false;visited.add(current.id);current=nodes.find(a=>a.id===current!.parentId);}return true;
}
export function isLocked(n:DesignNode,nodes:DesignNode[]):boolean {let current:DesignNode|undefined=n;const seen=new Set<string>();while(current){if(current.locked||seen.has(current.id))return true;seen.add(current.id);current=nodes.find(a=>a.id===current!.parentId);}return false;}
export function parseDocument(raw:string):DesignDocument {
  if(raw.length>50_000_000)throw Error('This file exceeds the 50 MB project limit.');
  const d=JSON.parse(raw);
  if(d.format!=='oanarina-ui'||![1,2].includes(d.version)||!Array.isArray(d.pages)||!d.pages.length||typeof d.name!=='string')throw Error('Choose an Oanarina .oui file or a Figma Bridge .oui file. Direct .fig files are not supported yet.');
  if(typeof d.id!=='string'||!d.id.trim()||typeof d.updatedAt!=='string'||!Number.isFinite(Date.parse(d.updatedAt)))throw Error('Invalid document identity or timestamp.');
  validateDocumentMetadata(d);
  validateDocumentSurfaces(d);
  if(d.pages.length>1000)throw Error('Too many pages.');
  const ids=new Set<string>();
  for(const p of d.pages){if(typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||!Array.isArray(p.nodes)||!Array.isArray(p.comments)||p.nodes.length>20000)throw Error('Invalid page.');ids.add(p.id);
    if(p.background!==undefined&&(!p.background||typeof p.background!=='object'||!/^#[0-9a-f]{6}$/i.test(p.background.color)||!Number.isFinite(p.background.opacity)||p.background.opacity<0||p.background.opacity>1||typeof p.background.visible!=='boolean'))throw Error('Invalid canvas background.');
    const nodeIds=new Set<string>();for(const n of p.nodes){if(typeof n.id!=='string'||nodeIds.has(n.id)||!['frame','section','slice','rectangle','ellipse','line','arrow','polygon','star','text','path','image','group','component','instance'].includes(n.type))throw Error('Invalid or duplicate layer.');nodeIds.add(n.id);
      for(const k of ['x','y','width','height','rotation','opacity','fontSize','strokeWidth','radius','gap','padding','columns','lineHeight','letterSpacing','blur'])if(!Number.isFinite(n[k]))throw Error(`Invalid layer property: ${k}`);
      if(n.width<0||n.height<0||n.width>1e6||n.height>1e6||n.fontSize<=0||n.opacity<0||n.opacity>1||n.columns<1)throw Error('Layer values out of range.');
      for(const k of ['name','fill','stroke','text','fontFamily','path','image'])if(typeof n[k]!=='string')throw Error('Invalid text property.');
      if(n.image&&!/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,/.test(n.image))throw Error('Only embedded images are supported.');
      if(!Array.isArray(n.points)||n.points.some((pt:{x:number;y:number})=>!Number.isFinite(pt.x)||!Number.isFinite(pt.y)))throw Error('Invalid path points.');
      if(n.fillRule!==undefined&&!['nonzero','evenodd'].includes(n.fillRule))throw Error('Invalid vector winding rule.');
      const contours=n.contours;if(contours!==undefined&&(!Array.isArray(contours)||contours.length>1000||contours.some((c:VectorContour)=>!Array.isArray(c.points)||typeof c.closed!=='boolean')))throw Error('Invalid vector contours.');
      const points=[...n.points,...(contours??[]).flatMap((c:VectorContour)=>c.points)];if(points.length>100000)throw Error('Too many vector points.');
      for(const pt of points){if(!Number.isFinite(pt.x)||!Number.isFinite(pt.y))throw Error('Invalid vector point.');for(const handle of [pt.in,pt.out])if(handle&&(!Number.isFinite(handle.x)||!Number.isFinite(handle.y)))throw Error('Invalid vector tangent.');}
      for(const k of ['pathWidth','pathHeight','pointCount','innerRadius','arcStart','arcSweep','arcInner'])if(n[k]!==undefined&&!Number.isFinite(n[k]))throw Error('Invalid shape property.');
      for(const key of ['paragraphSpacing','paragraphIndent','maxLines'])if(n[key]!==undefined&&(!Number.isFinite(n[key])||n[key]<0))throw Error('Invalid text layout value.');
      for(const [key,values] of Object.entries({fontStyle:['normal','italic'],textResize:['auto-width','auto-height','fixed'],verticalAlign:['top','middle','bottom'],textOverflow:['visible','ellipsis'],listStyle:['none','bullet','number']}))if(n[key]!==undefined&&!values.includes(n[key]))throw Error('Invalid text setting.');
      if(n.decorations!==undefined&&(!Array.isArray(n.decorations)||n.decorations.some((v:string)=>!['underline','line-through'].includes(v))))throw Error('Invalid text decoration.');
      if(n.hyperlink!==undefined&&(typeof n.hyperlink!=='string'||!/^https?:\/\//i.test(n.hyperlink)))throw Error('Invalid text hyperlink.');
      if(n.paints!==undefined){if(!Array.isArray(n.paints)||n.paints.length>100)throw Error('Invalid paint stack.');n.paints.forEach(validatePaint);}
      for(const key of ['minWidth','maxWidth','minHeight','maxHeight','gapX','gapY'])if(n[key]!==undefined&&(!Number.isFinite(n[key])||Math.abs(n[key])>1e6||key.startsWith('min')&&n[key]<0||key.startsWith('max')&&n[key]<0))throw Error('Invalid layout dimension.');
      if(n.minWidth>n.maxWidth||n.minHeight>n.maxHeight)throw Error('Minimum size exceeds maximum.');
      if(n.paddings!==undefined&&(!Array.isArray(n.paddings)||n.paddings.length!==4||n.paddings.some((v:number)=>!Number.isFinite(v)||v<0||v>1e6)))throw Error('Invalid layout padding.');
      for(const [key,values] of Object.entries({sizingX:['fixed','hug','fill'],sizingY:['fixed','hug','fill'],constraintX:['start','end','center','stretch','scale'],constraintY:['start','end','center','stretch','scale'],justifyContent:['start','center','end','space-between','space-around','space-evenly'],alignItems:['start','center','end','stretch','baseline']}))if(n[key]!==undefined&&!values.includes(n[key]))throw Error('Invalid layout setting.');
      for(const key of ['wrap','ignoreLayout'])if(n[key]!==undefined&&typeof n[key]!=='boolean')throw Error('Invalid layout flag.');
      if(n.effects!==undefined){if(!Array.isArray(n.effects)||n.effects.length>100)throw Error('Invalid effect stack.');n.effects.forEach(validateEffect);}
      for(const k of ['aspectLocked','flipX','flipY','exportGhost'])if(n[k]!==undefined&&typeof n[k]!=='boolean')throw Error('Invalid rendering flag.');for(const k of ['motionScaleX','motionScaleY'])if(n[k]!==undefined&&(!Number.isFinite(n[k])||n[k]<0||n[k]>10000))throw Error('Invalid render scale.');
      if(n.isolate!==undefined&&typeof n.isolate!=='boolean')throw Error('Invalid isolation flag.');
      if(n.blendMode!==undefined&&!['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity'].includes(n.blendMode))throw Error('Invalid blend mode.');
      validateStrokeStack(n.strokes);
      if(n.booleanOp!==undefined&&!['union','subtract','intersect','exclude'].includes(n.booleanOp))throw Error('Invalid boolean operation.');
      if(n.corners!==undefined&&(!Array.isArray(n.corners)||n.corners.length!==4||n.corners.some((v:number)=>!Number.isFinite(v)||v<0)))throw Error('Invalid corner radii.');

    }
    validateTimeline(p.motion);
    for(const c of p.comments)if(typeof c.id!=='string'||typeof c.text!=='string'||typeof c.resolved!=='boolean'||!Number.isFinite(c.x)||!Number.isFinite(c.y))throw Error('Invalid comment.');
    validateLayerParentPaths<DesignNode>(p.nodes,n=>{if(!(n.parentId===null||typeof n.parentId==='string')||!['none','horizontal','vertical','grid'].includes(n.layout)||!['left','center','right','justify'].includes(n.textAlign))throw Error('Invalid layer settings.');for(const k of ['visible','locked','clip','gradient','shadow'] as const)if(typeof n[k]!=='boolean')throw Error('Invalid layer flag.');});
  }
  if(!Array.isArray(d.colors)||d.colors.some((c:{name:string;value:string})=>typeof c.name!=='string'||!/^#[0-9a-f]{6}$/i.test(c.value)))throw Error('Invalid color styles.');
  if(d.fonts!==undefined){if(!Array.isArray(d.fonts)||d.fonts.length>500)throw Error('Invalid embedded fonts.');d.fonts.forEach(validateFontAsset);}
  validateGrids(d);validateMasks(d);validateRichTextDocument(d);validateWhiteboard(d);validateSlides(d);validatePrototype(d);validateGuides(d);validateComponents(d);validateDesignSystems(d);validateMotionStyles(d.motionStyles);d.version=2;return d as DesignDocument;
}
export const polygonPoints=(n:DesignNode)=>Array.from({length:n.type==='star'?10:6},(_,i)=>{const a=i*Math.PI*2/(n.type==='star'?10:6)-Math.PI/2,r=n.type==='star'&&i%2?0.43:1;return `${n.width/2+Math.cos(a)*n.width/2*r},${n.height/2+Math.sin(a)*n.height/2*r}`;}).join(' ');
