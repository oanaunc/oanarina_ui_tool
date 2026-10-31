import type {DesignNode,NodeKind} from './model';
import {defaultShapeClick} from './shape-drawing';
export const keyboardLayerTypes=['frame','section','slice','rectangle','ellipse','line','arrow','polygon','star','text'] as const;
export type KeyboardLayerType=typeof keyboardLayerTypes[number];
export interface KeyboardLayerInput {name:string;x:string;y:string;width:string;height:string;text:string;}
/** Existing root-level creation model; no instance children or arbitrary parent IDs are accepted. */
export function keyboardLayerProps(type:NodeKind,input:KeyboardLayerInput):Partial<DesignNode>{if(!(keyboardLayerTypes as readonly string[]).includes(type))throw Error('Choose a supported basic layer type.');const linear=type==='line'||type==='arrow',values={} as Record<'x'|'y'|'width'|'height',number>;for(const key of ['x','y','width','height'] as const){const raw=input[key],value=Number(raw);if(!raw.trim()||!Number.isFinite(value)||Math.abs(value)>1e6||(['width','height'].includes(key)&&(linear?value<0:value<=0)))throw Error('Enter finite positions and positive dimensions within 1,000,000.');values[key]=value;}if(linear&&values.width===0&&values.height===0)throw Error('A line or arrow needs at least one positive dimension.');if(!input.name.trim()||input.name.length>512)throw Error('Enter a layer name up to 512 characters.');if(input.text.length>100000)throw Error('Text exceeds the keyboard insertion limit of 100,000 characters.');return {...defaultShapeClick(type,{x:values.x,y:values.y}),...values,name:input.name.trim(),parentId:null,...(type==='text'?{text:input.text}:{})};}
/** The keyboard route to what the Pen draws: straight segments through typed points, such as 0,0 120,0 60,90. Curves stay a job for the vector editor's numeric fields. */
export const KEYBOARD_PATH_LIMIT=2000;
export function keyboardPathProps(name:string,pointsText:string,closed:boolean):Partial<DesignNode>{
 if(!name.trim()||name.length>512)throw Error('Enter a layer name up to 512 characters.');
 if(pointsText.length>40000)throw Error('Enter at most 2,000 points.');
 const pairs=pointsText.trim().split(/\s+/).filter(Boolean),points=pairs.map(pair=>{const parts=pair.split(',');if(parts.length!==2||parts.some(p=>!p.trim()))throw Error('Write each point as x,y with a space between points.');const [x,y]=parts.map(Number);if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1e6||Math.abs(y)>1e6)throw Error('Enter finite positions and positive dimensions within 1,000,000.');return {x,y};});
 if(points.length<2||points.length>KEYBOARD_PATH_LIMIT)throw Error('A path needs between 2 and 2,000 points.');
 const left=Math.min(...points.map(p=>p.x)),top=Math.min(...points.map(p=>p.y)),width=Math.max(...points.map(p=>p.x))-left,height=Math.max(...points.map(p=>p.y))-top;
 if(!width&&!height)throw Error('A path needs points in at least two places.');
 const path=points.map((p,i)=>(i?'L':'M')+(p.x-left)+' '+(p.y-top)).join(' ')+(closed?' Z':'');
 return {name:name.trim(),parentId:null,x:left,y:top,width:Math.max(width,.001),height:Math.max(height,.001),pathWidth:Math.max(width,.001),pathHeight:Math.max(height,.001),path,points:[],...(closed?{}:{fill:'none'})};
}
