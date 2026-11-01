import {describe,it,expect} from 'vitest';
import {blankDocument,node} from '../src/model';
import {plainClone,savedEqual} from '../src/plain-clone';
describe('plain document copies',()=>{
 it('makes an independent deep copy equal to the original',()=>{const d=blankDocument();d.pages[0].nodes=[node('rectangle',{id:'a',paints:[]})];const copy=plainClone(d);expect(copy).toEqual(d);copy.pages[0].nodes[0].x=9;expect(d.pages[0].nodes[0].x).not.toBe(9);expect(copy.pages).not.toBe(d.pages);});
 it('keeps undefined fields and sparse-free arrays, and passes other objects to structuredClone',()=>{const when=new Date(5),map=new Map([[1,2]]),out=plainClone({a:undefined,b:[1,[2]],when,map});expect('a' in out).toBe(true);expect(out.b).toEqual([1,[2]]);expect(out.when).toEqual(when);expect(out.when).not.toBe(when);expect(out.map.get(1)).toBe(2);});
 it('compares as a saved file would',()=>{expect(savedEqual({a:1,b:undefined},{a:1})).toBe(true);expect(savedEqual({a:1},{a:1,b:undefined})).toBe(true);expect(savedEqual({a:1},{a:2})).toBe(false);expect(savedEqual({a:1},{a:1,b:2})).toBe(false);expect(savedEqual([1,2],[1,2,3])).toBe(false);expect(savedEqual([1],{0:1})).toBe(false);expect(savedEqual({a:{b:[1,{c:2}]}},{a:{b:[1,{c:2}]}})).toBe(true);expect(savedEqual({a:{b:[1,{c:2}]}},{a:{b:[1,{c:3}]}})).toBe(false);expect(savedEqual(null,{})).toBe(false);});
 it('matches JSON comparison on a real document, in both outcomes',()=>{const d=blankDocument(),copy=plainClone(d);expect(savedEqual(d,copy)).toBe(JSON.stringify(d)===JSON.stringify(copy));copy.name='Other';expect(savedEqual(d,copy)).toBe(false);});
});
