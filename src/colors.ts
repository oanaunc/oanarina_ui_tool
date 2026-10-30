export type ColorMode='HEX'|'RGB'|'HSL'|'HSB';
export function colorHsv(hex:string){const [r,g,b]=hexRgb(hex).map(v=>v/255),max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;let h=d===0?0:max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;return {h,s:max?d/max:0,v:max};}
export function hsvColor(h:number,s:number,v:number){if(![h,s,v].every(Number.isFinite))throw Error('Use finite color values.');return parseColor(`${h}, ${clamp(s)*100}, ${clamp(v)*100}`,'HSB')!.color;}
const clamp=(n:number,max=1)=>Math.max(0,Math.min(max,n));
export function hexRgb(hex:string){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
export function colorString(hex:string,mode:ColorMode){if(mode==='HEX')return hex.toUpperCase();const [r,g,b]=hexRgb(hex).map(v=>v/255);if(mode==='RGB')return [r,g,b].map(v=>Math.round(v*255)).join(', ');const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=d===0?0:max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;const s=mode==='HSB'?(max?d/max:0):d===0?0:d/(1-Math.abs(2*l-1));return [Math.round(h),Math.round(s*100)+'%',Math.round((mode==='HSB'?max:l)*100)+'%'].join(', ');}
export function parseColor(input:string,mode:ColorMode):{color:string;alpha?:number}|null {
 const text=input.trim();if(/^#[a-f0-9]{3,8}$/i.test(text)){let h=text.slice(1);if(h.length===3||h.length===4)h=h.split('').map(c=>c+c).join('');if(h.length!==6&&h.length!==8)return null;return {color:'#'+h.slice(0,6).toLowerCase(),...(h.length===8?{alpha:parseInt(h.slice(6),16)/255}:{})};}
 const values=text.replace(/[a-z()]/gi,'').split(/[ ,/]+/).filter(Boolean).map(v=>parseFloat(v));if(values.length<3||values.some(v=>!Number.isFinite(v)))return null;let rgb:number[];
 if(mode==='RGB')rgb=values.slice(0,3).map(v=>clamp(v,255));else if(mode==='HSL'||mode==='HSB'){const h=((values[0]%360)+360)%360/60,s=clamp(values[1]/100),v=clamp(values[2]/100),c=mode==='HSB'?v*s:(1-Math.abs(2*v-1))*s,x=c*(1-Math.abs(h%2-1)),m=mode==='HSB'?v-c:v-c/2;const base=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];rgb=base.map(v=>(v+m)*255);}else return null;
 return {color:'#'+rgb.map(v=>Math.round(v).toString(16).padStart(2,'0')).join(''),...(values[3]!==undefined?{alpha:clamp(values[3])}:{})};
}
