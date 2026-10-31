import {zipSync} from 'fflate';
import type {KiwiDefinition} from '../../src/fig-kiwi';
import {encodeMessage,encodeSchema,figCanvas} from './fig-fixture';
import {network} from './fig-synthetic';
/** A public synthetic schema written for these tests. Field names follow the scene mapper, not any user file. */
type Spec=Record<string,string>;
const primitive:Record<string,number>={bool:-1,byte:-2,int:-3,uint:-4,float:-5,string:-6};
function schema(enums:Record<string,string[]>,messages:Record<string,Spec>):KiwiDefinition[]{
 const names=[...Object.keys(enums),...Object.keys(messages)],type=(t:string)=>primitive[t]??names.indexOf(t);
 return [...Object.entries(enums).map(([name,values])=>({name,kind:0,fields:values.map((v,i)=>({name:v,type:0,value:i,array:false}))})),...Object.entries(messages).map(([name,spec])=>({name,kind:2,fields:Object.entries(spec).map(([field,t],i)=>({name:field,type:type(t.replace('[]','')),value:i+1,array:t.endsWith('[]')}))}))];
}
export const liveSchema=schema({
 NodeType:['DOCUMENT','CANVAS','FRAME','ROUNDED_RECTANGLE','TEXT','SYMBOL','INSTANCE','VECTOR','VARIABLE_SET','VARIABLE'],PaintType:['SOLID'],StackMode:['NONE','HORIZONTAL','VERTICAL'],StackSize:['FIXED','RESIZE_TO_FIT'],StackAlign:['MIN','CENTER','MAX'],StyleType:['NONE','FILL'],ResolvedType:['COLOR','FLOAT'],DataType:['COLOR','ALIAS'],Interaction:['ON_CLICK'],Connection:['INTERNAL_NODE'],Navigation:['NAVIGATE'],Transition:['DISSOLVE'],Winding:['NONZERO'],
},{
 GUID:{sessionID:'uint',localID:'uint'},Parent:{guid:'GUID',position:'string'},Vector:{x:'float',y:'float'},Matrix:{m00:'float',m01:'float',m02:'float',m10:'float',m11:'float',m12:'float'},Color:{r:'float',g:'float',b:'float',a:'float'},
 VariableValue:{colorValue:'Color',floatValue:'float',alias:'Reference'},Reference:{guid:'GUID'},VariableData:{dataType:'DataType',value:'VariableValue'},Paint:{type:'PaintType',color:'Color',opacity:'float',visible:'bool',colorVar:'VariableData'},
 Mode:{id:'GUID',name:'string',sortPosition:'string'},Entry:{modeID:'GUID',variableData:'VariableData'},Entries:{entries:'Entry[]'},ModeChoice:{variableSetID:'Reference',variableModeID:'GUID'},ModeMap:{entries:'ModeChoice[]'},
 Path:{guids:'GUID[]'},Override:{guidPath:'Path',fillPaints:'Paint[]'},SymbolData:{symbolID:'GUID',symbolOverrides:'Override[]'},
 Event:{interactionType:'Interaction'},Action:{connectionType:'Connection',navigationType:'Navigation',transitionNodeID:'GUID',transitionType:'Transition',transitionDuration:'float'},PrototypeInteraction:{event:'Event',actions:'Action[]'},
 Font:{family:'string',style:'string'},Text:{characters:'string'},Geometry:{windingRule:'Winding',commandsBlob:'uint'},VectorData:{vectorNetworkBlob:'uint',normalizedSize:'Vector'},
 NodeChange:{guid:'GUID',parentIndex:'Parent',type:'NodeType',name:'string',visible:'bool',size:'Vector',transform:'Matrix',fillPaints:'Paint[]',fontName:'Font',fontSize:'float',textData:'Text',symbolData:'SymbolData',stackMode:'StackMode',stackSpacing:'float',stackHorizontalPadding:'float',stackVerticalPadding:'float',stackPrimarySizing:'StackSize',stackCounterSizing:'StackSize',stackPrimaryAlignItems:'StackAlign',stackCounterAlignItems:'StackAlign',styleType:'StyleType',styleIdForFill:'Reference',variableSetModes:'Mode[]',variableSetID:'Reference',variableResolvedType:'ResolvedType',variableDataValues:'Entries',variableModeBySetMap:'ModeMap',prototypeInteractions:'PrototypeInteraction[]',fillGeometry:'Geometry[]',vectorData:'VectorData',internalOnly:'bool'},
 Blob:{bytes:'byte[]'},Message:{nodeChanges:'NodeChange[]',blobs:'Blob[]'},
});
const id=(n:number)=>({sessionID:7,localID:n}),at=(x:number,y:number)=>({m00:1,m01:0,m02:x,m10:0,m11:1,m12:y}),parent=(n:number,position:string)=>({guid:id(n),position}),solid=(r:number,g:number,b:number)=>({type:'SOLID',color:{r,g,b,a:1},opacity:1,visible:true});
const square=()=>{const b=new ArrayBuffer(4),out:number[]=[],f=(v:number)=>{new DataView(b).setFloat32(0,v,true);out.push(...new Uint8Array(b));},c=(op:number,...v:number[])=>{out.push(op);v.forEach(f);};c(1,0,0);c(2,40,0);c(2,40,40);c(2,0,40);c(0);return Uint8Array.from(out);};
export function liveMessage(){const bound=(n:number)=>({dataType:'ALIAS',value:{alias:{guid:id(n)}}});return {blobs:[{bytes:[...square()]},{bytes:[...network([[0,0],[20,0],[20,20],[0,20]],[[0,0,0,1,0,0],[1,0,0,2,0,0],[2,0,0,3,0,0],[3,0,0,0,0,0]],[[[0,1,2,3]]])]}],nodeChanges:[
 {guid:id(1),type:'DOCUMENT',name:'Synthetic live document'},
 {guid:id(2),parentIndex:parent(1,'a'),type:'CANVAS',name:'Screens'},
 {guid:id(3),parentIndex:parent(1,'b'),type:'CANVAS',name:'Internal',internalOnly:true},
 {guid:id(4),parentIndex:parent(3,'a'),type:'VARIABLE_SET',name:'Theme',variableSetModes:[{id:id(5),name:'Light',sortPosition:'a'},{id:id(6),name:'Dark',sortPosition:'b'}]},
 {guid:id(7),parentIndex:parent(3,'b'),type:'VARIABLE',name:'Surface',variableSetID:{guid:id(4)},variableResolvedType:'COLOR',variableDataValues:{entries:[{modeID:id(5),variableData:{dataType:'COLOR',value:{colorValue:{r:1,g:1,b:1,a:1}}}},{modeID:id(6),variableData:{dataType:'COLOR',value:{colorValue:{r:0,g:0,b:0,a:1}}}}]}},
 {guid:id(8),parentIndex:parent(3,'c'),type:'ROUNDED_RECTANGLE',name:'Brand',styleType:'FILL',fillPaints:[solid(0,0,1)]},
 {guid:id(10),parentIndex:parent(2,'a'),type:'SYMBOL',name:'Card',size:{x:120,y:60},transform:at(600,0),fillPaints:[solid(.9,.9,.9)]},
 {guid:id(11),parentIndex:parent(10,'a'),type:'ROUNDED_RECTANGLE',name:'Swatch',size:{x:40,y:40},transform:at(10,10),fillPaints:[solid(1,0,0)]},
 {guid:id(20),parentIndex:parent(2,'b'),type:'FRAME',name:'Row',size:{x:280,y:80},transform:at(20,20),stackMode:'HORIZONTAL',stackSpacing:20,stackHorizontalPadding:10,stackVerticalPadding:10,stackPrimarySizing:'RESIZE_TO_FIT',stackCounterSizing:'FIXED',fillPaints:[]},
 {guid:id(21),parentIndex:parent(20,'a'),type:'INSTANCE',name:'First',size:{x:120,y:60},transform:at(10,10),symbolData:{symbolID:id(10)}},
 {guid:id(22),parentIndex:parent(20,'b'),type:'INSTANCE',name:'Second',size:{x:120,y:60},transform:at(150,10),symbolData:{symbolID:id(10),symbolOverrides:[{guidPath:{guids:[id(11)]},fillPaints:[solid(0,1,0)]}]}},
 {guid:id(30),parentIndex:parent(2,'c'),type:'FRAME',name:'Dark panel',size:{x:80,y:80},transform:at(20,200),variableModeBySetMap:{entries:[{variableSetID:{guid:id(4)},variableModeID:id(6)}]},prototypeInteractions:[{event:{interactionType:'ON_CLICK'},actions:[{connectionType:'INTERNAL_NODE',navigationType:'NAVIGATE',transitionNodeID:id(20),transitionType:'DISSOLVE',transitionDuration:.25}]}]},
 {guid:id(31),parentIndex:parent(30,'a'),type:'ROUNDED_RECTANGLE',name:'Themed',size:{x:40,y:40},fillPaints:[{...solid(.5,.5,.5),colorVar:bound(7)}]},
 {guid:id(32),parentIndex:parent(2,'d'),type:'ROUNDED_RECTANGLE',name:'Styled',size:{x:40,y:40},transform:at(200,200),styleIdForFill:{guid:id(8)},fillPaints:[solid(0,0,1)]},
 {guid:id(33),parentIndex:parent(2,'e'),type:'VECTOR',name:'Pen shape',size:{x:40,y:40},transform:at(300,200),fillPaints:[solid(1,0,1)],fillGeometry:[{windingRule:'NONZERO',commandsBlob:0}],vectorData:{vectorNetworkBlob:1,normalizedSize:{x:20,y:20}}},
]};}
export const liveFig=()=>zipSync({'canvas.fig':[figCanvas({schema:encodeSchema(liveSchema),message:encodeMessage(liveMessage(),liveSchema),zstd:true}),{level:0}]});
