/** Document working space. Saved hex coordinates mean sRGB unless the file explicitly opts into Display P3. */
export type DocumentColorProfile='srgb'|'display-p3';
export const COLOR_PROFILES:{value:DocumentColorProfile;label:string}[]=[{value:'srgb',label:'sRGB'},{value:'display-p3',label:'Display P3'}];
export function validateColorProfile(value:unknown):asserts value is DocumentColorProfile|undefined{if(value!==undefined&&value!=='srgb'&&value!=='display-p3')throw Error('The document color profile must be sRGB or Display P3.');}
const P3_TO_SRGB=[[1.2249401763,-.2249401763,0],[-.0420569547,1.0420569547,0],[-.0196375546,-.0786360456,1.0982736002]];
const SRGB_TO_P3=[[.8224621209,.1775378791,0],[.0331941108,.9668058892,0],[.0170826307,.0723974407,.9105199286]];
const decode=(v:number)=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4,encode=(v:number)=>v<=.0031308?v*12.92:1.055*v**(1/2.4)-.055;
const channels=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),hexOf=(v:number[])=>'#'+v.map(c=>Math.round(Math.max(0,Math.min(1,c))*255).toString(16).padStart(2,'0')).join('');
function convert(hex:string,m:number[][]){const l=channels(hex).map(decode);return m.map(row=>encode(Math.max(0,row[0]*l[0]+row[1]*l[1]+row[2]*l[2])));}
/** Both spaces share a transfer curve, so only linear primaries differ. Out-of-gamut channels clip. */
export const p3ToSrgbHex=(hex:string)=>hexOf(convert(hex,P3_TO_SRGB)),srgbToP3Hex=(hex:string)=>hexOf(convert(hex,SRGB_TO_P3));
export function outsideSrgb(hex:string){if(!/^#[0-9a-f]{6}$/i.test(hex))return false;const l=channels(hex).map(decode);return P3_TO_SRGB.some(row=>{const v=row[0]*l[0]+row[1]*l[1]+row[2]*l[2];return v<-.0005||v>1.0005;});}
const fixed=(v:number)=>String(Math.round(v*10000)/10000);
/** Output color for SVG/CSS. sRGB output is the untouched saved value, so legacy markup stays byte-identical. */
export function displayColor(color:string,profile:DocumentColorProfile|undefined){if(profile!=='display-p3')return color;const value=/^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(color);if(!value)return color;const [r,g,b]=channels('#'+value[1]);return `color(display-p3 ${fixed(r)} ${fixed(g)} ${fixed(b)}${value[2]?` / ${fixed(parseInt(value[2],16)/255)}`:''})`;}
/** Pixel output is sRGB-numeric SVG tile markup; only literal hex attributes in generated source are rewritten. */
export function displaySvgMarkup(svg:string,profile:DocumentColorProfile|undefined){return profile==='display-p3'?svg.replace(/\b(fill|stroke)="(#[0-9a-f]{6})"/gi,(_,key:string,color:string)=>`${key}="${displayColor(color,profile)}"`):svg;}
