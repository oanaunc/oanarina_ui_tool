import {expect,it} from 'vitest';
import {wheelZoomFactor} from '../src/canvas-camera';
const at=(timeStamp:number,deltaY:number,wheelDeltaY?:number)=>({timeStamp,deltaY,wheelDeltaY});
it('a whole mouse notch is one fixed step, capped when the wheel is flung',()=>{expect(wheelZoomFactor(at(1000,-40,120),1,false)).toBeCloseTo(1.2);expect(wheelZoomFactor(at(1010,40,-120),1,false)).toBeCloseTo(1/1.2);expect(wheelZoomFactor(at(1020,-400,1200),1,false)).toBeCloseTo(1.2**4);});
it('a slow notch reported as a tiny delta still moves a visible amount, and a trackpad stream stays fine',()=>{const lone=wheelZoomFactor(at(5000,-4,12),1,false);expect(lone).toBeGreaterThan(1.1);const stream=wheelZoomFactor(at(5016,-4,12),1,false);expect(stream).toBeCloseTo(Math.exp(.04));});
it('sensitivity and invert apply to both paths',()=>{expect(wheelZoomFactor(at(9000,-40,120),1,true)).toBeCloseTo(1/1.2);expect(wheelZoomFactor(at(9010,-40,120),2,false)).toBeCloseTo(1.44);});
