import {rememberColor} from './recent-colors';
import {useEditor} from './store';

/** The Mac menu command runs the system color sampler and hands the shell's result here; the renderer can start nothing.
 * The newest open color picker takes it. With none open it goes to recent colors, so a sample is never lost. */
export interface ScreenColor {srgb:string;p3:string;}
const pickers:((color:string)=>void)[]=[];
export function subscribeScreenColor(pick:(color:string)=>void){pickers.push(pick);return ()=>{const at=pickers.lastIndexOf(pick);if(at>=0)pickers.splice(at,1);};}
const hex=/^#[a-f\d]{6}$/i;
export function parseScreenColor(value:unknown):ScreenColor{const v=value as Partial<ScreenColor>|null;if(!v||typeof v!=='object'||typeof v.srgb!=='string'||typeof v.p3!=='string'||!hex.test(v.srgb)||!hex.test(v.p3))throw Error('Invalid sampled color.');return {srgb:v.srgb,p3:v.p3};}
/** Display P3 files keep the wide coordinates the sampler read, not a clipped sRGB copy. */
export function receiveScreenColor(value:unknown){
 const sample=parseScreenColor(value),s=useEditor.getState(),color=(s.doc.colorProfile==='display-p3'?sample.p3:sample.srgb).toLowerCase(),pick=pickers[pickers.length-1];
 rememberColor(color);
 if(pick)pick(color);else s.set({toast:`Sampled ${color}. It is in your recent colors.`});
 return true;
}
