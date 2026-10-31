import {it,expect} from 'vitest';
import {node} from '../src/model';
import type {DesignNode} from '../src/model';
import {PROGRESSIVE_PAGE_LIMITS,progressiveBatches} from '../src/progressive-page';
import {indexViewportRoots} from '../src/viewport-culling';

const roots=(count:number)=>Array.from({length:count},(_,i)=>node('rectangle',{id:'n'+i}));
const flatten=(b:DesignNode[][])=>b.flat().map(n=>n.id);
it('stays single-pass below the threshold or with one dominant root',()=>{expect(progressiveBatches(roots(10),indexViewportRoots(roots(10)).rootFor)).toBeNull();const parent=node('frame',{id:'root'}),kids=Array.from({length:PROGRESSIVE_PAGE_LIMITS.threshold+10},(_,i)=>node('rectangle',{id:'k'+i,parentId:'root'})),list=[parent,...kids];expect(progressiveBatches(list,indexViewportRoots(list).rootFor)).toBeNull();});
it('partitions complete root subtrees in root order, covering every layer exactly once',()=>{const list:DesignNode[]=[];for(let i=0;i<900;i++)list.push(node('frame',{id:'f'+i}),node('rectangle',{id:'a'+i,parentId:'f'+i}),node('rectangle',{id:'b'+i,parentId:'f'+i}),node('rectangle',{id:'c'+i,parentId:'f'+i}));const batches=progressiveBatches(list,indexViewportRoots(list).rootFor)!;expect(batches.length).toBeGreaterThan(1);expect(flatten(batches)).toEqual(list.map(n=>n.id));for(const batch of batches){const ids=new Set(batch.map(n=>n.id));for(const n of batch)if(n.parentId)expect(ids.has(n.parentId)).toBe(true);}});
it('keeps root stacking when descendants are stored away from their root',()=>{const list=[...roots(PROGRESSIVE_PAGE_LIMITS.threshold).map(n=>({...n})),node('rectangle',{id:'late',parentId:'n0'})];const batches=progressiveBatches(list,indexViewportRoots(list).rootFor)!;expect(batches[0].map(n=>n.id)).toContain('late');expect(batches.flat().filter(n=>!n.parentId).map(n=>n.id)).toEqual(list.filter(n=>!n.parentId).map(n=>n.id));});
it('refuses an unknown root mapping instead of dropping a layer',()=>{const list=roots(PROGRESSIVE_PAGE_LIMITS.threshold);expect(progressiveBatches(list,new Map())).toBeNull();});
