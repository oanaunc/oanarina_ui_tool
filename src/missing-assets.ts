import {effectiveStrokeWidth} from './edge-strokes';
import {validateSurfaceSource} from './surface-paint';
import type {DesignNode} from './model';
import type {Matrix} from './transforms';
import {identity,multiply,nodeMatrix} from './transforms';
export const MISSING_ASSET_LIMITS={layers:20_000,depth:256,paints:50_000,images:512,sourceBytes:64_000_000,imageBytes:20_000_000} as const;
export type EmbeddedImageState='missing'|'invalid'|'unknown'|'ready'|'broken';
export function embeddedImageState(source:unknown):EmbeddedImageState {
 if(source===undefined||source===null||source==='')return 'missing';if(typeof source!=='string'||source.length>28_000_000)return 'invalid';
 const m=/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,([A-Za-z0-9+/]*={0,2})$/.exec(source);if(!m||m[2].length%4)return 'invalid';const data=m[2],bytes=data.length/4*3-(data.endsWith('==')?2:data.endsWith('=')?1:0);if(!bytes)return 'missing';if(bytes>MISSING_ASSET_LIMITS.imageBytes)return 'invalid';
 try{const head=atob(data.slice(0,Math.min(48,data.length)));if(m[1]==='png'&&!head.startsWith('\x89PNG\r\n\x1a\n')||m[1]==='jpeg'&&!head.startsWith('\xff\xd8\xff')||m[1]==='webp'&&(!head.startsWith('RIFF')||head.slice(8,12)!=='WEBP')||m[1]==='gif'&&!/^GIF8[79]a/.test(head))return 'invalid';}catch{return 'invalid';}
 return 'unknown';
}
export function assetDiagnosticMessage(state:EmbeddedImageState){return state==='missing'?'Image source missing':state==='invalid'?'Embedded image data invalid or beyond the 20 MB diagnostic limit':state==='broken'?'Embedded image could not be decoded':state==='ready'?'Embedded image decoded':'Image decode not confirmed';}
export function imageAssetKey(nodeId:string,role:'fill'|'stroke'|'empty',paintId:string){return JSON.stringify([nodeId,role,paintId]);}
export interface ImageAssetRow {key:string;nodeId:string;role:'fill'|'stroke'|'empty';source?:string;state:EmbeddedImageState;active:boolean;matrix:Matrix;width:number;height:number;name:string;maskSource:boolean;}
/** Read-only diagnostics use authored boxes, not ink bounds, and never enter compositing. */
export function imageAssetIndex(nodes:DesignNode[]){
 if(nodes.length>MISSING_ASSET_LIMITS.layers)throw Error('Image diagnostics support up to 20,000 page layers.');const map=new Map(nodes.map(n=>[n.id,n])),states=new Map<string,{matrix:Matrix;visible:boolean;depth:number;boolean:boolean;maskSource:boolean}>();if(map.size!==nodes.length)throw Error('Image diagnostics require unique layer identities.');
 for(const start of nodes){if(states.has(start.id))continue;const trail:DesignNode[]=[],seen=new Set<string>();let n:DesignNode|undefined=start;while(n&&!states.has(n.id)){if(seen.has(n.id)||trail.length>=256)throw Error('Image diagnostics require an acyclic hierarchy of at most 256 levels.');seen.add(n.id);trail.push(n);if(n.parentId&&!map.has(n.parentId))throw Error('Image diagnostics ancestor is unavailable.');n=n.parentId?map.get(n.parentId):undefined;}
 let base=n?states.get(n.id):undefined;for(const at of trail.reverse()){const depth=(base?.depth??0)+1;if(depth>256)throw Error('Image diagnostics support at most 256 ancestor levels.');const matrix=multiply(base?.matrix??identity,nodeMatrix(at,at.parentId?map.get(at.parentId):undefined));if(!matrix.every(Number.isFinite))throw Error('Image diagnostic transforms exceed safe bounds.');const next={matrix,visible:at.visible&&at.opacity>0&&(base?.visible??true)&&!base?.boolean,depth,boolean:!!at.booleanOp||!!base?.boolean,maskSource:!!at.mask||!!base?.maskSource};states.set(at.id,next);base=next;}}
 const keys=new Set<string>(),rows:ImageAssetRow[]=[],checked=new Map<string,EmbeddedImageState>();let paintCount=0,sourceBytes=0;
 const add=(n:DesignNode,role:ImageAssetRow['role'],id:string,source:string|undefined,active:boolean)=>{if(rows.length>=512)throw Error('Image diagnostics support up to 512 image sources per page.');const key=imageAssetKey(n.id,role,id);if(keys.has(key))throw Error('Image diagnostics require unique paint identities.');keys.add(key);if(source&&!checked.has(source)){sourceBytes+=source.length;if(sourceBytes>64_000_000)throw Error('Image diagnostics exceed the 64 MB source-text scan budget.');checked.set(source,embeddedImageState(source));}const state=source?checked.get(source)!:'missing',at=states.get(n.id)!;rows.push({key,nodeId:n.id,role,source,state,active:active&&at.visible&&n.type!=='slice',matrix:at.matrix,width:n.width,height:n.height,name:n.name,maskSource:at.maskSource});};
 for(const n of nodes){if(n.media){add(n,'fill','video-poster',n.media.poster,true);continue;}if(n.paints!==undefined){for(const p of n.paints){if(++paintCount>50_000)throw Error('Image diagnostics exceed the 50,000-paint scan budget.');if(p.surface?.kind==='pattern'||p.surface?.kind==='noise'){validateSurfaceSource(p.surface);continue;}if(p.type==='image')add(n,'fill',p.id,p.image,p.visible&&p.opacity>0);}}else if(n.type==='image')add(n,n.image?'fill':'empty','legacy-image',n.image||undefined,true);
 for(const s of n.strokes??[]){if(++paintCount>50_000)throw Error('Image diagnostics exceed the 50,000-paint scan budget.');if(s.paint.surface?.kind==='pattern'||s.paint.surface?.kind==='noise'){validateSurfaceSource(s.paint.surface);continue;}if(s.paint.type==='image')add(n,'stroke',s.id,s.paint.image,s.visible&&effectiveStrokeWidth(s,n)>0&&s.paint.visible&&s.paint.opacity>0);}}
 return rows;
}
