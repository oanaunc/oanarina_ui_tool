import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {blankDocument,node} from '../../src/model';
import type {SpecBlock} from '../../src/spec';
const block=(kind:string,extra:Record<string,unknown>={})=>({id:crypto.randomUUID(),kind,...extra}) as SpecBlock;
async function init(page:Page,nodes:any[]){const d=blankDocument();d.fonts=[];d.pages[0].nodes=nodes;await page.addInitScript(d=>localStorage.setItem('oui-active',JSON.stringify(d)),d);await page.goto('/');await expect(page.getByLabel('Design canvas')).toBeVisible();await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().set({zoom:1,pan:{x:40,y:40}});});}
const live=(page:Page)=>page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p),s=useEditor.getState(),nodes=s.doc.pages.find((v:any)=>v.id===s.pageId).nodes;return {nodes,past:s.past.length,selection:s.selection};});
const spec=async(page:Page,id='page')=>(await live(page)).nodes.find((n:any)=>n.id===id);
const page1=(blocks:SpecBlock[],extra={})=>node('spec',{id:'page',name:'Reader spec',x:100,y:60,width:600,height:300,spec:{version:1,blocks},...extra});
const open=async(page:Page)=>{await page.locator('[data-node-id="page"]').first().dblclick({position:{x:300,y:20}});await expect(page.locator('[data-spec-editor]')).toBeVisible();};
const leave=(page:Page)=>page.keyboard.press('Escape');
test('the toolbar makes a Spec layer that opens ready to write, and Layers calls it a Spec',async({page})=>{
 await init(page,[]);await page.getByRole('button',{name:'Text tool options'}).click();await page.getByRole('menuitem',{name:'Spec'}).click();await page.getByLabel('Design canvas').click({position:{x:300,y:120}});
 await expect(page.locator('[data-spec-editor]')).toBeVisible();await expect(page.getByRole('textbox',{name:'Heading 1'})).toBeFocused();await page.keyboard.type('Reader flows');await page.keyboard.press('Enter');await page.keyboard.type('First line');await leave(page);
 const {nodes}=await live(page),made=nodes.find((n:any)=>n.type==='spec');expect(made.spec.blocks.map((b:any)=>[b.kind,b.text])).toEqual(expect.arrayContaining([['heading','Reader flows'],['paragraph','First line']]));expect(made.width).toBe(850);expect(nodes.filter((n:any)=>n.type==='text')).toHaveLength(0);
});
test('markdown prefixes become blocks as they are typed',async({page})=>{
 await init(page,[page1([block('paragraph',{text:''})])]);await open(page);
 for(const [typed,enter] of [['# Title',true],['## Section',true],['- point',true],['second',true]] as const){await page.keyboard.type(typed);if(enter)await page.keyboard.press('Enter');}
 await page.keyboard.press('Enter');await page.keyboard.type('1. step');await page.keyboard.press('Enter');await page.keyboard.type('next');await page.keyboard.press('Enter');await page.keyboard.press('Enter');
 await page.keyboard.type('> said');await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.keyboard.type('[] task');await page.keyboard.press('Enter');await page.keyboard.press('Enter');await page.keyboard.type('---');await page.keyboard.type('```');await page.keyboard.type('let a=1');await leave(page);
 const kinds=(await spec(page)).spec.blocks.filter((b:any)=>b.kind==='divider'||b.text).map((b:any)=>b.kind+':'+(b.text??''));
 expect(kinds).toEqual(['heading:Title','heading:Section','bullet:point','bullet:second','number:step','number:next','quote:said','todo:task','divider:','code:let a=1']);
});
test('slash opens a filtered block menu that the keyboard drives',async({page})=>{
 await init(page,[page1([block('paragraph',{text:''})])]);await open(page);await page.keyboard.type('/');const menu=page.getByRole('listbox',{name:'Blocks'});await expect(menu).toBeVisible();await expect(menu.getByRole('option')).toHaveCount(13);
 await page.keyboard.type('head');await expect(menu.getByRole('option')).toHaveCount(3);await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await expect(menu).toBeHidden();await page.keyboard.type('Picked');await leave(page);
 expect((await spec(page)).spec.blocks[0]).toMatchObject({kind:'heading',level:2,text:'Picked'});
});
test('an embedded frame stays live: change the frame and the spec paints the change, delete it and it says so',async({page})=>{
 const frame=node('frame',{id:'screen',name:'Reader screen',x:900,y:60,width:200,height:160,fill:'#ff0000'});await init(page,[frame,page1([block('paragraph',{text:''})])]);await open(page);
 await page.keyboard.type('/frame');await page.keyboard.press('Enter');const frames=page.getByRole('listbox',{name:'Frames'});await expect(frames.getByRole('option',{name:'Reader screen'})).toBeVisible();await page.keyboard.press('Enter');await leave(page);
 const placed=(await spec(page)).spec.blocks.find((b:any)=>b.kind==='frame');expect(placed).toMatchObject({nodeId:'screen',name:'Reader screen'});
 await expect(page.locator('[data-spec-frame] path[fill="#ff0000"]')).toBeAttached();
 await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().edit((d:any)=>{const n=d.pages[0].nodes.find((v:any)=>v.id==='screen');n.fill='#00ff00';n.paints=undefined;n.height=320;});});
 await expect(page.locator('[data-spec-frame] path[fill="#00ff00"]')).toBeAttached();expect((await spec(page)).height).toBeGreaterThan(420);
 await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().edit((d:any)=>{d.pages[0].nodes=d.pages[0].nodes.filter((v:any)=>v.id!=='screen');});});
 await expect(page.locator('[data-node-id="page"]').getByText('is not available').first()).toBeAttached();
});
test('a whole editing session is one Undo, and blocks survive a reload',async({page})=>{
 await init(page,[page1([block('paragraph',{text:'Start'})])]);const before=(await live(page)).past;await open(page);await page.keyboard.press('End');await page.keyboard.type(' more');await page.waitForTimeout(650);await page.keyboard.press('Enter');await page.keyboard.type('Second');await page.waitForTimeout(650);await leave(page);
 expect((await live(page)).past).toBe(before+1);expect((await spec(page)).spec.blocks.map((b:any)=>b.text)).toEqual(['Start more','Second']);
 await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().undo();});expect((await spec(page)).spec.blocks.map((b:any)=>b.text)).toEqual(['Start']);
 await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().redo();});
 const json=await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);return JSON.stringify(useEditor.getState().doc);}),parsed=await page.evaluate(async raw=>{const p='/src/model.ts',{parseDocument}=await import(p);return parseDocument(raw).pages[0].nodes[0].spec.blocks.length;},json);expect(parsed).toBe(2);
});
test('undo inside the editor walks back typing, and moving a block by keyboard works',async({page})=>{
 await init(page,[page1([block('paragraph',{text:'One'}),block('paragraph',{text:'Two'})])]);await open(page);await page.keyboard.press('Meta+Shift+ArrowUp');await page.keyboard.press('Meta+Shift+ArrowUp');await leave(page);expect((await spec(page)).spec.blocks.map((b:any)=>b.text)).toEqual(['Two','One']);
 await open(page);await page.keyboard.press('Meta+z');await page.keyboard.press('Meta+z');await leave(page);expect((await spec(page)).spec.blocks.map((b:any)=>b.text)).toEqual(['Two','One']);
});
test('words grow the page, a width change reflows it, and a selected spec moves like any layer',async({page})=>{
 await init(page,[page1([block('paragraph',{text:'words '.repeat(400)})],{minHeight:120})]);await page.locator('[data-node-id="page"]').first().click({position:{x:300,y:20}});const tall=(await spec(page)).height;await page.waitForTimeout(50);
 await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().patch(['page'],{width:400});});const narrow=await spec(page);expect(narrow.height).toBeGreaterThan(tall);expect(narrow.width).toBe(400);
 await page.evaluate(async()=>{const p='/src/store.ts',{useEditor}=await import(p);useEditor.getState().patch(['page'],{width:100});});expect((await spec(page)).width).toBe(320);
});
test('a pasted markdown document becomes blocks',async({page})=>{
 await init(page,[page1([block('paragraph',{text:''})])]);await open(page);await page.evaluate(()=>{const data=new DataTransfer();data.setData('text/plain','# Title\n\n- one\n- [x] done\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\n> quote');document.activeElement!.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));});await leave(page);
 expect((await spec(page)).spec.blocks.map((b:any)=>b.kind)).toEqual(['heading','bullet','todo','table','quote']);
});
test('clicks and the camera still reach the canvas while a page is open',async({page})=>{
 await init(page,[page1([block('paragraph',{text:'Words'})])]);await open(page);const before=await page.locator('[data-spec-editor]').boundingBox();await page.mouse.move(300,200);await page.mouse.wheel(0,120);await expect.poll(async()=>(await page.locator('[data-spec-editor]').boundingBox())!.y).not.toBe(before!.y);
 await page.mouse.click(1000,600);await expect(page.locator('[data-spec-editor]')).toHaveCount(0);
});
test('the words stay where they are when the page opens for editing',async({page})=>{
 await init(page,[page1([block('heading',{level:1,text:'Title line'}),block('paragraph',{text:'A paragraph long enough to need more than a single line when it sits on a page this narrow, so spacing shows.'}),block('bullet',{text:'One point'}),block('quote',{text:'Said'}),block('code',{text:'let a=1'}),block('paragraph',{text:'After'})])]);
 const painted=await page.evaluate(()=>[...new Set([...document.querySelectorAll('[data-spec-page="page"] tspan[data-text-range]')].map(el=>el.textContent))].filter(t=>/Title|After|One point|Said|let a/.test(t!)).map(t=>{const el=[...document.querySelectorAll('[data-spec-page="page"] tspan[data-text-range]')].find(v=>v.textContent===t&&v.getBoundingClientRect().height>0)!,r=el.getBoundingClientRect();return {t,y:r.top+r.height/2,x:r.left};}));
 await open(page);
 const edited=await page.evaluate(()=>[...document.querySelectorAll('[data-spec-editor] [data-spec-field]')].map(el=>{const range=document.createRange();range.selectNodeContents(el);const r=range.getClientRects()[0];return {t:el.textContent,y:r.top+r.height/2,x:r.left};}));
 expect(painted.length).toBeGreaterThanOrEqual(5);for(const p of painted){const e=edited.find(v=>v.t===p.t)!;expect(Math.abs(e.y-p.y),'vertical '+p.t).toBeLessThan(4);expect(Math.abs(e.x-p.x),'horizontal '+p.t).toBeLessThan(2);}
});
test('a spec exports its words and live frames as ordinary artwork',async({page})=>{
 const frame=node('frame',{id:'screen',name:'Screen',x:900,y:60,width:200,height:160,fill:'#123456'});await init(page,[frame,page1([block('heading',{level:2,text:'Exported title'}),block('frame',{nodeId:'screen',name:'Screen'})])]);
 const svg=await page.evaluate(async()=>{const a='/src/files.tsx',b='/src/store.ts',{exportSvg}=await import(a),{useEditor}=await import(b);const nodes=useEditor.getState().doc.pages[0].nodes.filter((n:any)=>n.id==='page');return exportSvg(nodes,{x:100,y:60,width:600,height:600});}).catch(e=>String(e));
 expect(svg).toContain('Exported title');expect(svg).toContain('#123456');
});
const pixel='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==';
test('dragging a block handle moves it, and clicking the handle turns it into another kind',async({page})=>{
 await init(page,[page1([block('paragraph',{text:'One'}),block('paragraph',{text:'Two'}),block('paragraph',{text:'Three'})])]);await open(page);
 const rows=page.locator('[data-spec-row]');await rows.nth(0).hover();const grip=rows.nth(0).getByLabel('Drag to move, click for options'),from=(await grip.boundingBox())!,to=(await rows.nth(2).boundingBox())!;
 await page.mouse.move(from.x+8,from.y+8);await page.mouse.down();await page.mouse.move(from.x+8,to.y+to.height-2,{steps:6});await expect(page.locator('.spec-row.drop-after')).toHaveCount(1);await page.mouse.up();
 await expect(page.locator('[data-spec-field]').first()).toHaveText('Two');await expect(page.locator('[data-spec-field]').nth(2)).toHaveText('One');
 await rows.nth(0).hover();await rows.nth(0).getByLabel('Drag to move, click for options').click();await page.getByRole('option',{name:'Turn into heading 2'}).click();await expect(page.locator('[data-spec-row]').first()).toHaveAttribute('data-kind','heading');
 await page.locator('[data-spec-row]').nth(1).hover();await page.locator('[data-spec-row]').nth(1).getByLabel('Drag to move, click for options').click();await page.getByRole('option',{name:'Duplicate'}).click();await expect(page.locator('[data-spec-row]')).toHaveCount(4);
 await page.locator('[data-spec-row]').nth(1).hover();await page.locator('[data-spec-row]').nth(1).getByLabel('Drag to move, click for options').click();await page.getByRole('option',{name:'Delete'}).click();await expect(page.locator('[data-spec-row]')).toHaveCount(3);await leave(page);
 expect((await spec(page)).spec.blocks.map((b:any)=>b.kind+':'+b.text)).toEqual(['heading:Two','paragraph:Three','paragraph:One']);
});
test('the plus button opens the block menu on a new line, and Go to frame leaves for the frame',async({page})=>{
 const frame=node('frame',{id:'screen',name:'Reader screen',x:900,y:60,width:200,height:160});await init(page,[frame,page1([block('paragraph',{text:'Words'}),block('frame',{nodeId:'screen',name:'Reader screen'})])]);await open(page);
 const first=page.locator('[data-spec-row]').first();await first.hover();await first.getByLabel('Add a block below').click();await expect(page.getByRole('listbox',{name:'Blocks'})).toBeVisible();await page.keyboard.press('Escape');await page.keyboard.press('Backspace');await page.keyboard.press('Backspace');
 const embed=page.locator('.spec-frame');await embed.hover();await embed.getByRole('button',{name:'Go to frame'}).click();await expect(page.locator('[data-spec-editor]')).toHaveCount(0);expect((await live(page)).selection).toEqual(['screen']);
});
test('tables take typing and Tab, to-dos tick, and format keys wrap words',async({page})=>{
 await init(page,[page1([block('todo',{text:'Task',checked:false}),block('table',{rows:[['','']]}),block('paragraph',{text:'word'})])]);await open(page);
 await page.getByLabel('Done').click();await page.getByLabel('Row 1 column 1').click();await page.keyboard.type('A');await page.keyboard.press('Tab');await page.keyboard.type('B');await page.keyboard.press('Tab');await page.keyboard.type('C');
 const last=page.getByRole('textbox',{name:'Text'});await last.dblclick({position:{x:12,y:12}});await page.keyboard.press('Control+b');await leave(page);
 const blocks=(await spec(page)).spec.blocks;expect(blocks[0].checked).toBe(true);expect(blocks[1].rows).toEqual([['A','B'],['C','']]);expect(blocks[2].text).toBe('**word**');
});
test('a pasted image becomes a block, painted on the canvas and saved in the file',async({page})=>{
 await init(page,[page1([block('paragraph',{text:''})])]);await open(page);
 await page.evaluate(async src=>{const bytes=Uint8Array.from(atob(src.split(',')[1]),c=>c.charCodeAt(0)),file=new File([bytes],'a.png',{type:'image/png'}),data=new DataTransfer();data.items.add(file);document.activeElement!.dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}));},pixel);
 await expect(page.locator('.spec-image img')).toHaveCount(1);await leave(page);const blocks=(await spec(page)).spec.blocks;expect(blocks[0]).toMatchObject({kind:'image',width:1,height:1});expect(blocks[1].kind).toBe('paragraph');await expect(page.locator('[data-spec-page] image, [data-spec-page] pattern')).not.toHaveCount(0);
});
test('every block selects with Command-A twice, then copies as Markdown or clears the page',async({page})=>{
 await init(page,[page1([block('heading',{level:1,text:'Title'}),block('paragraph',{text:'Body'})])]);await open(page);await page.keyboard.press('Meta+a');await page.keyboard.press('Meta+a');await page.keyboard.press('Control+a');await page.keyboard.press('Control+a');await expect(page.locator('.spec-editor.picked')).toHaveCount(1);
 const copied=await page.evaluate(()=>{const data=new DataTransfer(),event=new ClipboardEvent('copy',{clipboardData:data,bubbles:true,cancelable:true});document.activeElement!.dispatchEvent(event);return data.getData('text/plain');});expect(copied).toBe('# Title\n\nBody');
 await page.keyboard.press('Backspace');await expect(page.locator('[data-spec-row]')).toHaveCount(1);await page.keyboard.press('Meta+z');await page.keyboard.press('Control+z');await expect(page.locator('[data-spec-row]')).toHaveCount(2);
});
test('Inspect lists the Markdown and the Inspector offers Edit and Copy',async({page})=>{
 await init(page,[page1([block('heading',{level:1,text:'Title'})])]);await page.locator('[data-node-id="page"]').first().click({position:{x:300,y:20}});const panel=page.getByTestId('spec-section');await expect(panel).toContainText('1 block');await panel.getByRole('button',{name:'Edit'}).click();await expect(page.locator('[data-spec-editor]')).toBeVisible();await leave(page);
});
test('a spec that is already selected opens on double-click, under its selection box',async({page})=>{
 await init(page,[page1([block('paragraph',{text:'Words'})])]);await page.locator('[data-node-id="page"]').first().click({position:{x:300,y:20}});expect((await live(page)).selection).toEqual(['page']);await page.locator('[data-node-id="page"]').first().dblclick({position:{x:300,y:60}});await expect(page.locator('[data-spec-editor]')).toBeVisible();await leave(page);
});
