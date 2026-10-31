import type {Timeline} from '../motion';
/** Motion preview is an editor session; an exported file plays ordinary presentation only, so this is never shown. */
export const usePresentedMotion=(_enabled:boolean,_frameId:string,motion:Timeline|undefined)=>({time:0,playing:false,reduced:false,setTime:(_time:number)=>{},setPlaying:(_playing:boolean)=>{},duration:motion?.duration??2});
export default function MotionPreviewTransport(_props:unknown){return null;}
