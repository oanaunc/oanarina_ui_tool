import type {Matrix} from './transforms';
import {identity,point} from './transforms';
/** Bounded canvas.fig command stream: close, move, line, quadratic, cubic. */
export function figPath(bytes:Uint8Array,m:Matrix=identity){
 if(!(bytes instanceof Uint8Array)||bytes.length>2_000_000)throw Error('Invalid or oversized Figma path blob.');
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength),parts:string[]=[];let i=0,started=false,count=0;
 while(i<bytes.length){if(++count>100_000)throw Error('Figma path is too complex.');const command=bytes[i++],pairs=[0,1,1,2,3][command];if(pairs===undefined||i+pairs*8>bytes.length)throw Error('Invalid Figma path command.');if(command===0){if(started)parts.push('Z');continue;}if(!started&&command!==1)throw Error('Figma path must start with a move.');started=true;const values:number[]=[];for(let j=0;j<pairs;j++){const x=view.getFloat32(i,true),y=view.getFloat32(i+4,true);i+=8;if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1e6||Math.abs(y)>1e6)throw Error('Invalid Figma path coordinate.');const p=point(m,x,y);if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e6||Math.abs(p.y)>1e6)throw Error('Figma path exceeds the coordinate limit.');values.push(p.x,p.y);}parts.push(['','M','L','Q','C'][command]+values.map(v=>String(Math.round(v*1e6)/1e6)).join(' '));}
 const path=parts.join('');if(path.length>2_000_000)throw Error('Figma path exceeds the path-data limit.');return path;
}
