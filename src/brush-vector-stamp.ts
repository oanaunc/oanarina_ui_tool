import type {VectorContour} from './model';

export const VECTOR_STAMP_LIMITS={anchors:128,contours:16,bytes:16384,strokeAnchors:8192,pathBytes:1_000_000} as const;
/** Private-metadata-free, normalized editable geometry. Coordinates use a 100 × 100 basis. */
export interface VectorBrushStamp {version:1;fillRule:'nonzero'|'evenodd';contours:VectorContour[];}
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const only=(v:Record<string,unknown>,keys:string[])=>Object.keys(v).every(k=>keys.includes(k));
export function vectorStampAnchors(stamp:VectorBrushStamp){return stamp.contours.reduce((n,c)=>n+c.points.length,0);}
/** Derivative roots of a scalar cubic; constant/linear derivatives keep their exact cases. */
function cubicExtrema(p0:number,p1:number,p2:number,p3:number){const a=-p0+3*p1-3*p2+p3,b=2*(p0-2*p1+p2),c=p1-p0,roots:number[]=[];if(Math.abs(a)<1e-12){if(Math.abs(b)>=1e-12)roots.push(-c/b);}else{const discriminant=b*b-4*a*c;if(discriminant>=0){const q=-.5*(b+Math.sign(b||1)*Math.sqrt(discriminant));if(q){roots.push(q/a,c/q);}else roots.push(-b/(2*a));}}return roots.filter(t=>t>0&&t<1).map(t=>{const u=1-t;return u*u*u*p0+3*u*u*t*p1+3*u*t*t*p2+t*t*t*p3;});}
export function validateVectorBrushStamp(value:unknown):asserts value is VectorBrushStamp {
 if(!object(value)||!only(value,['version','fillRule','contours'])||value.version!==1||!['nonzero','evenodd'].includes(value.fillRule as string)||!Array.isArray(value.contours)||!value.contours.length||value.contours.length>VECTOR_STAMP_LIMITS.contours)throw Error('Vector brush stamps require 1–16 closed contours and a supported fill rule.');
 let anchors=0,minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const c of value.contours){if(!object(c)||!only(c,['closed','points'])||c.closed!==true||!Array.isArray(c.points)||c.points.length<3||(anchors+=c.points.length)>VECTOR_STAMP_LIMITS.anchors)throw Error('A sampled vector brush supports up to 128 anchors in closed contours.');for(const p of c.points){if(!object(p)||!only(p,['x','y','in','out']))throw Error('Invalid vector stamp point fields.');for(const key of ['x','y'])if(typeof p[key]!=='number'||!Number.isFinite(p[key])||Math.abs(p[key] as number)>1000)throw Error('Vector stamp coordinates exceed their normalized bounds.');minX=Math.min(minX,p.x as number);minY=Math.min(minY,p.y as number);maxX=Math.max(maxX,p.x as number);maxY=Math.max(maxY,p.y as number);for(const key of ['in','out'])if(p[key]!==undefined){const h=p[key];if(!object(h)||!only(h,['x','y'])||typeof h.x!=='number'||typeof h.y!=='number'||![h.x,h.y].every(n=>Number.isFinite(n)&&Math.abs(n)<=1000))throw Error('Invalid vector stamp cubic handle.');}}}
 // Imported capsules must fit the advertised basis too; bounding handles alone would reject valid curves.
 for(const c of value.contours as VectorContour[])for(let i=0;i<c.points.length;i++){const a=c.points[i],b=c.points[(i+1)%c.points.length];for(const key of ['x','y'] as const){const extrema=cubicExtrema(a[key],a[key]+(a.out?.[key]??0),b[key]+(b.in?.[key]??0),b[key]);if(key==='x')for(const v of extrema){minX=Math.min(minX,v);maxX=Math.max(maxX,v);}else for(const v of extrema){minY=Math.min(minY,v);maxY=Math.max(maxY,v);}}}
 if(minX < -1e-5||minY < -1e-5||maxX>100+1e-5||maxY>100+1e-5)throw Error('Vector stamp curves must fit their normalized 100 × 100 basis.');
 if(maxX-minX<1e-5||maxY-minY<1e-5)throw Error('Vector stamp curves must span a nondegenerate normalized silhouette.');
 if(new TextEncoder().encode(JSON.stringify(value)).length>VECTOR_STAMP_LIMITS.bytes)throw Error('Vector stamp geometry exceeds 16 KB.');
}
