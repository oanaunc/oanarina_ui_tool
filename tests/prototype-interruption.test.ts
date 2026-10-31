import {describe,expect,it} from 'vitest';
import {defaultTransition,prototypeElapsed,reversedTransition,transitionProgress} from '../src/prototype';
describe('interrupted transitions',()=>{
 it('finds the moment a transition reaches a progress',()=>{const t={...defaultTransition(),type:'dissolve' as const,duration:1000,easing:'ease-in-out' as const};for(const p of [.1,.5,.9])expect(transitionProgress(t,prototypeElapsed(t,p))).toBeCloseTo(p,4);expect(prototypeElapsed(t,0)).toBe(0);expect(prototypeElapsed(t,1)).toBe(1000);expect(prototypeElapsed({...t,type:'instant'},.5)).toBe(0);});
 it('plays moves backward through their mirror',()=>{const t=defaultTransition();expect(reversedTransition({...t,type:'move-in',direction:'left'})).toMatchObject({type:'move-out',direction:'right'});expect(reversedTransition({...t,type:'slide-out',direction:'top'})).toMatchObject({type:'slide-in',direction:'bottom'});expect(reversedTransition({...t,type:'push',direction:'left'})).toMatchObject({type:'push',direction:'right'});expect(reversedTransition({...t,type:'dissolve',direction:'left'}).type).toBe('dissolve');});
});
