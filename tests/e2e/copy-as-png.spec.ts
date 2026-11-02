import {test,expect} from '@playwright/test';
import {blankDocument,node} from '../../src/model';
import {readFileSync} from 'node:fs';
import {exportSelection,visualBounds} from '../../src/transforms';

async function fixture(page:any,doc:any,bridge=false){
 const writes:any[]=[],saves:string[]=[];let allowed=true;
 await page.exposeFunction('pngTestWrite',(value:any)=>{writes.push(value);return allowed;});await page.exposeFunction('pngTestSave',(value:string)=>{saves.push(value);return true;});
 if(bridge){const raw=readFileSync('macos/main.swift','utf8').match(/static let bridge=#"""([\s\S]*?)"""#/)![1].replaceAll('__FORMA_CLIPBOARD_NONCE__','private-png-test-nonce');await page.addInitScript({content:`window.pngCalls=[];window.webkit={messageHandlers:{studio:{postMessage:async body=>{window.pngCalls.push(body.type);if(body.type==='bootstrap')return {kind:'file',raw:${JSON.stringify(JSON.stringify(doc))}};if(body.type==='fonts')return [];if(body.type==='clipboardWrite')return window.pngTestWrite(body.representations);return true;}}}};${raw}`});}
 else await page.addInitScript((raw:string)=>{const w=window as any;let command:any;w.desktop={bootstrap:async()=>({kind:'file',raw}),ready:async()=>true,reportDocument:async()=>true,onCommand:(fn:any)=>{command=fn;w.pngNativeCommand=(id:string)=>command(id);return()=>{};},onDocument:()=>()=>{},fonts:async()=>[],save:async(_name:string,value:string)=>w.pngTestSave(value),beginClipboard:(e:Event,id:string)=>{if(!e.isTrusted||e.eventPhase===0)throw Error('Untrusted PNG command');w.lastPngGesture=id;},clipboardWrite:(value:any)=>w.pngTestWrite(value)};},JSON.stringify(doc));
 await page.goto('/');await expect(page.locator('.layer-row')).toHaveCount(doc.pages[0].nodes.length);
 return {writes,saves,setAllowed:(value:boolean)=>allowed=value};
}
function artwork(width=20,height=10){const d=blankDocument();d.pages[0].nodes=[node('ellipse',{name:'Transparent red',width,height,x:100,y:80,fill:'#ff0000',opacity:.5,stroke:'',strokeWidth:0})];return d;}
async function select(page:any){await page.locator('.layer-row').first().click();await page.locator('svg.canvas').focus();}
async function holdImage(page:any){await page.evaluate(()=>{const NativeImage=window.Image;(window as any).Image=function(){const image=new NativeImage();(window as any).Image=NativeImage;Object.defineProperty(image,'onload',{set(callback){image.addEventListener('load',()=>{(window as any).pngRenderWaiting=true;(window as any).releasePngRender=()=>callback.call(image,new Event('load'));});}});return image;};(window as any).pngRenderWaiting=false;});}

test('Shift Command C copies a real 2× transparent PNG without editing the project, and editor menu/action paths are reachable',async({page})=>{
 const doc=artwork(),f=await fixture(page,doc);await select(page);await page.keyboard.press('Meta+s');await expect.poll(()=>f.saves.length).toBe(1);const before=f.saves[0];
 await page.keyboard.press('Meta+Shift+c');await expect.poll(()=>f.writes.length).toBe(1);expect(Object.keys(f.writes[0])).toEqual(['png']);
 const decoded=await page.evaluate(async(data:string)=>{const image=new Image();image.src=data;await image.decode();const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);return {width:c.width,height:c.height,corner:[...ctx.getImageData(0,0,1,1).data],center:[...ctx.getImageData(20,10,1,1).data]};},f.writes[0].png);
 expect(decoded.width).toBe(40);expect(decoded.height).toBe(20);expect(decoded.corner[3]).toBe(0);expect(decoded.center[0]).toBe(255);expect(decoded.center[3]).toBeGreaterThanOrEqual(127);expect(decoded.center[3]).toBeLessThanOrEqual(129);
 await page.keyboard.press('Meta+z');await expect(page.locator('.layer-row')).toHaveCount(1);await page.keyboard.press('Meta+s');await expect.poll(()=>f.saves.length).toBe(2);expect(f.saves[1]).toBe(before);
 await page.getByRole('menuitem',{name:'Edit',exact:true}).click();await page.getByRole('menuitem',{name:/^Copy as PNG/}).click();await expect.poll(()=>f.writes.length).toBe(2);
 await page.locator('svg.canvas').focus();await page.keyboard.press('Meta+k');await page.getByRole('combobox',{name:'Search actions',exact:true}).fill('Copy as PNG');await page.keyboard.press('Enter');await expect.poll(()=>f.writes.length).toBe(3);
});

test('PNG copy uses existing transformed selection, ancestor clipping and real sibling mask coverage',async({page})=>{
 const doc=blankDocument(),parent=node('frame',{name:'Clipped rotated owner',x:100,y:100,width:100,height:100,rotation:90,clip:true,fill:'#0000ff'}),mask=node('ellipse',{name:'Mask',parentId:parent.id,x:120,y:120,width:20,height:20,fill:'#000000',mask:{mode:'vector'}}),art=node('rectangle',{name:'Masked target',parentId:parent.id,x:120,y:120,width:50,height:40,fill:'#ff0000'}),unrelated=node('rectangle',{name:'Unselected',x:500,y:500,width:40,height:40,fill:'#00ff00'});doc.pages[0].nodes=[parent,mask,art,unrelated];
 const bounds=visualBounds(exportSelection(doc.pages[0].nodes,[art.id])),f=await fixture(page,doc);await page.locator(`[data-layer-id="${art.id}"]`).click();await page.locator('svg.canvas').focus();await page.keyboard.press('Meta+Shift+c');await expect.poll(()=>f.writes.length).toBe(1);
 const pixels=await page.evaluate(async(data:string)=>{const image=new Image();image.src=data;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);const values=ctx.getImageData(0,0,canvas.width,canvas.height).data;let opaque=0,blue=0,green=0,transparent=0;for(let i=0;i<values.length;i+=4){if(values[i+3]===0)transparent++;else{if(values[i+3]>240)opaque++;if(values[i+2]>100)blue++;if(values[i+1]>100)green++;}}return{width:canvas.width,height:canvas.height,opaque,blue,green,transparent};},f.writes[0].png);
 expect(pixels.width).toBe(Math.ceil(bounds.width*2));expect(pixels.height).toBe(Math.ceil(bounds.height*2));expect(pixels.width).toBe(40);expect(pixels.opaque).toBeGreaterThan(500);expect(pixels.opaque).toBeLessThan(1600);expect(pixels.transparent).toBeGreaterThan(100);expect(pixels.blue).toBe(0);expect(pixels.green).toBe(0);
});

test('Escape/selection changes cancel a render before the clipboard write and a newer normal Copy cannot lose its grant',async({page})=>{
 const f=await fixture(page,artwork());await select(page);await holdImage(page);await page.keyboard.press('Meta+Shift+c');await expect.poll(()=>page.evaluate(()=>(window as any).pngRenderWaiting)).toBe(true);await page.keyboard.press('Escape');await page.evaluate(()=>(window as any).releasePngRender());await expect(page.locator('.toast')).toContainText('PNG copy cancelled');expect(f.writes).toHaveLength(0);
 await select(page);await holdImage(page);await page.keyboard.press('Meta+Shift+c');await expect.poll(()=>page.evaluate(()=>(window as any).pngRenderWaiting)).toBe(true);await page.keyboard.press('Meta+c');await expect.poll(()=>f.writes.length).toBe(1);expect(f.writes[0]).toHaveProperty('nodes');await page.evaluate(()=>(window as any).releasePngRender());await expect(page.locator('.toast')).toContainText('PNG copy cancelled');expect(f.writes).toHaveLength(1);await expect(page.locator('.layer-row')).toHaveCount(1);
});

test('an editable focus transition cancels an older PNG even after blur, without touching the system clipboard',async({page})=>{
 const f=await fixture(page,artwork());await select(page);
 for(const kind of ['input','textarea','contenteditable']){
  await holdImage(page);await page.keyboard.press('Meta+Shift+c');await expect.poll(()=>page.evaluate(()=>(window as any).pngRenderWaiting)).toBe(true);
  await page.evaluate((kind:string)=>{const field=document.createElement(kind==='contenteditable'?'div':kind);if(kind==='contenteditable')field.contentEditable='true';document.body.append(field);field.focus();(document.querySelector('svg.canvas') as SVGElement).focus();field.remove();},kind);
  await page.evaluate(()=>(window as any).releasePngRender());await expect(page.locator('.toast')).toContainText('editing focus changed');expect(f.writes).toHaveLength(0);
 }
 await page.keyboard.press('Meta+Shift+c');await expect.poll(()=>f.writes.length).toBe(1);
});

test('document/page changes during rendering cancel PNG without writing or adding image artwork',async({page})=>{
 const f=await fixture(page,artwork());await select(page);await holdImage(page);await page.keyboard.press('Meta+Shift+c');await expect.poll(()=>page.evaluate(()=>(window as any).pngRenderWaiting)).toBe(true);await page.getByRole('spinbutton',{name:'W',exact:true}).fill('30');await page.getByRole('spinbutton',{name:'W',exact:true}).press('Enter');await page.evaluate(()=>(window as any).releasePngRender());await expect(page.locator('.toast')).toContainText('PNG copy cancelled');expect(f.writes).toHaveLength(0);
 await select(page);await holdImage(page);await page.keyboard.press('Meta+Shift+c');await expect.poll(()=>page.evaluate(()=>(window as any).pngRenderWaiting)).toBe(true);await page.getByRole('button',{name:'Add page',exact:true}).click();await page.evaluate(()=>(window as any).releasePngRender());await expect(page.locator('.toast')).toContainText('PNG copy cancelled');expect(f.writes).toHaveLength(0);await expect(page.locator('.layer-row')).toHaveCount(0);
});

for(const [width,height] of [[4097,1],[2001,2000]])test(`oversize ${width}×${height} selection refuses before decoder allocation`,async({page})=>{
 const f=await fixture(page,artwork(width,height));await select(page);await page.evaluate(()=>{(window as any).pngImageAllocations=0;(window as any).Image=function(){(window as any).pngImageAllocations++;throw Error('Should not allocate');};});await page.keyboard.press('Meta+Shift+c');await expect(page.locator('.toast')).toContainText('8192 pixels per side and 16 million pixels');expect(await page.evaluate(()=>(window as any).pngImageAllocations)).toBe(0);expect(f.writes).toHaveLength(0);
});

test('encoded-size and failed native writes leave artwork and pasteboard unchanged',async({page})=>{
 const f=await fixture(page,artwork());await select(page);await page.evaluate(()=>{const original=HTMLCanvasElement.prototype.toBlob;(window as any).restorePngBlob=()=>HTMLCanvasElement.prototype.toBlob=original;HTMLCanvasElement.prototype.toBlob=function(callback){callback(new Blob([new Uint8Array(15_000_000)],{type:'image/png'}));};});await page.keyboard.press('Meta+Shift+c');await expect(page.locator('.toast')).toContainText('20 MB encoded clipboard limit');expect(f.writes).toHaveLength(0);await page.evaluate(()=>(window as any).restorePngBlob());f.setAllowed(false);await page.keyboard.press('Meta+Shift+c');await expect(page.locator('.toast')).toContainText('Mac clipboard was not updated');expect(f.writes).toHaveLength(1);await expect(page.locator('.layer-row')).toHaveCount(1);await page.keyboard.press('Meta+z');await expect(page.locator('.layer-row')).toHaveCount(1);
});

test('shipped grant bridge refuses untrusted/ungranted/expired/replayed PNG writes',async({page})=>{
 const f=await fixture(page,artwork(),true);await select(page);
 expect(await page.evaluate(async()=>{try{await(window as any).desktop.clipboardWrite({png:'data:image/png;base64,AAAA'});return false;}catch{return true;}})).toBe(true);
 expect(await page.evaluate(()=>{try{(window as any).desktop.beginClipboard(new MouseEvent('click'),'copy-as-png');return false;}catch{return true;}})).toBe(true);expect(f.writes).toHaveLength(0);
 await holdImage(page);await page.keyboard.press('Meta+Shift+c');await expect.poll(()=>page.evaluate(()=>(window as any).pngRenderWaiting)).toBe(true);await page.waitForTimeout(2100);await page.evaluate(()=>(window as any).releasePngRender());await expect(page.locator('.toast')).toContainText('explicit Copy, Cut or Paste');expect(f.writes).toHaveLength(0);
 await page.keyboard.press('Meta+Shift+c');await expect.poll(()=>f.writes.length).toBe(1);expect(Object.keys(f.writes[0])).toEqual(['png']);expect(await page.evaluate(async()=>{try{await(window as any).desktop.clipboardWrite({png:'again'});return false;}catch{return true;}})).toBe(true);expect(f.writes).toHaveLength(1);
});

test('browser Copy as PNG is explicit about native-only support and editable fields keep their shortcut',async({page})=>{
 await page.addInitScript(()=>localStorage.clear());await page.goto('/');await page.getByRole('menuitem',{name:'Edit',exact:true}).click();await page.getByRole('menuitem',{name:/^Copy as PNG/}).click();await expect(page.locator('.toast')).toContainText(/Mac app|Select artwork/);
 const f=await fixture(page,artwork());await select(page);const width=page.getByRole('spinbutton',{name:'W',exact:true});await width.focus();await page.keyboard.press('Meta+Shift+c');await page.waitForTimeout(50);expect(f.writes).toHaveLength(0);
});
