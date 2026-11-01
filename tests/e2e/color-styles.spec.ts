import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {blankDocument,node} from '../../src/model';
import {createPaint} from '../../src/paints';
const rect=(id:string,fill:string,x:number,extra={})=>node('rectangle',{id,name:id,x,y:80,width:120,height:80,fill,paints:[createPaint(fill)],stroke:'',...extra});
async function init(page:Page,nodes:any[],styles?:any[]){const d=blankDocument();d.fonts=[];d.pages[0].nodes=nodes;if(styles)d.styles=styles;await page.addInitScript(d=>localStorage.setItem('oui-active',JSON.stringify(d)),d);await page.goto('/');await expect(page.locator('[data-layer-id]').first()).toBeVisible();await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().set({zoom:1,pan:{x:40,y:40}});});}
const state=(page:Page)=>page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p),s=useEditor.getState();return {styles:s.doc.styles??[],nodes:s.doc.pages[0].nodes,past:s.past.length};});
const pick=async(page:Page,id:string)=>{await page.locator(`[data-layer-id="${id}"]`).click();};
const openPicker=(page:Page)=>page.getByRole('button',{name:'Fill 1 color picker'}).click();
const olive={id:'olive',name:'Olive',description:'',type:'paint',value:{fill:'#675d42',paints:[createPaint('#675d42')],gradient:false}};
test('a fill saves as a named style from the color panel and the layer links to it',async({page})=>{
 await init(page,[rect('a','#675d42',100)]);await pick(page,'a');await openPicker(page);await page.getByRole('button',{name:'Save as color style'}).click();const name=page.getByLabel('Style name');await expect(name).toBeFocused();await expect(name).toHaveValue('Color 1');await name.fill('Brand/Olive');await page.getByLabel('Style description').fill('Main accent');await page.getByRole('button',{name:'Create style'}).click();
 const {styles,nodes}=await state(page);expect(styles).toHaveLength(1);expect(styles[0]).toMatchObject({name:'Brand/Olive',description:'Main accent',type:'paint'});expect(nodes[0].styleIds?.paint).toBe(styles[0].id);
 await expect(page.getByRole('button',{name:'Apply style Brand/Olive'})).toHaveAttribute('aria-pressed','true');await expect(page.locator('.color-style-folder')).toHaveText('Brand');await expect(page.locator('[data-color-variable]')).toHaveText('Brand/Olive');
 await page.locator('.color-tabs').getByRole('tab',{name:'Custom'}).click();await expect(page.getByLabel('Fill 1 hex')).toBeVisible();
});
test('a name is required, and an empty file invites the first style',async({page})=>{
 await init(page,[rect('a','#675d42',100)]);await pick(page,'a');await openPicker(page);await page.getByRole('tab',{name:'Styles'}).click();await expect(page.getByText('No color styles yet')).toBeVisible();await page.getByRole('button',{name:'Save this color'}).click();await page.getByLabel('Style name').fill('   ');await page.getByRole('button',{name:'Create style'}).click();expect((await state(page)).styles).toHaveLength(0);
});
test('a saved style is found by search and applied to another layer',async({page})=>{
 await init(page,[rect('a','#675d42',100,{styleIds:{paint:'olive'}}),rect('b','#ff0000',300),rect('c','#00ff00',500)],[olive,{...olive,id:'sky',name:'Sky',value:{fill:'#addce2',paints:[createPaint('#addce2')],gradient:false}}]);await pick(page,'b');await openPicker(page);await page.getByRole('tab',{name:'Styles'}).click();await page.getByLabel('Search color styles').fill('oli');await expect(page.locator('.color-style-apply')).toHaveCount(1);await page.getByRole('button',{name:'Apply style Olive'}).click();
 const b=(await state(page)).nodes.find((n:any)=>n.id==='b');expect(b.styleIds.paint).toBe('olive');expect(b.fill).toBe('#675d42');
});
test('changing a saved color updates every layer that uses it, in one Undo, and detached layers stay put',async({page})=>{
 await init(page,[rect('a','#675d42',100,{styleIds:{paint:'olive'}}),rect('b','#675d42',300,{styleIds:{paint:'olive'}}),rect('free','#675d42',500)],[olive]);await pick(page,'a');await openPicker(page);await expect(page.getByRole('button',{name:'Apply style Olive'})).toBeVisible();await page.locator('.color-style-row').hover();await page.getByRole('button',{name:'Edit style Olive'}).click();await expect(page.getByText('Used by 2 layers')).toBeVisible();const before=(await state(page)).past;
 const hex=page.getByLabel('Style Olive hex');await hex.fill('112233');await hex.press('Enter');await expect.poll(async()=>(await state(page)).nodes.find((n:any)=>n.id==='a').fill).toBe('#112233');let s=await state(page);expect(s.nodes.find((n:any)=>n.id==='b').fill).toBe('#112233');expect(s.nodes.find((n:any)=>n.id==='free').fill).toBe('#675d42');expect(s.past).toBe(before+1);
 await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().undo();});s=await state(page);expect(s.nodes.find((n:any)=>n.id==='b').fill).toBe('#675d42');
 await page.getByRole('button',{name:'Back to color styles'}).click();await page.getByRole('button',{name:'Close the color picker'}).click();await pick(page,'b');await page.getByRole('button',{name:'Detach style'}).click();s=await state(page);expect(s.nodes.find((n:any)=>n.id==='b').styleIds?.paint).toBeUndefined();expect(s.nodes.find((n:any)=>n.id==='b').fill).toBe('#675d42');
 await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().edit((d:any)=>{const v=d.styles[0].value;v.fill='#000000';v.paints[0].color='#000000';});});s=await state(page);expect(s.nodes.find((n:any)=>n.id==='a').fill).toBe('#000000');expect(s.nodes.find((n:any)=>n.id==='b').fill).toBe('#675d42');
});
test('changing the color of a linked fill by hand detaches it, and a style reaches text and frames',async({page})=>{
 const label=node('text',{id:'label',name:'label',x:100,y:220,width:160,height:32,fill:'#000000',paints:[createPaint('#000000')],text:'Hello'}),box=node('frame',{id:'box',name:'box',x:320,y:220,width:100,height:100,fill:'#ffffff',paints:[createPaint('#ffffff')]});await init(page,[rect('a','#675d42',100,{styleIds:{paint:'olive'}}),label,box],[olive]);
 for(const id of ['label','box']){await pick(page,id);await openPicker(page);await page.getByRole('tab',{name:'Styles'}).click();await page.getByRole('button',{name:'Apply style Olive'}).click();await page.getByRole('button',{name:'Close the color picker'}).click();}
 let s=await state(page);for(const id of ['label','box'])expect(s.nodes.find((n:any)=>n.id===id)).toMatchObject({fill:'#675d42',styleIds:{paint:'olive'}});
 await pick(page,'a');await openPicker(page);await page.locator('.color-tabs').getByRole('tab',{name:'Custom'}).click();const hex=page.getByLabel('Fill 1 hex');await hex.fill('ff0000');await hex.press('Enter');await expect.poll(async()=>(await state(page)).nodes.find((n:any)=>n.id==='a').styleIds?.paint).toBeUndefined();
});
test('several selected layers take a style together, and styles live in the saved file',async({page})=>{
 await init(page,[rect('a','#111111',100),rect('b','#222222',300)],[olive]);await pick(page,'a');await page.locator('[data-layer-id="b"]').click({modifiers:['Shift']});await page.getByTestId('mixed-fill-style').getByLabel('Paint style').selectOption('olive');const s=await state(page);for(const n of s.nodes)expect(n).toMatchObject({fill:'#675d42',styleIds:{paint:'olive'}});
 const count=await page.evaluate(async()=>{const a='/src/store.ts',b='/src/model.ts',{useEditor}=await import(a),{parseDocument}=await import(b);return parseDocument(JSON.stringify(useEditor.getState().doc)).styles!.length;});expect(count).toBe(1);
});
test('Styles and colors lists saved styles, and a change there reaches their layers',async({page})=>{
 await init(page,[rect('a','#675d42',100,{styleIds:{paint:'olive'}})],[olive]);await page.getByRole('button',{name:'Styles & colors'}).click();const color=page.getByLabel('Olive color style');await expect(color).toHaveValue('#675d42');await color.fill('#123456');await expect.poll(async()=>(await state(page)).nodes[0].fill).toBe('#123456');
});
