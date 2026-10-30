import {describe,expect,it} from 'vitest';
import {node} from '../src/model';
import {thumbnailBounds,thumbnailNodes,thumbnailPlacement} from '../src/page-thumbnail';
import {worldMatrix} from '../src/transforms';

describe('page thumbnail render-only geometry',()=>{
 it('isolates opaque node/parent IDs without changing transforms or source data',()=>{
  const parent=node('frame',{id:'opaque:source;123',x:-50,y:80,width:200,height:100,rotation:35,clip:true}),child=node('rectangle',{id:'child:opaque',parentId:parent.id,x:20,y:90,width:40,height:20});const nodes=[parent,child],before=JSON.stringify(nodes),a=thumbnailNodes(nodes,':one:'),b=thumbnailNodes(nodes,':two:');
  expect(a.map(n=>n.id)).not.toEqual(nodes.map(n=>n.id));expect(a[1].parentId).toBe(a[0].id);expect(new Set([...a,...b].map(n=>n.id)).size).toBe(4);expect(a.every(n=>/^page-preview-[\w-]+$/.test(n.id))).toBe(true);expect(worldMatrix(a[1],a)).toEqual(worldMatrix(child,nodes));expect(JSON.stringify(nodes)).toBe(before);const crafted=node('rectangle',{id:a[0].id}),safe=thumbnailNodes(nodes,':one:',[...nodes,crafted]);expect(safe[0].id).not.toBe(crafted.id);
 });
 it('keeps namespace work and output bounded for long crafted imported IDs',()=>{
  const base='page-preview-_one_',long=node('rectangle',{id:base+'_'.repeat(100_000)}),blocked=node('rectangle',{id:base+'-0--n0'}),nodes=[node('rectangle')],copy=thumbnailNodes(nodes,':one:',[long,blocked]);expect(copy[0].id).toBe(base+'-1--n0');expect(copy[0].id.length).toBeLessThan(100);expect(long.id.length).toBeGreaterThan(100_000);
 });
 it('fits negative/distant geometry without silently dropping layers',()=>{
  const nodes=[node('rectangle',{x:-200,y:-100,width:50,height:25}),node('ellipse',{x:10000,y:5000,width:100,height:100})],b=thumbnailBounds(nodes);expect(b.x).toBeLessThan(-200);expect(b.y).toBeLessThan(-100);expect(b.x+b.width).toBeGreaterThan(10100);expect(b.y+b.height).toBeGreaterThan(5100);expect(thumbnailNodes(nodes,'many')).toHaveLength(2);
 });
 it('clamps placement for desktop, mobile and short viewports',()=>{
  for(const viewport of [{width:1512,height:982},{width:390,height:844},{width:240,height:180}])for(const anchor of [{left:12,right:220,top:5},{left:viewport.width-40,right:viewport.width,top:viewport.height}]){
   const p=thumbnailPlacement(anchor,viewport);expect(p.left).toBeGreaterThanOrEqual(8);expect(p.top).toBeGreaterThanOrEqual(8);expect(p.left+p.width).toBeLessThanOrEqual(viewport.width-8);expect(p.top+p.height).toBeLessThanOrEqual(viewport.height-8);
  }
 });
});
