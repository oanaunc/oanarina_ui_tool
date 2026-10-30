import type {DesignNode,NodeKind,Tool} from './model';
export const shapeTools=['rectangle','ellipse','line','arrow','polygon','star'] as const;
export type ShapeTool=typeof shapeTools[number];
export const isShapeTool=(tool:unknown):tool is ShapeTool=>shapeTools.includes(tool as ShapeTool);
export const LAST_SHAPE_TOOL_KEY='oui-last-shape-tool';
type ToolStorage=Pick<Storage,'getItem'|'setItem'>;
export function restoredShapeTool(storage?:ToolStorage):ShapeTool{try{const saved=(storage??(typeof window==='undefined'?undefined:window.localStorage))?.getItem(LAST_SHAPE_TOOL_KEY);return isShapeTool(saved)?saved:'rectangle';}catch{return 'rectangle';}}
/** Optional local UI memory; unavailable storage must never prevent using a drawing tool. */
export function rememberShapeTool(tool:ShapeTool,storage?:ToolStorage){try{(storage??(typeof window==='undefined'?undefined:window.localStorage))?.setItem(LAST_SHAPE_TOOL_KEY,tool);}catch{/* A tool can still be repeated during this session. */}}
export const supportsCenterDrawing=(type:NodeKind)=>isShapeTool(type)||['frame','section','slice'].includes(type);
interface Point{x:number;y:number;}
/** Coordinates are already expressed in the destination parent's stored coordinate system. */
export function shapeDragGeometry(type:NodeKind,start:Point,end:Point,options:{center?:boolean;aspect?:boolean}={}):Pick<DesignNode,'x'|'y'|'width'|'height'>&Partial<Pick<DesignNode,'points'|'pathWidth'|'pathHeight'>>{
 if([start.x,start.y,end.x,end.y].some(v=>!Number.isFinite(v)||Math.abs(v)>1e6))throw Error('Drawing coordinates exceed the document limit.');
 const line=type==='line'||type==='arrow',center=!!options.center&&supportsCenterDrawing(type);let dx=end.x-start.x,dy=end.y-start.y;
 if(options.aspect){const size=Math.max(Math.abs(dx),Math.abs(dy));dx=(Math.sign(dx)||Number(!line))*size;dy=(Math.sign(dy)||Number(!line))*size;}
 const a=center?{x:start.x-dx,y:start.y-dy}:start,b={x:start.x+dx,y:start.y+dy},x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),width=Math.abs(b.x-a.x),height=Math.abs(b.y-a.y);
 if(width>1e6||height>1e6||Math.abs(x)>1e6||Math.abs(y)>1e6)throw Error('The drawn shape exceeds the document limit.');
 return {x,y,width,height,...(line?{pathWidth:width||1,pathHeight:height||1,points:[{x:a.x-x,y:a.y-y},{x:width?b.x-x:1,y:height?b.y-y:1}]}:{})};
}
export function defaultShapeClick(type:NodeKind,start:Point,center=false){const width=type==='frame'?390:160,height=type==='frame'?844:type==='text'?40:100;const centered=center&&supportsCenterDrawing(type);return {...shapeDragGeometry(type,start,{x:start.x+width/(centered?2:1),y:start.y+height/(centered?2:1)},{center:centered}),...(['line','arrow'].includes(type)?{points:[],pathWidth:undefined,pathHeight:undefined}:{})};}
export function repeatShapeState(tool:ShapeTool):{tool:Tool;vectorEditId:null;vectorSelection:string[]}{return {tool,vectorEditId:null,vectorSelection:[]};}
