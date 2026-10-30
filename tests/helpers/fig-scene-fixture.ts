import { zipSync } from 'fflate';
import type { KiwiDefinition } from '../../src/fig-kiwi';
import { encodeSchema, encodeMessage, figCanvas } from './fig-fixture';

const field=(name:string,type:number,value:number,array=false)=>({name,type,value,array});
/** A tiny public synthetic schema, not copied from a user file. */
export const sceneSchema:KiwiDefinition[]=[
 {name:'NodeType',kind:0,fields:['DOCUMENT','CANVAS','ROUNDED_RECTANGLE','TEXT'].map((name,i)=>field(name,0,i))},
 {name:'GUID',kind:1,fields:[field('sessionID',-4,1),field('localID',-4,2)]},
 {name:'ParentIndex',kind:1,fields:[field('guid',1,1),field('position',-6,2)]},
 {name:'Vector',kind:1,fields:[field('x',-5,1),field('y',-5,2)]},
 {name:'Matrix',kind:1,fields:['m00','m01','m02','m10','m11','m12'].map((name,i)=>field(name,-5,i+1))},
 {name:'Color',kind:1,fields:['r','g','b','a'].map((name,i)=>field(name,-5,i+1))},
 {name:'PaintType',kind:0,fields:[field('SOLID',0,0)]},
 {name:'Paint',kind:2,fields:[field('type',6,1),field('color',5,2)]},
 {name:'FontName',kind:1,fields:[field('family',-6,1),field('style',-6,2),field('postscript',-6,3)]},
 {name:'TextData',kind:2,fields:[field('characters',-6,1)]},
 {name:'NodeChange',kind:2,fields:[field('guid',1,1),field('parentIndex',2,2),field('type',0,3),field('name',-6,4),field('visible',-1,5),field('size',3,6),field('transform',4,7),field('fillPaints',7,8,true),field('fontName',8,9),field('fontSize',-5,10),field('textData',9,11)]},
 {name:'Message',kind:2,fields:[field('nodeChanges',10,1,true)]},
];
const guid=(id:number)=>({sessionID:42,localID:id});
const transform=(x:number,y:number)=>({m00:1,m01:0,m02:x,m10:0,m11:1,m12:y});
export function sceneMessage(label='Editable imported rectangle'){
 return{nodeChanges:[
  {guid:guid(1),type:'DOCUMENT',name:'Synthetic document'},
  {guid:guid(2),parentIndex:{guid:guid(1),position:'a'},type:'CANVAS',name:'Imported page'},
  {guid:guid(3),parentIndex:{guid:guid(2),position:'a'},type:'ROUNDED_RECTANGLE',name:label,visible:true,size:{x:300,y:180},transform:transform(40,60),fillPaints:[{type:'SOLID',color:{r:0.2,g:0.4,b:0.8,a:1}}]},
  {guid:guid(4),parentIndex:{guid:guid(2),position:'b'},type:'TEXT',name:'Editable imported text',visible:true,size:{x:200,y:32},transform:transform(70,95),fillPaints:[{type:'SOLID',color:{r:1,g:1,b:1,a:1}}],fontName:{family:'Inter',style:'Regular',postscript:'Inter-Regular'},fontSize:18,textData:{characters:'A synthetic local design'}},
 ]};
}
export function syntheticSceneFig(label?:string):Uint8Array{
 return sceneFigFromMessage(sceneMessage(label));
}
export function sceneFigFromMessage(message:Record<string,unknown>):Uint8Array{return zipSync({'canvas.fig':[figCanvas({schema:encodeSchema(sceneSchema),message:encodeMessage(message,sceneSchema),zstd:true}),{level:0}]});}
