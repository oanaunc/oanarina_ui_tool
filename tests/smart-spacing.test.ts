import {describe,expect,it} from 'vitest';
import {node} from '../src/model';
import type {DesignNode} from '../src/model';
import {shiftSmart,smartGapDrag,smartHandles,smartMoves,smartSpacing,smartSwapDrag} from '../src/smart-spacing';
import type {SmartDragMemo} from '../src/smart-spacing';
const box=(id:string,x:number,y:number,width=40,height=40,extra:Partial<DesignNode>={})=>node('rectangle',{id,x,y,width,height,...extra});
const row=()=>[box('a',0,0),box('b',60,0),box('c',120,0)];
const tile=()=>[box('a',0,0),box('b',60,0),box('c',0,60),box('d',60,60)];
const detect=(nodes:DesignNode[])=>smartSpacing(nodes,nodes.filter(n=>!n.parentId));
const place=(nodes:DesignNode[],grid:NonNullable<ReturnType<typeof detect>>,deltas:Map<string,{x:number;y:number}>)=>Object.fromEntries(shiftSmart(nodes,smartMoves(nodes,grid),deltas).map(n=>[n.id,[n.x,n.y]]));
describe('detecting a smart selection',()=>{
 it('reads a row, a column and a grid',()=>{expect(detect(row())).toMatchObject({columns:3,rows:1,gapX:20});expect(detect([box('a',0,0),box('b',0,60),box('c',0,120)])).toMatchObject({columns:1,rows:3,gapY:20});expect(detect(tile())).toMatchObject({columns:2,rows:2,gapX:20,gapY:20});});
 it('reads layers of different sizes as long as the gaps match',()=>{expect(detect([box('a',0,0,40,40),box('b',60,0,100,20),box('c',180,5,10,30)])).toMatchObject({columns:3,gapX:20});});
 it('accepts an incomplete last row',()=>{expect(detect([...tile().slice(0,3),box('e',120,0)])).toMatchObject({columns:3,rows:2});});
 it('rejects uneven gaps and leaves them to Tidy',()=>{expect(detect([box('a',0,0),box('b',60,0),box('c',130,0)])).toBeUndefined();expect(detect([box('a',0,0),box('b',60,0),box('c',4,60),box('d',60,60)])).toBeUndefined();});
 it('rejects overlap',()=>{expect(detect([box('a',0,0),box('b',20,0)])).toBeUndefined();});
 it('rejects one layer, locked layers, mixed parents and auto layout children',()=>{expect(detect([box('a',0,0)])).toBeUndefined();expect(detect([box('a',0,0,40,40,{locked:true}),box('b',60,0)])).toBeUndefined();const f=node('frame',{id:'f',layout:'horizontal'}),a=box('a',0,0,40,40,{parentId:'f'}),b=box('b',60,0,40,40,{parentId:'f'});expect(smartSpacing([f,a,b],[a,b])).toBeUndefined();const c=box('c',60,0);expect(smartSpacing([f,a,c],[a,c])).toBeUndefined();});
});
describe('handles',()=>{
 it('one bar per gap, one dot per layer',()=>{const nodes=tile(),h=smartHandles(detect(nodes)!,1);expect(h.spacing.map(s=>s.key)).toEqual(['smart-gap:x:0','smart-gap:y:0']);expect(h.shapes.map(s=>s.key)).toEqual(['smart-swap:a','smart-swap:b','smart-swap:c','smart-swap:d']);expect(h.shapes[0]).toMatchObject({x:20,y:20});});
 it('keeps a screen size and drops dots on small layers',()=>{const grid=detect(row())!,h=smartHandles(grid,.25);expect(Math.hypot(h.spacing[0].to.y-h.spacing[0].from.y,0)*.25).toBeCloseTo(16);expect(h.shapes).toEqual([]);});
 it('column and row bars of a grid never sit on each other',()=>{const [x,y]=smartHandles(detect(tile())!,1).spacing;expect(x.from).toEqual({x:50,y:12});expect(y.from).toEqual({x:12,y:50});});
 it('sits in the middle of the gap',()=>{const h=smartHandles(detect(row())!,1).spacing[0];expect(h.from.x).toBe(50);expect(h.zone[0].x).toBe(40);expect(h.zone[1].x).toBe(60);});
});
describe('dragging a gap',()=>{
 it('spreads every gap from the first layer',()=>{const nodes=row(),grid=detect(nodes)!,drag=smartGapDrag(grid,'x',{x:0,y:0},{x:10,y:0});expect(drag.text).toBe('30');expect(place(nodes,grid,drag.deltas)).toEqual({a:[0,0],b:[70,0],c:[140,0]});});
 it('stops at touching',()=>{const nodes=row(),grid=detect(nodes)!,drag=smartGapDrag(grid,'x',{x:0,y:0},{x:-500,y:0});expect(place(nodes,grid,drag.deltas)).toEqual({a:[0,0],b:[40,0],c:[80,0]});});
 it('moves only the dragged axis of a grid',()=>{const nodes=tile(),grid=detect(nodes)!,drag=smartGapDrag(grid,'y',{x:0,y:0},{x:0,y:15});expect(place(nodes,grid,drag.deltas)).toEqual({a:[0,0],b:[60,0],c:[0,75],d:[60,75]});});
 it('keeps uneven sizes evenly spaced and leaves their cross position',()=>{const nodes=[box('a',0,0,40,40),box('b',60,8,100,20),box('c',180,5,10,30)],grid=detect(nodes)!,drag=smartGapDrag(grid,'x',{x:0,y:0},{x:5,y:0});expect(place(nodes,grid,drag.deltas)).toEqual({a:[0,0],b:[65,8],c:[190,5]});});
 it('carries descendants and honors a rotated parent',()=>{const p=node('frame',{id:'p',x:100,y:100,width:300,height:300,rotation:90}),nodes=[p,box('a',110,110,40,40,{parentId:'p'}),box('b',170,110,40,40,{parentId:'p'}),box('k',112,112,10,10,{parentId:'a'})],grid=smartSpacing(nodes,[nodes[1],nodes[2]])!;expect(grid.rows).toBe(2);const drag=smartGapDrag(grid,'y',{x:0,y:0},{x:0,y:10}),out=shiftSmart(nodes,smartMoves(nodes,grid),drag.deltas);expect(out.find(n=>n.id==='b')!.x).toBeCloseTo(180);expect(out.find(n=>n.id==='a')!.x).toBeCloseTo(110);expect(out.find(n=>n.id==='k')!.x).toBeCloseTo(112);});
});
describe('swapping',()=>{
 it('trades places past the neighbor middle',()=>{const nodes=row(),grid=detect(nodes)!,memo:SmartDragMemo={},near=smartSwapDrag(grid,'a',{x:20,y:20},{x:75,y:20},memo);expect(place(nodes,grid,near.deltas)).toEqual({a:[0,0],b:[60,0],c:[120,0]});const past=smartSwapDrag(grid,'a',{x:20,y:20},{x:85,y:20},memo);expect(place(nodes,grid,past.deltas)).toEqual({b:[0,0],a:[60,0],c:[120,0]});});
 it('the dragged layer follows the pointer until it settles',()=>{const nodes=row(),grid=detect(nodes)!,drag=smartSwapDrag(grid,'a',{x:20,y:20},{x:85,y:33},{});expect(drag.shown.get('a')).toEqual({x:65,y:13});expect(drag.deltas.get('a')).toEqual({x:60,y:0});});
 it('passes several neighbors in one drag',()=>{const nodes=row(),grid=detect(nodes)!,memo:SmartDragMemo={};smartSwapDrag(grid,'a',{x:20,y:20},{x:85,y:20},memo);const end=smartSwapDrag(grid,'a',{x:20,y:20},{x:150,y:20},memo);expect(place(nodes,grid,end.deltas)).toEqual({b:[0,0],c:[60,0],a:[120,0]});});
 it('coming back undoes the trade',()=>{const nodes=row(),grid=detect(nodes)!,memo:SmartDragMemo={};smartSwapDrag(grid,'a',{x:20,y:20},{x:85,y:20},memo);smartSwapDrag(grid,'a',{x:20,y:20},{x:120,y:20},memo);const back=smartSwapDrag(grid,'a',{x:20,y:20},{x:10,y:20},memo);expect(place(nodes,grid,back.deltas)).toEqual({a:[0,0],b:[60,0],c:[120,0]});});
 it('unequal widths keep the gap and do not flicker',()=>{const nodes=[box('a',0,0,20,40),box('b',40,0,200,40)],grid=detect(nodes)!,memo:SmartDragMemo={};const first=smartSwapDrag(grid,'a',{x:10,y:20},{x:150,y:20},memo);expect(place(nodes,grid,first.deltas)).toEqual({b:[0,0],a:[220,0]});const again=smartSwapDrag(grid,'a',{x:10,y:20},{x:152,y:20},memo);expect(place(nodes,grid,again.deltas)).toEqual({b:[0,0],a:[220,0]});});
 it('swaps diagonally in a grid and fills an empty cell',()=>{const nodes=tile(),grid=detect(nodes)!,drag=smartSwapDrag(grid,'a',{x:20,y:20},{x:80,y:80},{});expect(place(nodes,grid,drag.deltas)).toEqual({a:[60,60],b:[60,0],c:[0,60],d:[0,0]});const sparse=tile().slice(0,3),open=detect(sparse)!,into=smartSwapDrag(open,'a',{x:20,y:20},{x:80,y:80},{});expect(place(sparse,open,into.deltas)).toEqual({a:[60,60],b:[60,0],c:[0,60]});});
});
