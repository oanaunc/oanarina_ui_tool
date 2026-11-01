// A design page shaped like a real product file: screens of cards with text, icons, shadows and clipping, plus a spec that embeds three of them.
import fs from 'node:fs';
import {blankDocument,node} from '../../src/model';
import {createEffect} from '../../src/effects';
import {createPaint} from '../../src/paints';
const [out,screensArg]=process.argv.slice(2),screens=Number(screensArg??60),doc=blankDocument(),nodes:ReturnType<typeof node>[]=[];
const solid=(fill:string)=>({fill,paints:[createPaint(fill)]});
for(let s=0;s<screens;s++){
 const frame=`screen-${s}`,fx=(s%10)*435,fy=Math.floor(s/10)*872;
 nodes.push(node('frame',{id:frame,name:`Screen ${s}`,x:fx,y:fy,width:375,height:812,clip:true,...solid('#ffffff')}));
 const add=(type:Parameters<typeof node>[0],id:string,o:Parameters<typeof node>[1])=>nodes.push(node(type,{id:`${frame}-${id}`,parentId:frame,...o}));
 add('text','title',{name:'Title',x:fx+24,y:fy+56,width:327,height:34,text:`Screen ${s}`,fontFamily:'Inter',fontSize:28,fontWeight:700,textResize:'auto-height',...solid('#1e1e1e')});
 for(let r=0;r<14;r++){
  const y=fy+110+r*48,row=`row-${r}`;
  add('rectangle',row,{name:'Card',x:fx+16,y,width:343,height:44,radius:10,effects:[{...createEffect('drop-shadow'),id:`${frame}-${r}-e`,y:2,radius:8}],...solid('#f7f7f8')} as never);
  add('ellipse',`${row}-a`,{name:'Avatar',x:fx+24,y:y+8,width:28,height:28,...solid('#6ca0ff')});
  add('text',`${row}-t`,{name:'Name',x:fx+60,y:y+6,width:220,height:16,text:'A list item with a long enough name',fontFamily:'Inter',fontSize:13,fontWeight:600,textResize:'auto-height',...solid('#1e1e1e')});
  add('text',`${row}-s`,{name:'Detail',x:fx+60,y:y+23,width:220,height:14,text:'Secondary text that wraps nowhere',fontFamily:'Inter',fontSize:11,textResize:'auto-height',...solid('#707070')});
  add('text',`${row}-p`,{name:'Price',x:fx+300,y:y+14,width:48,height:16,text:'$12.00',fontFamily:'Inter',fontSize:12,textAlign:'right',...solid('#1e1e1e')});
  add('rectangle',`${row}-i`,{name:'Icon',x:fx+284,y:y+14,width:12,height:12,radius:3,...solid('#c4c4c4')});
 }
}
const blocks=[{id:'h',kind:'heading',level:1,text:'Button specification'}] as object[];
for(let i=0;i<20;i++)blocks.push({id:`p${i}`,kind:'paragraph',text:'This paragraph explains a decision in plain words, long enough to wrap across more than one line of the page, with **bold** and `code` marks in it.'},{id:`b${i}`,kind:'bullet',text:`Point number ${i}`});
for(let i=0;i<3;i++)blocks.push({id:`f${i}`,kind:'frame',nodeId:`screen-${i}`,name:`Screen ${i}`});
nodes.push(node('spec',{id:'spec-1',name:'Spec',x:-1000,y:0,width:850,height:1100,fill:'#ffffff',spec:{version:1,blocks}} as never));
doc.pages[0].nodes=nodes;doc.name='Open benchmark';
fs.writeFileSync(out,JSON.stringify(doc));console.log(nodes.length,'layers',Math.round(fs.statSync(out).size/1024),'KB');
