/** Synthetic decoded .fig records written for these tests. No record comes from a user file. */
export const id=(n:number)=>({sessionID:1,localID:n});
export const solid=(r=1,g=0,b=0,a=1)=>({type:'SOLID',color:{r,g,b,a},visible:true,opacity:1});
export const at=(x=0,y=0)=>({m00:1,m01:0,m02:x,m10:0,m11:1,m12:y});
export const raw=(type:string,n:number,parent=2,extra:Record<string,unknown>={})=>({guid:id(n),phase:'CREATED',type,parentIndex:{guid:id(parent),position:String(n).padStart(4,'0')},name:type+' '+n,size:{x:20,y:20},transform:at(),fillPaints:[],...extra});
export const scene=(nodes:unknown[],blobs:unknown[]=[],images:Record<string,Uint8Array>={})=>({message:{nodeChanges:[{guid:id(1),type:'DOCUMENT'},raw('CANVAS',2,1,{name:'Page'}),...nodes],blobs},images});
const u32=(v:number)=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
const f32=(v:number)=>{const b=new ArrayBuffer(4);new DataView(b).setFloat32(0,v,true);return [...new Uint8Array(b)];};
export function commands(ops:[number,number[]][]){const out:number[]=[];for(const [op,values] of ops){out.push(op);for(const value of values)out.push(...f32(value));}return Uint8Array.from(out);}
export function network(vertices:[number,number][],segments:[number,number,number,number,number,number,number?][],regions:number[][][]=[]){
 const out=[...u32(vertices.length),...u32(segments.length),...u32(regions.length)];
 for(const [x,y] of vertices)out.push(...u32(0),...f32(x),...f32(y));
 for(const [start,sx,sy,end,ex,ey,style=0] of segments)out.push(...u32(style),...u32(start),...f32(sx),...f32(sy),...u32(end),...f32(ex),...f32(ey));
 for(const loops of regions){out.push(...u32(1),...u32(loops.length));for(const loop of loops){out.push(...u32(loop.length));for(const s of loop)out.push(...u32(s));}}
 return Uint8Array.from(out);
}
