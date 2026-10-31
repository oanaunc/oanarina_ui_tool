import {describe,expect,it} from 'vitest';
import {decodeOrder,IMAGE_DECODE_LIMITS,runDecodeQueue} from '../src/image-decode-queue';
import {node} from '../src/model';

const png=(n:number)=>'data:image/png;base64,'+n;
const layer=(x:number,image:string)=>node('rectangle',{x,y:0,width:10,height:10,image});
const camera={zoom:1,pan:{x:0,y:0}},size={width:100,height:100};
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
describe('image decode order',()=>{
 it('starts with the images nearest the view and lists each source once',()=>{
  expect(decodeOrder([layer(2000,png(1)),layer(40,png(2)),layer(500,png(3)),layer(2100,png(2))],camera,size)).toEqual([png(2),png(3),png(1)]);
 });
 it('reads embedded raster data only, and skips hidden layers',()=>{
  expect(decodeOrder([layer(0,'https://example.com/a.png'),layer(0,'data:image/svg+xml;base64,AA'),{...layer(0,png(1)),visible:false}],camera,size)).toEqual([]);
 });
 it('finds image paints',()=>{
  const n={...layer(0,''),paints:[{id:'p',type:'image',visible:true,opacity:1,image:png(4)}]} as unknown as ReturnType<typeof layer>;
  expect(decodeOrder([n],camera,size)).toEqual([png(4)]);
 });
 it('is bounded',()=>{expect(decodeOrder(Array.from({length:400},(_,i)=>layer(i,png(i))),camera,size)).toHaveLength(IMAGE_DECODE_LIMITS.images);});
});
describe('image decode queue',()=>{
 it('never runs more than the limit, and finishes after a failed decode',async()=>{
  const open:(()=>void)[]=[],started:string[]=[];let idle=0;
  const run=runDecodeQueue(['a','b','c','d'],src=>new Promise<void>((resolve,reject)=>{started.push(src);open.push(src==='b'?()=>reject(Error('bad')):resolve);}),()=>idle++);
  expect(started).toEqual(['a','b']);expect(run.pending()).toBe(4);
  open.shift()!();open.shift()!();await flush();expect(started).toEqual(['a','b','c','d']);
  open.shift()!();open.shift()!();await flush();expect(idle).toBe(1);expect(run.pending()).toBe(0);
 });
 it('starts nothing after cancel',async()=>{
  const open:(()=>void)[]=[],started:string[]=[];let idle=0;
  const run=runDecodeQueue(['a','b','c'],src=>new Promise<void>(resolve=>{started.push(src);open.push(resolve);}),()=>idle++);
  run.cancel();open.shift()!();open.shift()!();await flush();
  expect(started).toEqual(['a','b']);expect(idle).toBe(0);expect(run.pending()).toBe(0);
 });
});
