import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {blankDocument} from '../../src/model';

/** The Mac shell's real Finder path is covered by --acceptance-smoke-test; this covers the shared routing in Chromium. */
const PNG='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const BMP='Qk06AAAAAAAAADYAAAAoAAAAAQAAAAEAAAABABgAAAAAAAQAAAATCwAAEwsAAAAAAAAAAAAAAAD/AA==';
function fixture(){const d=blankDocument();d.id='file-drop';d.name='Drops';d.fonts=[];return d;}
async function boot(page:Page){await page.addInitScript(d=>{if(!localStorage.getItem('oui-active'))localStorage.setItem('oui-active',JSON.stringify(d));localStorage.removeItem('oui-preferences');},fixture());await page.goto('/');await expect(page.getByRole('menubar')).toBeVisible();await page.waitForFunction(async()=>{const{useEditor}=await import('/src/store.ts');return useEditor.getState().doc.id==='file-drop';});}
async function drop(page:Page,files:{name:string;type:string;base64:string}[],x:number,y:number){await page.evaluate(({files,x,y})=>{const transfer=new DataTransfer();for(const f of files)transfer.items.add(new File([Uint8Array.from(atob(f.base64),c=>c.charCodeAt(0))],f.name,{type:f.type}));document.querySelector('[data-canvas]')!.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:transfer,clientX:x,clientY:y}));},{files,x,y});}
const nodes=(page:Page)=>page.evaluate(async()=>{const{useEditor}=await import('/src/store.ts'),s=useEditor.getState();return {nodes:s.doc.pages[0].nodes.map(n=>({name:n.name,x:n.x,y:n.y,width:n.width,height:n.height})),zoom:s.zoom,pan:s.pan,past:s.past.length};});
const center=async(page:Page)=>{const box=(await page.locator('#forma-design-canvas').boundingBox())!;return {x:Math.round(box.x+box.width/2),y:Math.round(box.y+box.height/2),box};};

test('a dropped image lands under the pointer in one Undo',async({page})=>{await boot(page);const at=await center(page),before=await nodes(page);await drop(page,[{name:'One.png',type:'image/png',base64:PNG}],at.x,at.y);await expect.poll(async()=>(await nodes(page)).nodes.length).toBe(1);const after=await nodes(page),n=after.nodes[0];expect(n.name).toBe('One.png');expect(n.x).toBeCloseTo(Math.round((at.x-at.box.x-before.pan.x)/before.zoom-.5),0);expect(n.y).toBeCloseTo(Math.round((at.y-at.box.y-before.pan.y)/before.zoom-.5),0);await page.keyboard.press('Meta+z');await expect.poll(async()=>(await nodes(page)).nodes.length).toBe(0);});

test('a batch fans out from the drop point and an embedded-unsupported format converts to PNG',async({page})=>{await boot(page);const at=await center(page);await drop(page,[{name:'A.png',type:'image/png',base64:PNG},{name:'B.bmp',type:'image/bmp',base64:BMP}],at.x,at.y);await expect.poll(async()=>(await nodes(page)).nodes.length).toBe(2);const list=(await nodes(page)).nodes;expect(list.map(n=>n.name)).toEqual(['A.png','B.png']);expect(list[1].x-list[0].x).toBe(24);});

test('a document mixed into a batch is refused and changes nothing',async({page})=>{await boot(page);const at=await center(page);await drop(page,[{name:'A.png',type:'image/png',base64:PNG},{name:'B.oui',type:'application/json',base64:btoa('{}')}],at.x,at.y);await expect(page.getByRole('status').getByText('at a time').first()).toBeVisible();expect((await nodes(page)).nodes).toHaveLength(0);});

test('a malformed conversion candidate reports its name and changes nothing',async({page})=>{await boot(page);const at=await center(page);await drop(page,[{name:'Broken.tiff',type:'image/tiff',base64:btoa('not an image')}],at.x,at.y);await expect(page.getByRole('status').getByText('could not decode Broken.tiff').first()).toBeVisible();expect((await nodes(page)).nodes).toHaveLength(0);});
