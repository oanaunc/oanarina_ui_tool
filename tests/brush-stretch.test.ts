import {beforeEach,describe,expect,it} from 'vitest';
import {blankDocument,node,parseDocument} from '../src/model';
import type {DesignNode} from '../src/model';
import {builtInBrushes,parseBrushLibrary,serializeBrushLibrary,validateBrushPreset} from '../src/brush-presets';
import type {BrushPreset} from '../src/brush-presets';
import {materializeBrush} from '../src/brush-geometry';
import {sampleVectorBrush} from '../src/brush-sampling';
import {useBrushLibrary} from '../src/brush-library';
import {geometry,pathContours} from '../src/geometry';
import {transformVectorPoints} from '../src/vector-operations';

const bar={version:1 as const,fillRule:'nonzero' as const,contours:[{closed:true,points:[{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:0,y:100}]}]};
const ring={version:1 as const,fillRule:'evenodd' as const,contours:[...bar.contours,{closed:true,points:[{x:40,y:30},{x:60,y:30},{x:60,y:70},{x:40,y:70}]}]};
const preset=(patch:Partial<BrushPreset>={}):BrushPreset=>({...builtInBrushes[0],id:'stretch-test',name:'Band',shape:'vector',vectorStamp:bar,size:20,aspect:1,pressureSize:false,color:'#336699',opacity:.5,stretch:{version:1},...patch});
const straight=[{x:50,y:100,pressure:1},{x:150,y:100,pressure:1},{x:250,y:100,pressure:1}];
const arc=(radius=200,count=40)=>Array.from({length:count},(_,i)=>{const a=Math.PI*i/(count-1);return {x:300-radius*Math.cos(a),y:300-radius*Math.sin(a),pressure:1};});
const inside=(n:DesignNode,x:number,y:number)=>{const p=geometry(n);try{return p.contains({x,y} as never);}finally{p.remove();}};
const anchors=(n:DesignNode)=>n.contours!.flatMap(c=>c.points.map(p=>({x:p.x+n.x,y:p.y+n.y})));

describe('stretch brushes',()=>{
 beforeEach(()=>useBrushLibrary.setState({customs:[],settings:structuredClone(builtInBrushes[0])}));
 it('stretches one silhouette across the whole stroke as a single ordinary path',()=>{
  const nodes=materializeBrush(straight,preset(),'g'),[group,child]=nodes;expect(nodes).toHaveLength(2);expect(group).toMatchObject({type:'group',id:'g'});expect(child).toMatchObject({type:'path',parentId:'g',fill:'#336699',opacity:.5,fillRule:'nonzero'});
  for(const [key,value] of [['x',50],['y',90],['width',200],['height',20]] as const){expect(child[key]).toBeCloseTo(value,3);expect(group[key]).toBeCloseTo(value,3);}
  expect(inside(child,60,100)).toBe(true);expect(inside(child,240,100)).toBe(true);expect(inside(child,150,85)).toBe(false);expect(inside(child,45,100)).toBe(false);
 });
 it('follows a curved stroke: the band stays on the spine and turns with it',()=>{
  const child=materializeBrush(arc(),preset(),'g')[1],points=anchors(child);expect(points.length).toBeGreaterThan(40);for(const p of points){const r=Math.hypot(p.x-300,p.y-300);expect(r).toBeGreaterThan(189);expect(r).toBeLessThan(211);}
  expect(inside(child,300,100)).toBe(true);expect(inside(child,300,120)).toBe(false);expect(inside(child,300,80)).toBe(false);const a=Math.PI/4,c={x:300-200*Math.cos(a),y:300-200*Math.sin(a)};expect(inside(child,c.x,c.y)).toBe(true);
  // A stamp brush at the same settings would need many layers; stretching stays one path whose segments curve.
  expect(child.contours![0].points.some(p=>p.out&&Math.hypot(p.out.x,p.out.y)>1)).toBe(true);
 });
 it('keeps holes and the source winding rule',()=>{
  const child=materializeBrush(straight,preset({vectorStamp:ring,size:40}),'g')[1];expect(child.contours).toHaveLength(2);expect(child.fillRule).toBe('evenodd');expect(inside(child,150,100)).toBe(false);expect(inside(child,100,100)).toBe(true);expect(inside(child,150,84)).toBe(true);
 });
 it('preserves art corners while curving art edges between them',()=>{
  const child=materializeBrush(arc(),preset(),'g')[1],points=child.contours![0].points,start=points[0];expect(start.in).toBeDefined();const cross=Math.abs(start.in!.x*start.out!.y-start.in!.y*start.out!.x)/(Math.hypot(start.in!.x,start.in!.y)*Math.hypot(start.out!.x,start.out!.y));expect(cross).toBeGreaterThan(.9);expect(points.every(p=>p.mode==='independent')).toBe(true);
 });
 it('draws a tap at natural proportions so the first sample of a drag never throws',()=>{
  const child=materializeBrush([{x:10,y:20,pressure:1}],preset(),'g')[1];expect(child.width).toBeCloseTo(20,3);expect(child.height).toBeCloseTo(20,3);expect(child.x).toBeCloseTo(10,3);expect(child.y).toBeCloseTo(10,3);
  const short=materializeBrush([{x:10,y:20,pressure:1},{x:10,y:20.4,pressure:1}],preset(),'g')[1];expect(short.height).toBeCloseTo(20,2);expect(short.width).toBeCloseTo(20,2);
 });
 it('tapers thickness with pressure and ignores it when the response is off',()=>{
  const ramp=straight.map((p,i)=>({...p,pressure:i/2})),on=materializeBrush(ramp,preset({pressureSize:true,minimumPressure:.2}),'g')[1],off=materializeBrush(ramp,preset(),'g')[1];expect(off.height).toBeCloseTo(20,3);expect(inside(on,240,93)).toBe(true);expect(inside(on,60,93)).toBe(false);expect(inside(off,60,93)).toBe(true);
 });
 it('does not depend on pointer event segmentation for straight strokes, and is deterministic',()=>{
  const coarse=materializeBrush([straight[0],straight[2]],preset(),'g'),fine=materializeBrush(Array.from({length:21},(_,i)=>({x:50+i*10,y:100,pressure:1})),preset(),'g');for(const key of ['x','y','width','height'] as const)expect(fine[1][key]).toBeCloseTo(coarse[1][key],3);expect(materializeBrush(straight,preset(),'g')).toEqual(materializeBrush(straight,preset(),'g'));
 });
 it('survives noisy slow pointer input without facets across the band',()=>{
  const noisy=Array.from({length:400},(_,i)=>({x:50+i*.5,y:100+(i%2?.5:-.5),pressure:1})),child=materializeBrush(noisy,preset(),'g')[1];expect(child.height).toBeLessThan(23);expect(child.height).toBeGreaterThan(19);
 });
 it('respects the shared 8,192 anchor budget for dense art on long strokes',()=>{
  const dense={version:1 as const,fillRule:'nonzero' as const,contours:[{closed:true,points:Array.from({length:128},(_,i)=>{const a=i/128*Math.PI*2;return {x:50+50*Math.cos(a),y:50+50*Math.sin(a)};})}]},long=Array.from({length:1024},(_,i)=>({x:i*40,y:100+Math.sin(i/9)*200,pressure:1})),child=materializeBrush(long,preset({vectorStamp:dense,size:30}),'g')[1];expect(child.contours![0].points.length).toBeLessThanOrEqual(8192);expect(child.contours![0].points.length).toBeGreaterThanOrEqual(128);
 });
 it('refuses bad samples, oversized output and malformed settings before producing layers',()=>{
  expect(()=>materializeBrush([],preset(),'g')).toThrow('1–1024');expect(()=>materializeBrush([{x:NaN,y:0,pressure:1}],preset(),'g')).toThrow('limits');expect(()=>materializeBrush([{x:0,y:0,pressure:2}],preset(),'g')).toThrow('limits');expect(()=>materializeBrush(straight,preset(),'')).toThrow('ID');
  expect(()=>materializeBrush([{x:-999000,y:0,pressure:1},{x:999000,y:0,pressure:1}],preset(),'g')).toThrow('geometry limit');
  expect(()=>validateBrushPreset(preset({shape:'ellipse',vectorStamp:undefined}))).toThrow('Stretch needs');expect(()=>validateBrushPreset(preset({scatter:{version:1,seed:1,along:0,across:0,rotation:0,size:0}}))).toThrow('Stretch needs');for(const stretch of [{version:2},{version:1,extra:true},[],null,'yes'])expect(()=>validateBrushPreset({...preset(),stretch})).toThrow();
 });
 it('leaves other brushes exactly as before when absent',()=>{
  const plain={...builtInBrushes[0],pressureSize:false},nodes=materializeBrush([{x:10,y:20,pressure:1},{x:30,y:20,pressure:1}],plain,'g');expect(nodes[1]).toMatchObject({type:'ellipse',x:-2,y:8,width:24,height:24});expect(JSON.stringify(builtInBrushes)).not.toContain('stretch');
 });
 it('round-trips through preset JSON and the local library, toggling cleanly',()=>{
  const raw=serializeBrushLibrary([preset()]),parsed=parseBrushLibrary(raw);expect(parsed.presets[0].stretch).toEqual({version:1});const library=useBrushLibrary.getState();library.create(preset(),'Band');expect(useBrushLibrary.getState().settings.stretch).toEqual({version:1});useBrushLibrary.getState().configure({stretch:undefined});expect(useBrushLibrary.getState().settings.stretch).toBeUndefined();useBrushLibrary.getState().configure({stretch:{version:1},scatter:undefined});expect(()=>useBrushLibrary.getState().configure({scatter:{version:1,seed:1,along:0,across:0,rotation:0,size:0}})).toThrow('Stretch needs');expect(useBrushLibrary.getState().settings.scatter).toBeUndefined();
 });
 it('creates from a real sampled source and stays ordinary saved, editable geometry',()=>{
  const d=blankDocument();d.fonts=[];d.pages[0].nodes=[node('path',{id:'sample',name:'Leaf',width:200,height:40,pathWidth:200,pathHeight:40,fill:'#123456',stroke:'',strokeWidth:0,strokes:[],contours:[{closed:true,points:[{x:0,y:20,in:{x:60,y:30},out:{x:60,y:-30}},{x:200,y:20,in:{x:-60,y:-30},out:{x:-60,y:30}},{x:100,y:39}]}]})];const sample=sampleVectorBrush(d,d.pages[0].id,'sample'),brush=preset({vectorStamp:sample.stamp,aspect:1,color:sample.color,opacity:1}),nodes=materializeBrush(arc(),brush,'g');d.pages[0].nodes.push(...nodes);const saved=parseDocument(JSON.stringify(d)),child=saved.pages[0].nodes.find(n=>n.id==='g-stretch')!;expect(child.contours).toEqual(nodes[1].contours);expect(pathContours(child)[0].points).toHaveLength(child.contours![0].points.length);const moved={...child,...transformVectorPoints(child,['0:0'],{dx:5,dy:5})};expect(moved.contours![0].points).toHaveLength(child.contours![0].points.length);
 });
});
