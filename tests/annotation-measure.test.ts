import {expect,it} from 'vitest';
import {blankDocument,node,parseDocument} from '../src/model';
import {annotationMatrices,annotationValue,validateAnnotationSet} from '../src/layer-annotations';
import type {LayerAnnotation,LayerAnnotationSet} from '../src/layer-annotations';
import {adoptFileAnnotationCategory,categoryKey,deleteFileAnnotationCategory,fileAnnotationCategories,renameFileAnnotationCategory} from '../src/annotation-categories';
import {annotationSegment,canvasBoxPoint,normalizedMeasure,textAnnotationValue,validateAnnotationMeasure} from '../src/annotation-measure';
import {point} from '../src/transforms';
function page(){const d=blankDocument();d.pages[0].nodes=[node('frame',{id:'parent',name:'Parent',x:20,y:30,width:300,height:300,rotation:90}),node('rectangle',{id:'a',name:'A',parentId:'parent',x:40,y:50,width:100,height:50}),node('rectangle',{id:'b',name:'B',x:500,y:0,width:100,height:100}),node('rectangle',{id:'c',name:'C',x:640,y:220,width:40,height:40})];return d;}
const plain=()=>{const d=blankDocument();d.pages[0].nodes=[node('rectangle',{id:'a',name:'A',x:0,y:0,width:100,height:50}),node('rectangle',{id:'b',name:'B',x:150,y:80,width:100,height:50})];return d;};
const read=(d:ReturnType<typeof page>,id:string,a:LayerAnnotation)=>{const p=d.pages[0];return annotationValue(p.nodes.find(n=>n.id===id)!,a,p,annotationMatrices(p.nodes));};
const item=(extra:Partial<LayerAnnotation>):LayerAnnotation=>({id:'i',kind:'measurement',text:'',...extra});
it('measures arbitrary box points through rotation and along either page axis',()=>{
 const d=page(),base=item({measurement:'points',fromPoint:{u:0,v:0},toPoint:{u:1,v:0}});expect(read(d,'a',base).value).toBe('Direct point to point: 100 px');
 expect(read(d,'a',{...base,axis:'vertical'}).value).toBe('Vertical point to point: 100 px');expect(read(d,'a',{...base,axis:'horizontal'}).value).toBe('Horizontal point to point: 0 px');
 expect(read(d,'a',item({measurement:'points',fromPoint:{u:0,v:0},toPoint:{u:.5,v:1}})).value).toBe('Direct point to point: 70.71 px');
});
it('stays independent of huge translation for same-layer measurements',()=>{const d=blankDocument();d.pages[0].nodes=[node('rectangle',{id:'a',x:1e20,y:1e20,width:100,height:50})];expect(read(d,'a',item({measurement:'points',fromPoint:{u:0,v:0},toPoint:{u:1,v:1}})).value).toBe('Direct point to point: 111.8 px');});
it('reports painted bounds including outside strokes, and refuses hidden owners',()=>{
 const d=plain(),a=d.pages[0].nodes[0];a.strokes=[{id:'s',paint:{id:'p',type:'solid',visible:true,opacity:1,color:'#000000',angle:0,cx:.5,cy:.5,radius:.5,stops:[]},visible:true,width:10,align:'outside',cap:'butt',join:'miter',miterLimit:4,dash:[],dashOffset:0}];
 expect(read(d,'a',item({measurement:'ink-width'})).value).toBe('Painted width: 120 px');expect(read(d,'a',item({measurement:'ink-height'})).value).toBe('Painted height: 70 px');expect(read(d,'a',item({measurement:'width'})).value).toBe('Authored box width: 100 px');
 a.visible=false;expect(read(d,'a',item({measurement:'ink-width'}))).toEqual({value:'Hidden layers have no painted bounds',available:false});
});
it('reports edge gaps and overlaps between transformed boxes, and live chosen points',()=>{
 const d=plain(),gap=item({kind:'distance',targetId:'b',gap:true});expect(read(d,'a',gap).value).toBe('Edge horizontal gap 50 px · vertical gap 30 px');
 d.pages[0].nodes[1].y=20;expect(read(d,'a',gap).value).toBe('Edge horizontal gap 50 px · vertical overlap 30 px');
 d.pages[0].nodes[1].y=80;const points=item({kind:'distance',targetId:'b',fromPoint:{u:1,v:.5},toPoint:{u:0,v:.5}});expect(read(d,'a',points).value).toBe('Direct point to point: 94.34 px');expect(read(d,'a',{...points,axis:'horizontal'}).value).toBe('Horizontal point to point: 50 px');expect(read(d,'a',{...points,axis:'vertical'}).value).toBe('Vertical point to point: 80 px');
 d.pages[0].nodes[1].x=350;expect(read(d,'a',points).value).toBe('Direct point to point: 262.49 px');
 expect(read(d,'a',{...points,targetId:'gone'})).toEqual({value:'Distance target unavailable · choose a target again',available:false});expect(read(d,'a',{...gap,targetId:null})).toMatchObject({available:false});
});
it('keeps the legacy center reading and label for existing distances',()=>{expect(read(plain(),'a',item({kind:'distance',targetId:'b'})).value).toBe('Center-to-center: 170 px');});
it('draws segments in world space for box edges, constrained axes and gaps',()=>{
 const d=plain(),p=d.pages[0],m=annotationMatrices(p.nodes),a=p.nodes[0];expect(annotationSegment(a,item({measurement:'height'}),p,m)).toEqual({x1:100,y1:0,x2:100,y2:50});expect(annotationSegment(a,item({measurement:'diagonal'}),p,m)).toEqual({x1:0,y1:0,x2:100,y2:50});
 expect(annotationSegment(a,item({kind:'distance',targetId:'b',gap:true}),p,m)).toEqual({x1:100,y1:65,x2:150,y2:65});expect(annotationSegment(a,item({kind:'distance',targetId:'b',axis:'horizontal'}),p,m)).toEqual({x1:50,y1:25,x2:200,y2:25});
 p.nodes[1].x=50;p.nodes[1].y=10;expect(annotationSegment(a,item({kind:'distance',targetId:'b',gap:true}),p,annotationMatrices(p.nodes))).toBeUndefined();expect(annotationSegment(a,item({kind:'distance',targetId:'gone'}),p,m)).toBeUndefined();
});
it('reads paint, type, layout, blend and prototype references live and marks mismatched types',()=>{
 const d=page(),a=d.pages[0].nodes[1];a.fill='#112233';expect(textAnnotationValue(a,'fill',d.pages[0].nodes)).toEqual({value:'fill: #112233',available:true});expect(textAnnotationValue(a,'stroke',d.pages[0].nodes)?.value).toBe('stroke: none');
 expect(textAnnotationValue(a,'fontFamily',d.pages[0].nodes)).toEqual({value:'Property unavailable',available:false});const text=node('text',{fontFamily:'Inter',fontWeight:700,textAlign:'center',letterSpacing:2});expect(textAnnotationValue(text,'fontFamily',[])?.value).toBe('font: Inter');expect(textAnnotationValue(text,'fontWeight',[])?.value).toBe('weight: 700');expect(textAnnotationValue(text,'textAlign',[])?.value).toBe('text align: center');expect(textAnnotationValue(text,'letterSpacing',[])?.value).toBe('letter spacing: 2 px');
 expect(textAnnotationValue(a,'gap',[])).toEqual({value:'Layout unavailable',available:false});a.layout='vertical';a.gap=12;expect(textAnnotationValue(a,'gap',[])?.value).toBe('gap: 12 px');expect(textAnnotationValue(a,'layout',[])?.value).toBe('layout: vertical');expect(textAnnotationValue(a,'blendMode',[])?.value).toBe('blend mode: normal');a.corners=[1,2,3,4];expect(textAnnotationValue(a,'cornerRadius',[])?.value).toBe('corner radius: 1 / 2 / 3 / 4 px');
 expect(textAnnotationValue(a,'prototypeTarget',d.pages[0].nodes)?.value).toBe('prototype: none');a.reactions=[{id:'r',trigger:'click',enabled:true,delay:0,key:'',modifiers:[],gamepadButton:0,actions:[{id:'x',type:'navigate',targetId:'b'}]}] as never;expect(textAnnotationValue(a,'prototypeTarget',d.pages[0].nodes)?.value).toBe('prototype: 1 interaction to B');
 expect(textAnnotationValue(a,'x',[])).toBeUndefined();
});
it('refuses malformed points, axes and field combinations before they reach a document',()=>{
 const set=(a:object)=>({categories:[],items:[{id:'i',kind:'measurement',text:'',...a}]});
 for(const bad of [{measurement:'points'},{measurement:'points',fromPoint:{u:0,v:0}},{measurement:'points',fromPoint:{u:2,v:0},toPoint:{u:0,v:0}},{measurement:'points',fromPoint:{u:0,v:0,w:1},toPoint:{u:0,v:0}},{measurement:'points',fromPoint:{u:Number.NaN,v:0},toPoint:{u:0,v:0}},{measurement:'width',axis:'horizontal'},{measurement:'width',fromPoint:{u:0,v:0}},{measurement:'width',at:{u:0,v:0}},{measurement:'points',fromPoint:{u:0,v:0},toPoint:{u:1,v:1},axis:'sideways'},{measurement:'ruler'},{kind:'distance',measurement:undefined,targetId:'b',fromPoint:{u:0,v:0}},{kind:'distance',measurement:undefined,targetId:'b',gap:true,axis:'vertical'},{kind:'distance',measurement:undefined,targetId:'b',gap:'yes'},{kind:'note',text:'x',measurement:undefined,axis:'vertical'},{kind:'note',text:'x',measurement:undefined,gap:true},{kind:'note',text:'x',at:{u:-1,v:0}}])expect(()=>validateAnnotationSet(set(bad)),JSON.stringify(bad)).toThrow();
 const ok={kind:'note',text:'x',at:{u:.25,v:.75}};expect(()=>validateAnnotationSet(set(ok))).not.toThrow();const d=plain();d.pages[0].nodes[0].annotations=set(ok) as never;expect(parseDocument(JSON.stringify(d)).pages[0].nodes[0].annotations?.items[0].at).toEqual({u:.25,v:.75});
 d.pages[0].nodes[0].annotations=set({measurement:'points'}) as never;expect(()=>parseDocument(JSON.stringify(d))).toThrow();
});
it('keeps a draft consistent while the measurement choice changes',()=>{
 const points=normalizedMeasure(item({measurement:'points'}));expect(points).toMatchObject({fromPoint:{u:0,v:0},toPoint:{u:1,v:1}});expect(()=>validateAnnotationMeasure(points)).not.toThrow();
 const width=normalizedMeasure({...points,measurement:'width',axis:'vertical'});expect(width).not.toHaveProperty('fromPoint');expect(width).not.toHaveProperty('axis');expect(()=>validateAnnotationMeasure(width)).not.toThrow();
});
it('turns canvas points into box points through transforms, clamping and snapping',()=>{
 const n=node('rectangle',{id:'a',x:100,y:100,width:100,height:50,rotation:90}),m=annotationMatrices([n]).get('a')!,world=point(m,25,10);expect(canvasBoxPoint(n,m,world,0)).toEqual({u:.25,v:.2});expect(canvasBoxPoint(n,m,point(m,99,1),8)).toEqual({u:1,v:0});expect(canvasBoxPoint(n,m,point(m,50,26),8)).toEqual({u:.5,v:.5});expect(canvasBoxPoint(n,m,point(m,-400,900),0)).toEqual({u:0,v:1});
 const line=node('line',{id:'l',x:0,y:0,width:100,height:0});expect(canvasBoxPoint(line,annotationMatrices([line]).get('l')!,{x:40,y:0},0)).toEqual({u:.4,v:0});
});
function categorized(){const d=plain(),[a,b]=d.pages[0].nodes,c=node('rectangle',{id:'c',name:'C',locked:true});d.pages[0].nodes.push(c);const set=(id:string)=>({categories:[{id,name:'Spec',color:'#aa11ff'}],items:[{id:'n'+id,kind:'note' as const,text:'x',categoryId:id}]});a.annotations=set('1');b.annotations=set('2');c.annotations=set('3');return d;}
it('aggregates matching per-layer categories and counts read-only uses',()=>{expect(fileAnnotationCategories(categorized())).toEqual([{key:categoryKey({name:'Spec',color:'#aa11ff'}),name:'Spec',color:'#aa11ff',layers:3,notes:3,readOnly:1}]);});
it('renames across the file with one report, skips locked sets and merges onto an existing name',()=>{const d=categorized(),key=categoryKey({name:'Spec',color:'#aa11ff'});expect(renameFileAnnotationCategory(d,key,{name:' Handoff ',color:'#00aa00'})).toEqual({changed:2,skipped:1});expect(d.pages[0].nodes[0].annotations!.categories[0]).toMatchObject({id:'1',name:'Handoff',color:'#00aa00'});expect(d.pages[0].nodes[2].annotations!.categories[0].name).toBe('Spec');
 d.pages[0].nodes[0].annotations!.categories.push({id:'other',name:'Keep',color:'#111111'});d.pages[0].nodes[0].annotations!.items.push({id:'k',kind:'note',text:'y',categoryId:'other'});renameFileAnnotationCategory(d,categoryKey({name:'Keep',color:'#111111'}),{name:'Handoff',color:'#00AA00'});const merged=d.pages[0].nodes[0].annotations!;expect(merged.categories).toHaveLength(1);expect(merged.items.map(i=>i.categoryId)).toEqual(['1','1']);});
it('deletes across the file keeping notes, and refuses when nothing is writable or the input is bad',()=>{const d=categorized(),key=categoryKey({name:'Spec',color:'#aa11ff'});expect(()=>renameFileAnnotationCategory(d,key,{name:'  ',color:'#000000'})).toThrow('1–80');expect(()=>renameFileAnnotationCategory(d,key,{name:'x',color:'red'})).toThrow('color');expect(deleteFileAnnotationCategory(d,key)).toEqual({changed:2,skipped:1});expect(d.pages[0].nodes[0].annotations).toEqual({categories:[],items:[{id:'n1',kind:'note',text:'x'}]});expect(()=>deleteFileAnnotationCategory(d,key)).toThrow('locked or inherited');expect(()=>deleteFileAnnotationCategory(d,'missing')).toThrow('no longer used');});
it('adopts a file category once per layer and honors the layer budget',()=>{const set:LayerAnnotationSet={categories:[],items:[]};expect(adoptFileAnnotationCategory(set,{name:'Spec',color:'#AA11FF'},'x')).toBe('x');expect(adoptFileAnnotationCategory(set,{name:'Spec',color:'#aa11ff'},'y')).toBe('x');expect(set.categories).toHaveLength(1);set.categories=Array.from({length:32},(_,i)=>({id:'c'+i,name:'c'+i,color:'#000000'}));expect(()=>adoptFileAnnotationCategory(set,{name:'New',color:'#000000'})).toThrow('32');});
