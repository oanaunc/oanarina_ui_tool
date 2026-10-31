/** A strict reader for one Yjs v1 update, used only to look for document text. Whether spec blocks store Yjs at all is an assumption:
 * the bytes must parse exactly to the end or this returns nothing. Output is a plain tree for the same classifier as other sources. */
export interface CrdtNode {type:string;attrs:Record<string,unknown>;content:(CrdtNode|{text:string})[];}
interface Id {client:number;clock:number;}
interface Unit {id:string;origin?:string;right?:string;parentKey?:string;parentId?:string;sub?:string;char?:string;value?:unknown;typed?:{ref:number;name?:string};deleted?:boolean;next?:Unit;parent?:string;}
const LIMIT={units:2_000_000,clients:10_000,passes:10_000,depth:64};
const key=(id:Id)=>id.client+':'+id.clock;
class Reader {
 at=0;constructor(readonly bytes:Uint8Array){}
 u8(){if(this.at>=this.bytes.length)throw Error('Truncated');return this.bytes[this.at++];}
 uint(){let out=0,scale=1;for(let i=0;i<8;i++){const b=this.u8();out+=(b&127)*scale;if(b<128)return out;scale*=128;}throw Error('Oversized integer');}
 raw(size:number){if(size>this.bytes.length-this.at)throw Error('Truncated');const out=this.bytes.subarray(this.at,this.at+size);this.at+=size;return out;}
 string(){return new TextDecoder('utf-8',{fatal:true}).decode(this.raw(this.uint()));}
 id():Id{return {client:this.uint(),clock:this.uint()};}
 any(depth=0):unknown{if(depth>LIMIT.depth)throw Error('Too deep');const tag=this.u8();if(tag===127)return undefined;if(tag===126)return null;if(tag===125){const b=this.u8();let out=b&63,scale=64;const negative=!!(b&64);if(b>=128)for(;;){const c=this.u8();out+=(c&127)*scale;scale*=128;if(c<128)break;}return negative?-out:out;}if(tag===124){this.raw(4);return 0;}if(tag===123){this.raw(8);return 0;}if(tag===122){this.raw(8);return 0;}if(tag===121)return false;if(tag===120)return true;if(tag===119)return this.string();if(tag===118){const out:Record<string,unknown>={},size=this.uint();for(let i=0;i<size;i++){const k=this.string();out[k]=this.any(depth+1);}return out;}if(tag===117){const size=this.uint();if(size>100_000)throw Error('Too long');return Array.from({length:size},()=>this.any(depth+1));}if(tag===116)return this.raw(this.uint());throw Error('Unknown value');}
 done(){return this.at===this.bytes.length;}
}
const TYPE_NAMES=['array','map','text','element','fragment','hook','xmltext'];
function json(text:string){if(text==='undefined')return undefined;try{return JSON.parse(text) as unknown;}catch{return text;}}
/** Each Item becomes one unit per character, so an origin that points inside an earlier string still has a place to attach. */
function readUnits(r:Reader){
 const units:Unit[]=[],clients=r.uint();if(!clients||clients>LIMIT.clients)throw Error('Not an update');
 const push=(u:Unit)=>{if(units.length>=LIMIT.units)throw Error('Too large');units.push(u);};
 for(let c=0;c<clients;c++){
  const count=r.uint(),client=r.uint();let clock=r.uint();if(count>LIMIT.units)throw Error('Too large');
  for(let i=0;i<count;i++){
   const info=r.u8(),ref=info&31;if(ref===0||ref===10){clock+=r.uint();continue;}
   const hasOrigin=!!(info&128),hasRight=!!(info&64),origin=hasOrigin?key(r.id()):undefined,right=hasRight?key(r.id()):undefined;let parentKey:string|undefined,parentId:string|undefined,sub:string|undefined;
   if(!hasOrigin&&!hasRight){if(r.uint()===1)parentKey=r.string();else parentId=key(r.id());if(info&32)sub=r.string();}
   const base={origin,right,parentKey,parentId,sub},place=(extra:Partial<Unit>,size=1)=>{let left=origin;for(let n=0;n<size;n++){const id=client+':'+(clock+n);push({...base,...(n?{parentKey:undefined,parentId:undefined,right:undefined}:{}),origin:left,id,...extra});left=id;}clock+=size;};
   if(ref===1)place({deleted:true},r.uint());
   else if(ref===2){const size=r.uint();for(let n=0;n<size;n++)place({value:json(r.string())});}
   else if(ref===3){r.raw(r.uint());place({});}
   else if(ref===4){const text=r.string();for(let n=0;n<text.length;n++){const id=client+':'+clock;push({...base,...(n?{parentKey:undefined,parentId:undefined,right:undefined,origin:client+':'+(clock-1)}:{}),id,char:text[n]});clock++;}}
   else if(ref===5){json(r.string());place({});}
   else if(ref===6){r.string();r.string();place({});}
   else if(ref===7){const type=r.uint();if(type>6)throw Error('Unknown type');place({typed:{ref:type,...(type===3||type===5?{name:r.string()}:{})}});}
   else if(ref===8){const size=r.uint();for(let n=0;n<size;n++)place({value:r.any()});}
   else if(ref===9){r.string();r.any();place({});}
   else throw Error('Unknown content');
  }
 }
 const deletes=r.uint();for(let c=0;c<deletes;c++){const client=r.uint(),ranges=r.uint();for(let i=0;i<ranges;i++){const clock=r.uint(),size=r.uint();if(size>LIMIT.units)throw Error('Too large');for(const u of units)if(u.id.startsWith(client+':')){const at=Number(u.id.slice(u.id.indexOf(':')+1));if(at>=clock&&at<clock+size)u.deleted=true;}}}
 if(!r.done())throw Error('Trailing data');return units;
}
export function readCrdtDocument(bytes:Uint8Array):CrdtNode[]|undefined{
 try{
  const units=readUnits(new Reader(bytes));if(!units.length)return;const byId=new Map(units.map(u=>[u.id,u])),heads=new Map<string,Unit>(),keyed=new Map<string,Map<string,Unit>>();
  let pending=units,passes=0;
  while(pending.length){
   if(++passes>LIMIT.passes)return;const later:Unit[]=[];
   for(const u of pending){
    const from=u.origin?byId.get(u.origin):u.right?byId.get(u.right):undefined;if((u.origin||u.right)&&!from)return;
    const parent=u.parentKey!==undefined?'root:'+u.parentKey:u.parentId??from?.parent;if(parent===undefined||from&&from.parent===undefined){later.push(u);continue;}
    u.parent=parent;u.sub??=from?.sub;
    if(u.sub!==undefined){const map=keyed.get(parent)??new Map<string,Unit>();map.set(u.sub,u);keyed.set(parent,map);}
    else if(u.origin){const left=byId.get(u.origin)!;u.next=left.next;left.next=u;}
    else{u.next=heads.get(parent);heads.set(parent,u);}
   }
   if(later.length===pending.length)return;pending=later;
  }
  const seen=new Set<string>();
  const build=(id:string,type:{ref:number;name?:string},depth:number):CrdtNode=>{if(depth>LIMIT.depth||seen.has(id))throw Error('Too deep');seen.add(id);const attrs:Record<string,unknown>={};for(const [name,u] of keyed.get(id)??[])if(!u.deleted&&u.value!==undefined)attrs[name]=u.value;const content:CrdtNode['content']=[];let text='';const flush=()=>{if(text)content.push({text});text='';};for(let u=heads.get(id);u;u=u.next){if(u.deleted)continue;if(u.char!==undefined)text+=u.char;else if(u.typed){flush();content.push(build(u.id,u.typed,depth+1));}}flush();return {type:type.name??String(attrs.__type??TYPE_NAMES[type.ref]),attrs,content};};
  const roots=[...new Set([...heads.keys(),...keyed.keys()])].filter(k=>k.startsWith('root:')).map(k=>build(k,{ref:4},0));return roots.length?roots:undefined;
 }catch{return;}
}
