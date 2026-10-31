import {test,expect,devices} from '@playwright/test';
import type {Browser,Download,Page} from '@playwright/test';
import {createServer} from 'node:http';
import type {Server} from 'node:http';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {unzipSync,strFromU8} from 'fflate';
import {blankDocument,node} from '../../src/model';
import {addCollection,addVariable} from '../../src/design-systems';
import {createReaction,defaultTransition} from '../../src/prototype';
const CANARY='CANARYxSECRETxTEXT',PASSWORD='correct horse battery',HOSTILE='</script><img src=x onerror="window.__owned=1">';
function fixture(){
 const d=blankDocument();d.fonts=[];d.name=CANARY+' file';const p=d.pages[0];p.name=CANARY+' page';
 const a=node('frame',{id:'screen-a',name:'First screen',x:0,y:0,width:390,height:700,fill:'#ffffff'}),b=node('frame',{id:'screen-b',name:'Second screen',x:500,y:0,width:390,height:700,fill:'#eef4ff'});
 const go=node('rectangle',{id:'go',parentId:a.id,name:'Go',x:30,y:30,width:300,height:90,fill:'#7755aa',reactions:[{...createReaction('click'),actions:[{id:'nav',type:'navigate',targetId:b.id,transition:defaultTransition()}]}]});
 const collection=addCollection(d,'Runtime'),count=addVariable(d,collection,'string','Label'),mode=d.variableCollections![0].defaultModeId;d.variables!.find(v=>v.id===count)!.values[mode]='Waiting';
 const add=node('rectangle',{id:'set',parentId:b.id,name:'Set',x:530,y:30,width:300,height:90,fill:'#55aa77',reactions:[{...createReaction('click'),actions:[{id:'set-label',type:'set-variable',variableId:count,expression:'"Changed"'}]}]});
 p.nodes=[a,go,node('text',{id:'hostile',parentId:a.id,name:'Hostile text',x:30,y:150,width:330,height:60,text:HOSTILE+' '+CANARY,fontSize:14}),b,add,node('text',{id:'value',parentId:b.id,name:'Value',x:530,y:150,width:300,height:40,text:'Waiting',fontSize:22,variableBindings:{text:count}}),node('rectangle',{id:'scrap',name:CANARY+' scrap',x:1400,y:0})];
 p.comments=[{id:'private',x:5,y:5,text:CANARY+' comment',resolved:false}];return d;
}
async function open(page:Page,d=fixture()){await page.addInitScript(raw=>{const w=window as any;delete w.desktop;w.__seed=raw;},JSON.stringify(d));await page.goto('/');await page.evaluate(async raw=>{const p='/src/store.ts',{useEditor}=await import(p),s=useEditor.getState();s.load(JSON.parse(raw));s.set({home:false,modal:null,selection:[]});},JSON.stringify(d));await page.waitForFunction(async()=>{const p='/src/store.ts',{useEditor}=await import(p);return useEditor.getState().doc.name.includes('CANARY');});}
async function dialog(page:Page){await page.evaluate(()=>window.dispatchEvent(new CustomEvent('command',{detail:'share-prototype'})));await expect(page.getByRole('dialog',{name:'Export prototype file',exact:true})).toBeVisible();}
async function exported(page:Page,download:Promise<Download>){const file=await download,saved=await file.path();const files=unzipSync(new Uint8Array(await fs.readFile(saved!)));return {name:file.suggestedFilename(),html:strFromU8(files['prototype.html']),readme:strFromU8(files['README.txt'])};}
async function plainFile(page:Page){await open(page);await dialog(page);const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save prototype ZIP',exact:true}).click();return exported(page,pending);}
async function protectedFile(page:Page){await open(page);await dialog(page);await page.getByRole('radio',{name:'Only people with a password',exact:true}).check();await page.getByRole('textbox',{name:'Prototype password',exact:true}).fill(PASSWORD);await page.getByRole('textbox',{name:'Repeat prototype password',exact:true}).fill(PASSWORD);const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save prototype ZIP',exact:true}).click();return exported(page,pending);}
/** Bare static server on its own port and origin, unrelated to the app. */
async function host(files:Record<string,string>){const server:Server=createServer((request,response)=>{const body=files[(request.url??'/').split('?')[0].slice(1)];if(body===undefined){response.writeHead(404).end();return;}response.writeHead(200,{'content-type':'text/html; charset=utf-8'}).end(body);});await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};return {origin:'http://127.0.0.1:'+address.port,close:()=>new Promise<void>(resolve=>server.close(()=>resolve()))};}
/** A separate browser context shares nothing with the app: no storage, no service, and every request is recorded. */
async function viewer(browser:Browser,options:Parameters<Browser['newContext']>[0]={}){const context=await browser.newContext(options),page=await context.newPage(),requests:string[]=[],problems:string[]=[];page.on('request',r=>{if(/^(https?|wss?):/.test(r.url()))requests.push(r.url());});page.on('console',m=>{if(m.type()==='error')problems.push(m.text());});page.on('pageerror',e=>problems.push(e.message));return {context,page,requests,problems};}
const art=(page:Page)=>page.locator('svg.prototype-art');
test('a plain export plays with real interactions in a separate context and loads nothing',async({page,browser})=>{
 const file=await plainFile(page);await expect(page.getByRole('dialog').getByRole('status').first()).toContainText('Left out 0 other pages, 1 comments and 1 loose layers');expect(file.html).not.toContain(CANARY+' comment');expect(file.html).not.toContain(CANARY+' scrap');expect(file.html).not.toContain('<img src=x');expect(file.name).toContain('-prototype.zip');expect(file.readme).toContain('no hosted Forma link');
 const server=await host({'p.html':file.html}),{context,page:view,requests,problems}=await viewer(browser);
 try{await view.goto(server.origin+'/p.html');await expect(view.getByRole('dialog',{name:'Prototype presentation',exact:true})).toBeVisible();await expect(art(view)).toHaveAttribute('data-prototype-frame','screen-a');await expect(view.getByRole('button',{name:'Close presentation',exact:true})).toBeHidden();
  await view.locator('[data-node-id="go"]').click();await expect(art(view)).toHaveAttribute('data-prototype-frame','screen-b');await expect(view.locator('[data-node-id="value"]')).toContainText('Waiting');await view.locator('[data-node-id="set"]').click();await expect(view.locator('[data-node-id="value"]')).toContainText('Changed');
  await view.getByRole('button',{name:'Back',exact:true}).click();await expect(art(view)).toHaveAttribute('data-prototype-frame','screen-a');await expect(view.locator('[data-node-id="hostile"]')).toContainText('</script>');
  expect(await view.evaluate(()=>(window as unknown as {__owned?:number}).__owned)).toBeUndefined();expect(requests).toEqual([server.origin+'/p.html']);expect(problems).toEqual([]);
  await view.getByRole('button',{name:'About this prototype',exact:true}).click();await expect(view.getByRole('status')).toContainText('Nothing you do here is saved');
 }finally{await context.close();await server.close();}
});
test('the page security policy blocks any request the file tries to make',async({page,browser})=>{
 const file=await plainFile(page),server=await host({'p.html':file.html}),{context,page:view,requests}=await viewer(browser);
 try{await view.goto(server.origin+'/p.html');await expect(art(view)).toBeVisible();const blocked=await view.evaluate(async origin=>{try{await fetch(origin+'/leak');return false;}catch{return true;}},server.origin);expect(blocked).toBe(true);expect(requests.some(u=>u.endsWith('/leak'))).toBe(false);}finally{await context.close();await server.close();}
});
test('a protected export opens only with the right password and hides everything before that',async({page,browser})=>{
 const file=await protectedFile(page);expect(file.html).not.toContain(CANARY);expect(file.html).not.toContain('First screen');expect(file.name).toBe('protected-prototype.zip');expect(file.readme).toContain('weak password');
 const server=await host({'p.html':file.html}),{context,page:view,requests,problems}=await viewer(browser);
 try{await view.goto(server.origin+'/p.html');await expect(view).toHaveTitle('Protected prototype');await expect(view.getByRole('heading',{name:'Protected prototype',exact:true})).toBeVisible();await expect(art(view)).toHaveCount(0);
  const box=view.getByRole('textbox',{name:'Prototype password',exact:true});await box.fill('wrong password');await view.getByRole('button',{name:'Open prototype',exact:true}).click();await expect(view.getByRole('alert')).toContainText('does not open this prototype');await expect(art(view)).toHaveCount(0);
  await box.fill(PASSWORD);await view.getByRole('button',{name:'Open prototype',exact:true}).click();await expect(art(view)).toHaveAttribute('data-prototype-frame','screen-a');await expect(view).toHaveTitle(new RegExp(CANARY));await view.locator('[data-node-id="go"]').click();await expect(art(view)).toHaveAttribute('data-prototype-frame','screen-b');
  expect(requests).toEqual([server.origin+'/p.html']);expect(problems).toEqual([]);
 }finally{await context.close();await server.close();}
});
test('a protected file says why it cannot open on an insecure page',async({page,browser})=>{
 const file=await protectedFile(page),server=await host({'p.html':file.html}),{context,page:view}=await viewer(browser);
 try{await view.addInitScript(()=>Object.defineProperty(crypto,'subtle',{value:undefined}));await view.goto(server.origin+'/p.html');await expect(view.getByRole('alert')).toContainText('secure pages');await expect(view.getByRole('button',{name:'Open prototype',exact:true})).toBeDisabled();}finally{await context.close();await server.close();}
});
test('the file opens directly from disk without a server',async({page,browser})=>{
 const file=await protectedFile(page),folder=await fs.mkdtemp(path.join(os.tmpdir(),'forma-prototype-')),target=path.join(folder,'prototype.html');await fs.writeFile(target,file.html);const {context,page:view,problems}=await viewer(browser);
 try{await view.goto('file://'+target);await view.getByRole('textbox',{name:'Prototype password',exact:true}).fill(PASSWORD);await view.getByRole('button',{name:'Open prototype',exact:true}).click();await expect(art(view)).toHaveAttribute('data-prototype-frame','screen-a');await view.locator('[data-node-id="go"]').click();await expect(art(view)).toHaveAttribute('data-prototype-frame','screen-b');expect(problems).toEqual([]);}finally{await context.close();await fs.rm(folder,{recursive:true});}
});
test('the copied embed snippet plays inside its sandbox on a host page',async({page,browser})=>{
 await open(page);await dialog(page);const box=page.getByRole('textbox',{name:'Prototype embed code',exact:true});await page.getByRole('textbox',{name:'Prototype file location',exact:true}).fill('javascript:alert(1)');await expect(page.getByRole('alert')).toContainText('relative path');await page.getByRole('textbox',{name:'Prototype file location',exact:true}).fill('p.html');const snippet=await box.inputValue();expect(snippet).toContain('sandbox="allow-scripts');expect(snippet).not.toContain('allow-same-origin');
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Save prototype ZIP',exact:true}).click();const file=await exported(page,pending),server=await host({'p.html':file.html,'host.html':`<!doctype html><title>Host</title><h1>Host page</h1>${snippet}`}),{context,page:view,problems}=await viewer(browser);
 try{await view.goto(server.origin+'/host.html');const frame=view.frameLocator('iframe');await expect(frame.locator('svg.prototype-art')).toHaveAttribute('data-prototype-frame','screen-a');await frame.locator('[data-node-id="go"]').click();await expect(frame.locator('svg.prototype-art')).toHaveAttribute('data-prototype-frame','screen-b');expect(await view.frames()[1].evaluate(()=>origin)).toBe('null');expect(problems).toEqual([]);}finally{await context.close();await server.close();}
});
test('a phone viewport with touch can read and play the file',async({page,browser})=>{
 const file=await plainFile(page),server=await host({'p.html':file.html}),{context,page:view,problems}=await viewer(browser,{...devices['iPhone 13'],defaultBrowserType:undefined} as Parameters<Browser['newContext']>[0]);
 try{await view.goto(server.origin+'/p.html');await expect(art(view)).toHaveAttribute('data-prototype-frame','screen-a');await view.waitForFunction(()=>innerWidth<500&&navigator.maxTouchPoints>0);await expect.poll(()=>view.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const device=await view.locator('.prototype-device').boundingBox(),size=view.viewportSize()!;expect(device!.width).toBeLessThanOrEqual(size.width);expect(device!.x).toBeGreaterThanOrEqual(0);
  const next=view.getByRole('button',{name:'Next frame',exact:true}),target=await next.boundingBox();expect(target!.height).toBeGreaterThanOrEqual(44);await view.locator('[data-node-id="go"]').tap();await expect(art(view)).toHaveAttribute('data-prototype-frame','screen-b');await view.locator('[data-node-id="set"]').tap();await expect(view.locator('[data-node-id="value"]')).toContainText('Changed');expect(problems).toEqual([]);
 }finally{await context.close();await server.close();}
});
test('mismatched and short passwords stop before anything is saved',async({page})=>{
 await open(page);await dialog(page);let saved=false;page.on('download',()=>{saved=true;});await page.getByRole('radio',{name:'Only people with a password',exact:true}).check();await page.getByRole('textbox',{name:'Prototype password',exact:true}).fill('short');await page.getByRole('button',{name:'Save prototype ZIP',exact:true}).click();await expect(page.getByRole('dialog').getByRole('alert')).toContainText('8 to 1024');await page.getByRole('textbox',{name:'Prototype password',exact:true}).fill(PASSWORD);await page.getByRole('textbox',{name:'Repeat prototype password',exact:true}).fill(PASSWORD+'x');await page.getByRole('button',{name:'Save prototype ZIP',exact:true}).click();await expect(page.getByRole('dialog').getByRole('alert')).toContainText('do not match');expect(saved).toBe(false);
});
