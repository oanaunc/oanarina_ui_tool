import {expect,it} from 'vitest';
import {node} from '../src/model';
import {multiVectorKey} from '../src/multi-vector';
import {multiVectorSnapIndex,snappedMultiDelta} from '../src/multi-vector-snapping';
const path=(id:string,x:number,y:number)=>node('path',{id,name:id,x,y,width:100,height:50,pathWidth:100,pathHeight:50,fill:'none',stroke:'#000000',strokeWidth:2,contours:[{closed:false,points:[{x:0,y:0},{x:100,y:50}]}]});
it('moving contours are not targets; the rest of the page is',()=>{const nodes=[path('a',0,0),path('b',300,0),path('c',0,300)],index=multiVectorSnapIndex(nodes,[multiVectorKey('a',0,0),multiVectorKey('b',0,1)]);expect(new Set(index.anchors.map(v=>v.id))).toEqual(new Set(['c']));expect(new Set(index.curves.map(v=>v.id))).toEqual(new Set(['c']));});
it('the grabbed anchor lands exactly on a target and the delta applies to the whole selection; far drags stay free',()=>{const nodes=[path('a',0,0),path('c',200,200)],index=multiVectorSnapIndex(nodes,[multiVectorKey('a',0,0)]),near=snappedMultiDelta(index,{x:0,y:0},{x:197,y:202},1);expect(near.delta).toEqual({x:200,y:200});expect(near.hit?.kind).toBe('anchor');const far=snappedMultiDelta(index,{x:0,y:0},{x:40,y:400},1);expect(far.delta).toEqual({x:40,y:400});expect(far.hit).toBeNull();});
