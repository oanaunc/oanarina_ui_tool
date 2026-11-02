import {describe,expect,it} from 'vitest';
import {mapFigScene} from '../src/fig-scene';
import {commands,network,raw,scene,solid} from './helpers/fig-synthetic';
const k=.5522847;
/** A square whose baked outline rounds the listed corners, walking clockwise from the top left. */
function baked(size:number,radii:[number,number,number,number]){const [a,b,c,d]=radii;const ops:[number,number[]][]=[[1,[a,0]],[2,[size-b,0]]];if(b)ops.push([4,[size-b+b*k,0,size,b-b*k,size,b]]);ops.push([2,[size,size-c]]);if(c)ops.push([4,[size,size-c+c*k,size-c+c*k,size,size-c,size]]);ops.push([2,[d,size]]);if(d)ops.push([4,[d-d*k,size,0,size-d+d*k,0,size-d]]);ops.push([2,[0,a]]);if(a)ops.push([4,[0,a-a*k,a-a*k,0,a,0]]);ops.push([0,[]]);return commands(ops);}
const loop=(styles:[number,number,number,number]=[0,0,0,0])=>network([[0,0,styles[0]],[40,0,styles[1]],[40,40,styles[2]],[0,40,styles[3]]],[[0,0,0,1,0,0],[1,0,0,2,0,0],[2,0,0,3,0,0],[3,0,0,0,0,0]],[[[0,1,2,3]]]);
const map=(outline:Uint8Array,net:Uint8Array,fields:Record<string,unknown>={},table:unknown[]=[])=>mapFigScene(scene([raw('VECTOR',3,2,{name:'V',size:{x:40,y:40},fillPaints:[solid()],fillGeometry:[{commandsBlob:0}],vectorData:{vectorNetworkBlob:1,normalizedSize:{x:40,y:40},styleOverrideTable:table},...fields})],[{bytes:[...outline]},{bytes:[...net]}]) as never);
const only=(out:ReturnType<typeof map>)=>out.document.pages[0].nodes.find(n=>n.type==='path')!,codes=(out:ReturnType<typeof map>)=>out.issues.map(i=>i.code);
describe('imported vector corners',()=>{
 it('keeps a layer radius live on every anchor',()=>{const out=map(baked(40,[8,8,8,8]),loop(),{cornerRadius:8}),n=only(out);expect(n.contours?.[0].points.map(p=>p.radius)).toEqual([8,8,8,8]);expect(n.contours?.[0].points.map(p=>p.x)).toEqual([0,40,40,0]);expect(codes(out)).not.toContain('vector-baked');});
 it('keeps a radius set on one anchor',()=>{const out=map(baked(40,[0,12,0,0]),loop([0,1,0,0]),{},[{styleID:1,cornerRadius:12}]),n=only(out);expect(n.contours?.[0].points.map(p=>p.radius)).toEqual([undefined,12,undefined,undefined]);expect(codes(out)).not.toContain('vector-baked');});
 it('lets an anchor override the layer radius',()=>{const out=map(baked(40,[8,0,8,8]),loop([0,1,0,0]),{cornerRadius:8},[{styleID:1,cornerRadius:0}]);expect(only(out).contours?.[0].points.map(p=>p.radius)).toEqual([8,undefined,8,8]);});
 it('keeps corner smoothing with the radii',()=>{const out=map(baked(40,[8,8,8,8]),loop(),{cornerRadius:8,cornerSmoothing:.6}),n=only(out);expect(n.cornerSmoothing).toBe(.6);expect(codes(out)).not.toContain('corner-smoothing');});
 it('reports smoothing on a vector with no rounded anchors',()=>{const out=map(baked(40,[0,0,0,0]),loop(),{cornerSmoothing:.6}),n=only(out);expect(n.cornerSmoothing).toBeUndefined();expect(codes(out)).toContain('corner-smoothing');});
 it('keeps the finished outline when the radii would draw something else',()=>{const out=map(baked(40,[0,0,0,0]),loop(),{cornerRadius:20}),n=only(out);expect(n.contours).toBeUndefined();expect(codes(out)).toContain('vector-baked');});
});
