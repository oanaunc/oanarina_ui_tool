import {describe,expect,it} from 'vitest';
import {blankDocument,node,parseDocument} from '../src/model';
import type {DesignNode,VectorPoint} from '../src/model';
import {roundVectorCorners} from '../src/vector-operations';
import {canvasPathPoint} from '../src/canvas-geometry';
import {pathContours} from '../src/geometry';

type P={x:number;y:number};
const path=(points:VectorPoint[],closed=false)=>node('path',{x:0,y:0,width:300,height:300,pathWidth:300,pathHeight:300,contours:[{closed,points}]});
const world=(n:DesignNode,p:P)=>canvasPathPoint(n,[n],p);
const rounded=(n:DesignNode,keys:string[],radius:number)=>{const out={...n,...roundVectorCorners(n,keys,radius)};return {out,points:out.contours![0].points.map(p=>({...world(out,p),out:p.out?{x:world(out,{x:p.x+p.out.x,y:p.y+p.out.y}).x-world(out,p).x,y:world(out,{x:p.x+p.out.x,y:p.y+p.out.y}).y-world(out,p).y}:undefined,in:p.in?{x:world(out,{x:p.x+p.in.x,y:p.y+p.in.y}).x-world(out,p).x,y:world(out,{x:p.x+p.in.x,y:p.y+p.in.y}).y-world(out,p).y}:undefined}))};};
const bezier=(a:P,b:P,c:P,d:P,t:number)=>{const u=1-t;return {x:u*u*u*a.x+3*u*u*t*b.x+3*u*t*t*c.x+t*t*t*d.x,y:u*u*u*a.y+3*u*u*t*b.y+3*u*t*t*c.y+t*t*t*d.y};};
const curve=(a:{x:number;y:number;out?:P},b:{x:number;y:number;in?:P})=>[a,{x:a.x+(a.out?.x??0),y:a.y+(a.out?.y??0)},{x:b.x+(b.in?.x??0),y:b.y+(b.in?.y??0)},b] as const;
const closest=(p:P,c:readonly [P,P,P,P])=>{let best=Infinity;for(let i=0;i<=4000;i++){const q=bezier(c[0],c[1],c[2],c[3],i/4000);best=Math.min(best,Math.hypot(p.x-q.x,p.y-q.y));}return best;};
const direction=(v:P)=>{const l=Math.hypot(v.x,v.y);return {x:v.x/l,y:v.y/l};};
const parallel=(a:P,b:P)=>Math.abs(direction(a).x*direction(b).y-direction(a).y*direction(b).x);
const samples=(a:{x:number;y:number;out?:P},b:{x:number;y:number;in?:P},count=9)=>{const c=curve(a,b);return Array.from({length:count},(_,i)=>bezier(c[0],c[1],c[2],c[3],(i+1)/(count+1)));};
const centerOf=(a:P,ta:P,b:P,tb:P)=>{const na={x:-ta.y,y:ta.x},nb={x:-tb.y,y:tb.x},d=na.x*nb.y-na.y*nb.x,s=((b.x-a.x)*nb.y-(b.y-a.y)*nb.x)/d;return {x:a.x+na.x*s,y:a.y+na.y*s};};

describe('rounding corners between curved segments',()=>{
 const lineCurve=()=>path([{x:0,y:0},{x:100,y:0},{x:200,y:100,in:{x:-20,y:-80}}]);
 it('fits an exact-radius circular fillet between a line and a cubic, tangent to both',()=>{
  const n=lineCurve(),before=JSON.stringify(n),{points}=rounded(n,['0:1'],20),[start,a,...rest]=points,last=rest.at(-1)!,b=rest.at(-2)!;
  expect(JSON.stringify(n)).toBe(before);expect(start).toMatchObject({x:0,y:0});expect(a.y).toBeCloseTo(0,3);expect(a.x).toBeLessThan(100);expect(parallel(a.out!,{x:1,y:0})).toBeLessThan(1e-3);
  const original=curve({x:100,y:0,out:{x:0,y:0}},{x:200,y:100,in:{x:-20,y:-80}});expect(closest(b,original)).toBeLessThan(.02);expect(parallel(b.in!,b.out!)).toBeLessThan(.005);
  const center=centerOf(a,direction(a.out!),b,direction(b.in!));expect(Math.hypot(a.x-center.x,a.y-center.y)).toBeCloseTo(20,2);expect(Math.hypot(b.x-center.x,b.y-center.y)).toBeCloseTo(20,2);
  const arc=samples(a,b);for(const p of arc)expect(Math.abs(Math.hypot(p.x-center.x,p.y-center.y)-20)).toBeLessThan(.02);
  // The kept tail is the original cubic, restricted exactly, not a refitted approximation.
  for(const p of samples(b,last))expect(closest(p,original)).toBeLessThan(.02);expect(last).toMatchObject({x:200,y:100});
 });
 it('rounds a sharp corner between two cubics on either contour direction with one geometry',()=>{
  const forward=[{x:0,y:100,out:{x:40,y:-60}},{x:100,y:0,in:{x:-30,y:30},out:{x:30,y:30}},{x:200,y:100,in:{x:-40,y:-60}}] as VectorPoint[],reversed=forward.slice().reverse().map(p=>({x:p.x,y:p.y,in:p.out,out:p.in})),a=rounded(path(forward),['0:1'],15).points,b=rounded(path(reversed),['0:1'],15).points.slice().reverse();
  expect(a.length).toBe(b.length);expect(a.length).toBeGreaterThanOrEqual(4);for(const [i,p] of a.entries()){expect(p.x).toBeCloseTo(b[i].x,3);expect(p.y).toBeCloseTo(b[i].y,3);}
  const u=a[1],v=a.at(-2)!,center=centerOf(u,direction(u.out!),v,direction(v.in!));expect(Math.hypot(u.x-center.x,u.y-center.y)).toBeCloseTo(15,1);expect(closest(u,curve(forward[0],forward[1]))).toBeLessThan(.02);expect(closest(v,curve(forward[1],forward[2]))).toBeLessThan(.02);
 });
 it('rounds both anchors of a two-corner lens, trimming one cubic from each end',()=>{
  const lens=path([{x:0,y:50,in:{x:30,y:40},out:{x:30,y:-40}},{x:200,y:50,in:{x:-30,y:-40},out:{x:-30,y:40}}],true),{out,points}=rounded(lens,['0:0','0:1'],12);expect(points.length).toBeGreaterThanOrEqual(4);expect(out.contours![0].closed).toBe(true);expect(JSON.stringify(points)).not.toContain('null');const left=Math.min(...points.map(p=>p.x)),right=Math.max(...points.map(p=>p.x));expect(left).toBeGreaterThan(0);expect(right).toBeLessThan(200);const top=curve({x:0,y:50,out:{x:30,y:-40}},{x:200,y:50,in:{x:-30,y:-40}});for(const p of points.filter(p=>p.y<20))expect(closest(p,top)).toBeLessThan(.02);
 });
 it('rounds adjacent selected anchors sharing one cubic without overlap',()=>{
  const n=path([{x:0,y:0},{x:100,y:0,out:{x:30,y:50}},{x:200,y:0,in:{x:-30,y:50}},{x:300,y:0}]),{points}=rounded(n,['0:1','0:2'],500);const xs=points.map(p=>p.x);expect(xs).toEqual(xs.slice().sort((a,b)=>a-b));const middle=curve({x:100,y:0,out:{x:30,y:50}},{x:200,y:0,in:{x:-30,y:50}});expect(points.filter(p=>p.y>1).every(p=>closest(p,middle)<.05)).toBe(true);expect(points.at(-1)).toMatchObject({x:300,y:0});
 });
 it('clamps an oversized radius to the largest fillet within half each segment',()=>{
  const n=lineCurve(),{points}=rounded(n,['0:1'],1e5),a=points[1],b=points.at(-2)!;expect(a.x).toBeGreaterThanOrEqual(49.9);expect(a.x).toBeLessThan(100);expect(Number.isFinite(b.x)).toBe(true);expect(closest(b,curve({x:100,y:0,out:{x:0,y:0}},{x:200,y:100,in:{x:-20,y:-80}}))).toBeLessThan(.05);
 });
 it('keeps neighbors exact: unselected anchors, far handles and open end handles survive, and mirrored neighbors become aligned',()=>{
  const n=path([{x:0,y:0,in:{x:-5,y:0},out:{x:20,y:20},mode:'mirrored'},{x:100,y:0,in:{x:-20,y:20}},{x:200,y:0}]),{out,points}=rounded(n,['0:1'],10);expect(points[0]).toMatchObject({x:0,y:0});expect(points[0].in).toBeDefined();expect(Math.hypot(points[0].in!.x,points[0].in!.y)).toBeCloseTo(5,4);expect(out.contours![0].points[0].mode).toBe('aligned');expect(Math.hypot(points[0].out!.x,points[0].out!.y)).toBeLessThan(Math.hypot(20,20));expect(parallel(points[0].out!,{x:1,y:1})).toBeLessThan(1e-3);
 });
 it('refuses smooth anchors, cusps, duplicates and open endpoints atomically',()=>{
  const smooth=path([{x:0,y:0,out:{x:10,y:40}},{x:100,y:50,in:{x:-30,y:0},out:{x:30,y:0}},{x:200,y:0,in:{x:-10,y:40}}]),before=JSON.stringify(smooth);expect(()=>roundVectorCorners(smooth,['0:1'],10)).toThrow('nonzero angle');expect(JSON.stringify(smooth)).toBe(before);
  expect(()=>roundVectorCorners(path([{x:0,y:0},{x:100,y:0},{x:50,y:0}]),['0:1'],10)).toThrow('nonzero angle');
  expect(()=>roundVectorCorners(path([{x:0,y:0},{x:100,y:0},{x:100,y:0},{x:200,y:50}]),['0:1'],10)).toThrow('duplicate');
  expect(()=>roundVectorCorners(path([{x:0,y:0,out:{x:10,y:10}},{x:100,y:0,in:{x:0,y:30}},{x:200,y:0}]),['0:0'],10)).toThrow('endpoints');
  // A malformed multi-corner request leaves nothing half-applied.
  const mixed=path([{x:0,y:0},{x:100,y:0},{x:100,y:100},{x:150,y:100,in:{x:-20,y:0},out:{x:20,y:0}},{x:220,y:100}]);expect(()=>roundVectorCorners(mixed,['0:1','0:3'],10)).toThrow('nonzero angle');expect(mixed.contours![0].points).toHaveLength(5);
 });
 it('keeps curved fillet output through a saved document parse',()=>{
  const out={...lineCurve(),...roundVectorCorners(lineCurve(),['0:1'],20)},d=blankDocument();d.pages[0].nodes=[out as DesignNode];const parsed=parseDocument(JSON.stringify(d)),saved=parsed.pages[0].nodes[0];expect(saved.contours).toEqual(out.contours);expect(pathContours(saved)[0].points.length).toBe(out.contours![0].points.length);
 });
 it('uses a quarter-turn bound so a sharp corner stays circular',()=>{
  const n=path([{x:0,y:0},{x:200,y:20},{x:0,y:40}]),{points}=rounded(n,['0:1'],8);expect(points.length).toBeGreaterThanOrEqual(5);const a=points[1],b=points.at(-2)!,center=centerOf(a,direction(a.out!),b,direction(b.in!));for(let i=1;i<points.length-2;i++)for(const p of samples(points[i],points[i+1]))expect(Math.abs(Math.hypot(p.x-center.x,p.y-center.y)-8)).toBeLessThan(.02);
 });
});
