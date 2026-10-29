import {exportSelection,visualBounds} from './transforms';
import {sampleMotion} from './motion';
import {insertInstance} from './components-model';
import {renderToStaticMarkup} from 'react-dom/server';
import {assetsForUsage,fontCssForUsage,projectFontUsage,textFontUsage} from './fonts';
import {serializeFontDocument} from './font-data';
import {Artwork} from './components/Artwork';
import {LayoutGuideOverlay} from './components/LayoutGuides';
import {node,parseDocument} from './model';
import type {DesignNode} from './model';
import {currentPage,useEditor} from './store';
declare global { interface Window {desktop?:{save:(name:string,data:string,base64?:boolean,saveAs?:boolean)=>Promise<boolean>;open:()=>Promise<string|null>;onCommand:(fn:(id:string)=>void)=>()=>void;fonts?:()=>Promise<string[]>;onDocument:(fn:(raw:string)=>void)=>()=>void;};} }
export async function download(name:string,data:string|Blob,mime='text/plain',saveAs=false){
 if(window.desktop){const b=typeof data==='string'?data:await data.arrayBuffer().then(b=>{let s='';new Uint8Array(b).forEach(v=>s+=String.fromCharCode(v));return btoa(s);});return window.desktop.save(name,b,typeof data!=='string',saveAs);}
 const url=URL.createObjectURL(typeof data==='string'?new Blob([data],{type:mime}):data);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);return true;
}
export function serializedProject(){const s=useEditor.getState();return serializeFontDocument(s.doc,assetsForUsage(projectFontUsage(s.doc),s.doc.fonts));}
export async function saveProject(saveAs=false){try{const s=useEditor.getState();if(await download(s.doc.name+'.oui',serializedProject(),'application/json',saveAs))s.set({savedAt:s.doc.updatedAt,toast:'Project saved'});}catch(e){notifyError(e);}}
export function notifyError(e:unknown){useEditor.getState().set({toast:e instanceof Error?e.message:'Something went wrong.'});}
export async function openProject(){try{if(window.desktop){const raw=await window.desktop.open();if(raw)useEditor.getState().load(parseDocument(raw));}else pickFile('.oui,.json',async files=>useEditor.getState().load(parseDocument(await files[0].text())));}catch(e){notifyError(e);}}
export function pickFile(accept:string,fn:(files:File[])=>void|Promise<void>){const input=document.createElement('input');input.type='file';input.accept=accept;input.multiple=accept.includes('image');input.hidden=true;document.body.appendChild(input);input.onchange=()=>{const files=[...(input.files??[])];input.remove();if(files.length)Promise.resolve(fn(files)).catch(notifyError);};input.addEventListener('cancel',()=>input.remove(),{once:true});input.click();}
export function exportSvg(nodes:DesignNode[],viewport?:{x:number;y:number;width:number;height:number},includeGuides=false){const b=viewport??visualBounds(nodes);return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(b.width)}" height="${Math.ceil(b.height)}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}"><style>${fontCssForUsage(textFontUsage(nodes),useEditor.getState().doc.fonts)}</style>${renderToStaticMarkup(<><Artwork nodes={nodes} hyperlinks/>{includeGuides&&<LayoutGuideOverlay nodes={nodes}/>}</>)}</svg>`;}
export function exportNodes(){const s=useEditor.getState(),page=currentPage(),ns=s.motionOpen?sampleMotion(page.nodes,page.motion,s.motionTime):page.nodes;return exportSelection(ns,s.selection);}
export async function exportArtwork(format:'svg'|'png'|'jpg',scale=1,includeGuides=false){
 try{const s=useEditor.getState(),ns=exportNodes();if(!ns.length){s.set({toast:'Add a layer before exporting.'});return;}const b=visualBounds(ns),svg=exportSvg(ns,undefined,includeGuides),name=(ns.length===1?ns[0].name:s.doc.name);
 if(format==='svg'){await download(name+'.svg',svg,'image/svg+xml');return;}
 if(b.width*scale>16384||b.height*scale>16384||b.width*b.height*scale*scale>80_000_000)throw Error('Export is too large. Use a smaller scale or select fewer layers.');
 const image=new Image(),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 try{await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('Image export failed.'));image.src=url;});const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(b.width*scale));canvas.height=Math.max(1,Math.ceil(b.height*scale));const ctx=canvas.getContext('2d')!;if(format==='jpg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Export failed.')),format==='jpg'?'image/jpeg':'image/png',.95));await download(name+'.'+format,blob);}finally{URL.revokeObjectURL(url);}
 }catch(e){notifyError(e);}
}
export async function importImages(files:File[]){for(const file of files){if(file.size>20_000_000)throw Error('Choose an image smaller than 20 MB.');
 if(file.name.toLowerCase().endsWith('.svg')){await importSvg(await file.text(),file.name);continue;}
 if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))throw Error('Choose PNG, JPEG, WebP, GIF or SVG.');
 const data=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result as string);r.onerror=()=>reject(Error('Unable to read image.'));r.readAsDataURL(file);});const img=new Image();await new Promise<void>((resolve,reject)=>{img.onload=()=>resolve();img.onerror=()=>reject(Error('Invalid image.'));img.src=data;});useEditor.getState().add('image',{name:file.name,image:data,x:150,y:150,width:img.width,height:img.height});}}
export async function importSvg(raw:string,name='Imported SVG'){
 const xml=new DOMParser().parseFromString(raw,'image/svg+xml');if(xml.querySelector('parsererror')||xml.documentElement.tagName!=='svg')throw Error('Invalid SVG.');
 // SVG imported as a visual asset. Editable layers use the Figma Bridge instead.
 const allowed=new Set(['svg','g','defs','path','rect','ellipse','circle','line','polyline','polygon','text','tspan','linearGradient','radialGradient','stop','clipPath','mask','filter','feGaussianBlur','feDropShadow','title','desc']);
 for(const el of [...xml.querySelectorAll('*')]){if(!allowed.has(el.tagName)){el.remove();continue;}for(const a of [...el.attributes])if(a.name.startsWith('on')||a.name==='href'||a.name==='xlink:href'||/url\(\s*['"]?(?!#)/i.test(a.value)||a.name==='style'){el.removeAttribute(a.name);}}
 const root=xml.documentElement,viewBox=root.getAttribute('viewBox')?.split(/[ ,]+/).map(Number);const width=parseFloat(root.getAttribute('width')||'')||viewBox?.[2]||500,height=parseFloat(root.getAttribute('height')||'')||viewBox?.[3]||500;
 root.setAttribute('xmlns','http://www.w3.org/2000/svg');root.setAttribute('width',String(width));root.setAttribute('height',String(height));const svg=new XMLSerializer().serializeToString(root);const data='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));
 useEditor.getState().add('image',{name,x:120,y:120,width,height,image:data});
}
export function cssFor(n:DesignNode){return `/* ${n.name.replaceAll('*/','')} */\n.${n.name.toLowerCase().replace(/[^a-z0-9]/g,'-')} {\n  width: ${n.width}px;\n  height: ${n.height}px;\n  ${n.type==='text'?'color':'background'}: ${n.fill};\n  border-radius: ${n.radius}px;${n.stroke?`\n  border: ${n.strokeWidth}px solid ${n.stroke};`:''}${n.opacity<1?`\n  opacity: ${n.opacity};`:''}${n.type==='text'?`\n  font-family: "${n.fontFamily}";\n  font-size: ${n.fontSize}px;\n  font-weight: ${n.fontWeight};\n  line-height: ${n.lineHeight};\n  letter-spacing: ${n.letterSpacing}px;`:''}${n.layout!=='none'?`\n  display: ${n.layout==='grid'?'grid':'flex'};\n  ${n.layout==='grid'?`grid-template-columns: repeat(${n.columns}, 1fr)`:`flex-direction: ${n.layout==='horizontal'?'row':'column'}`};\n  gap: ${n.gap}px;\n  padding: ${n.padding}px;`:''}\n}`;}
export function createInstance(id:string){const s=useEditor.getState();let instance='';try{s.edit(d=>{instance=insertInstance(d,s.pageId,id);});s.set({selection:[instance]});}catch(e){notifyError(e);}}
export const makeNode=node;
