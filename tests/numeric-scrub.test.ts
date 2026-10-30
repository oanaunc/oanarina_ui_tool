import {it,expect} from 'vitest';
import {scrubNumber} from '../src/numeric-scrub';
it('scrubs incrementally with normal, fast and precision speeds and finite bounds',()=>{expect(scrubNumber(100,12,1,{})).toBe(112);expect(scrubNumber(100,-3,1,{shiftKey:true})).toBe(70);expect(scrubNumber(1,3,.1,{altKey:true})).toBe(1.03);expect(scrubNumber(20,50,1,{},0,30)).toBe(30);expect(scrubNumber(0,-100,1,{},0,30)).toBe(0);for(const args of [[NaN,1,1,{},0,1],[0,1,0,{},0,1],[0,1,1,{},5,1]]as const)expect(()=>scrubNumber(...args)).toThrow();});
