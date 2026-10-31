import {blankDocument,node} from '../../src/model';
import {createStroke} from '../../src/paints';
import {calligraphicCandidate} from '../../src/calligraphic-stroke-actions';
import {textPathCandidate} from '../../src/text-path-actions';

export function autoLayoutFixture(kind:'ordinary'|'nib'|'text-path',nested=false){
 const d=blankDocument();d.fonts=[];
 const special=kind==='text-path'
  ?textPathCandidate(node('path',{id:'special',name:'Curved text',x:100,y:100,width:200,height:100,pathWidth:200,pathHeight:100,text:'Forma',fill:'#ff0000',stroke:'',strokes:[],contours:[{closed:false,points:[{x:0,y:80,out:{x:50,y:-70}},{x:200,y:80,in:{x:-50,y:-70}}]}]}))
  :kind==='nib'
   ?calligraphicCandidate(node('path',{id:'special',name:'Nib path',x:100,y:100,width:200,height:100,pathWidth:200,pathHeight:100,fill:'none',strokes:[{...createStroke('#ff0000'),width:20}],contours:[{closed:false,points:[{x:10,y:10},{x:190,y:10},{x:190,y:90}]}]}),{angle:45,roundness:.2})
   :node('rectangle',{id:'special',name:'First box',x:100,y:100,width:200,height:100});
 const other=node('rectangle',{id:'other',name:'Second box',x:500,y:150,width:80,height:60});
 if(nested){special.parentId='container';d.pages[0].nodes=[node('group',{id:'container',name:'Existing group',x:80,y:80,width:250,height:150}),special,other];}
 else d.pages[0].nodes=[special,other];
 return d;
}
