export interface GradientPoint {x:number;y:number;}
export interface LinearGradientGeometry {angle:number;linearStart?:GradientPoint;linearEnd?:GradientPoint;}
export const LINEAR_GRADIENT_LIMITS={coordinate:10,minLength:.0001} as const;
export function validateLinearGradientGeometry(p:Pick<LinearGradientGeometry,'linearStart'|'linearEnd'>){
 if(p.linearStart===undefined&&p.linearEnd===undefined)return;
 const valid=(v:GradientPoint|undefined)=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).every(k=>k==='x'||k==='y')&&[v.x,v.y].every(x=>Number.isFinite(x)&&Math.abs(x)<=10);
 if(!valid(p.linearStart)||!valid(p.linearEnd)||Math.hypot(p.linearEnd!.x-p.linearStart!.x,p.linearEnd!.y-p.linearStart!.y)<LINEAR_GRADIENT_LIMITS.minLength)throw Error('Linear gradient endpoints must be a pair of finite normalized points within ±10, at least 0.0001 apart.');
}
/** Additive fields are checked for ordinary editor edits as well as full file parsing. */
export function validateDocumentLinearGradients(document:{pages?:unknown}){if(!Array.isArray(document.pages))return;for(const page of document.pages)if(Array.isArray(page?.nodes))for(const n of page.nodes){const paints=[...(Array.isArray(n?.paints)?n.paints:[]),...(Array.isArray(n?.strokes)?n.strokes.map((s:{paint?:unknown})=>s?.paint):[])];for(const p of paints)if(p&&typeof p==='object')validateLinearGradientGeometry(p);}}
/** Absent optional endpoints retain the previous centered, angle-driven rendering. */
export function linearGradientPoints(p:LinearGradientGeometry){if(p.linearStart&&p.linearEnd)return [{x:p.linearStart.x,y:p.linearStart.y},{x:p.linearEnd.x,y:p.linearEnd.y}] as const;const a=p.angle*Math.PI/180;return [{x:.5-Math.cos(a)/2,y:.5-Math.sin(a)/2},{x:.5+Math.cos(a)/2,y:.5+Math.sin(a)/2}] as const;}
export function linearGradientAngle(p:LinearGradientGeometry){if(!p.linearStart||!p.linearEnd)return p.angle;const [a,b]=linearGradientPoints(p),angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;return angle+360*Math.round((p.angle-angle)/360);}
export function rotateLinearGradient(p:LinearGradientGeometry,angle:number):Partial<LinearGradientGeometry>{if(!Number.isFinite(angle))throw Error('Use a finite gradient angle.');if(!p.linearStart||!p.linearEnd)return {angle};const [a,b]=linearGradientPoints(p),cx=(a.x+b.x)/2,cy=(a.y+b.y)/2,r=Math.hypot(b.x-a.x,b.y-a.y)/2,t=angle*Math.PI/180,patch={angle,linearStart:{x:cx-r*Math.cos(t),y:cy-r*Math.sin(t)},linearEnd:{x:cx+r*Math.cos(t),y:cy+r*Math.sin(t)}};validateLinearGradientGeometry(patch);return patch;}
