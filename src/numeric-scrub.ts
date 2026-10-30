export function scrubNumber(value:number,dx:number,step:number,modifiers:{shiftKey?:boolean;altKey?:boolean},min=-1e6,max=1e6){
 if(![value,dx,step,min,max].every(Number.isFinite)||step<=0||min>max)throw Error('Invalid numeric scrub range.');
 const speed=modifiers.altKey?.1:modifiers.shiftKey?10:1,next=value+dx*step*speed;
 if(!Number.isFinite(next))throw Error('The numeric value is out of range.');
 return Number(Math.min(max,Math.max(min,next)).toFixed(6));
}
