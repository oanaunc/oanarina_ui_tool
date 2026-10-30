import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {Project} from '../../mcp/project';
import {importPngAsset} from '../../mcp/png-import';
import {fixturePng,pngDataUrl} from '../../mcp/tests/png-fixture';
import {parseDocument} from '../../src/model';

test('MCP imported PNG opens as an editable image, renders actual colors/alpha and saves/reopens unchanged',async({page})=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'forma-png-browser-'));const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 try{const project=await Project.open(path.join(dir,'image.oui'),true),initial=await project.read(),result=await importPngAsset(project,{revision:initial.revision,pageId:initial.document.pages[0].id,dataUrl:pngDataUrl(fixturePng()),name:'MCP color tiles',x:40,y:50,displayWidth:120}),doc=(await project.read()).document;
 await page.addInitScript(doc=>localStorage.setItem('oui-active',JSON.stringify(doc)),doc);await page.goto('/');await expect(page.getByRole('toolbar',{name:'Design tools'})).toBeVisible();await page.locator(`[data-layer-id="${result.nodeId}"]`).click();await expect(page.getByLabel('Fill 1 image file size',{exact:true})).toContainText('2 × 2 px');await expect(page.locator('#forma-design-canvas image')).toHaveAttribute('href',doc.pages[0].nodes[0].paints![0].image!);
 const colors=await page.evaluate(async()=>{const f='/src/files.tsx',{exportSvg}=await import(f),s='/src/store.ts',{useEditor}=await import(s),svg=exportSvg(useEditor.getState().doc.pages[0].nodes,{x:40,y:50,width:120,height:120}),image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();const c=document.createElement('canvas');c.width=c.height=120;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,120,120);return [[20,20],[100,20],[20,100],[100,100]].map(([x,y])=>[...ctx.getImageData(x,y,1,1).data]);});
 expect(colors).toEqual([[255,0,0,255],[0,255,0,255],[0,0,255,255],[255,255,0,128]]);
 const pending=page.waitForEvent('download');await page.keyboard.press('Meta+s');const saved=parseDocument(await fs.readFile((await(await pending).path())!,'utf8'));expect(saved.pages).toEqual(doc.pages);
 await page.getByRole('menuitem',{name:'File',exact:true}).click();const chooser=page.waitForEvent('filechooser');await page.getByRole('menuitem',{name:/^Open project…/}).click();await(await chooser).setFiles({name:'imported-image.oui',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(saved))});await expect(page.locator(`[data-layer-id="${result.nodeId}"]`)).toBeVisible();
 expect(await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);return useEditor.getState().doc.pages;})).toEqual(saved.pages);expect(errors).toEqual([]);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
