import {createElement} from 'react';
import {describe,expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {Artwork} from '../src/components/Artwork';
import {grabOutline} from '../src/canvas-chrome';
import {node} from '../src/model';
const box=(x:number,y:number,w:number,h:number)=>[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];
const render=(n:ReturnType<typeof node>,interactive:boolean)=>renderToStaticMarkup(createElement('svg',{},createElement(Artwork,{nodes:[n],...(interactive?{onNode:()=>{}}:{})})));
describe('grab outline',()=>{
 it('leaves a layer of ordinary size alone',()=>{const corners=box(0,0,100,100);expect(grabOutline(corners,1)).toBe(corners);});
 it('only widens the thin axis',()=>{const out=grabOutline(box(0,0,100,2),1);expect(out[0]).toEqual({x:0,y:-9});expect(out[2]).toEqual({x:100,y:11});});
 it('works in screen pixels at any zoom',()=>{expect(grabOutline(box(0,0,100,100),.1)[0]).toEqual({x:-50,y:-50});expect(grabOutline(box(0,0,4,4),4)[0].x).toBeCloseTo(-.5);});
 it('follows a rotated layer',()=>{const out=grabOutline([{x:0,y:0},{x:0,y:100},{x:-2,y:100},{x:-2,y:0}],1);expect(out[0].x).toBeCloseTo(9);expect(out[0].y).toBeCloseTo(0);expect(out[2].x).toBeCloseTo(-11);});
 it('survives a layer with no size at all',()=>{const out=grabOutline(box(5,5,0,0),1);expect(out.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).toBe(true);expect(Math.hypot(out[1].x-out[0].x,out[1].y-out[0].y)).toBeCloseTo(20);});
});
describe('hit area',()=>{
 it('exists on the interactive canvas and never in export markup',()=>{const line=node('line',{x:0,y:0,width:100,height:0});expect(render(line,true)).toContain('data-hit-area');expect(render(line,false)).not.toContain('data-hit-area');});
 it('keeps a constant screen width',()=>{const svg=render(node('line',{x:0,y:0,width:100,height:0}),true);expect(svg).toMatch(/vector-effect="non-scaling-stroke"[^>]*pointer-events="stroke"|pointer-events="stroke"[^>]*vector-effect="non-scaling-stroke"/);});
 it('covers unfilled paths and thin shapes, not ordinary fills',()=>{expect(render(node('rectangle',{width:100,height:1}),true)).toContain('data-hit-area');expect(render(node('rectangle',{width:100,height:40}),true)).not.toContain('data-hit-area');expect(render(node('text',{width:100,height:1}),true)).not.toContain('data-hit-area');});
});
