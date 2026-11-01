import {test,expect} from '@playwright/test';
// Source-module checks deliberately run with Vite dev; production workflow is covered separately.
test('actual raster validation turns a corrupt image used only by a stroke into a placeholder without editing the current project',async({page})=>{
 await page.goto('/');await expect(page.locator('.app')).toBeVisible();const result=await page.evaluate(async()=>{
  const {mapFigScene,validateFigSceneRasters}=await import('/src/fig-scene.ts'),{useEditor}=await import('/src/store.ts');const before=useEditor.getState(),c=document.createElement('canvas');c.width=c.height=2;const ctx=c.getContext('2d')!;ctx.fillStyle='#ff0000';ctx.fillRect(0,0,2,2);const bytes=Uint8Array.from(atob(c.toDataURL().split(',')[1]),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);bytes[24]=3;let crc=0xffffffff;for(let i=12;i<29;i++){crc^=bytes[i];for(let j=0;j<8;j++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;}view.setUint32(29,(crc^0xffffffff)>>>0);
  const g=(n:number)=>({sessionID:1,localID:n}),decoded={message:{nodeChanges:[{guid:g(1),type:'DOCUMENT'},{guid:g(2),type:'CANVAS',parentIndex:{guid:g(1),position:'a'}},{guid:g(3),type:'ROUNDED_RECTANGLE',parentIndex:{guid:g(2),position:'a'},size:{x:20,y:20},strokePaints:[{type:'IMAGE',image:{hash:Array(20).fill(0)},imageScaleMode:'FILL'}]}]},images:{['0'.repeat(40)]:bytes}},doc=mapFigScene(decoded).document;let error='',codes:string[]=[];try{codes=(await validateFigSceneRasters(doc)).map(i=>i.code);}catch(e){error=(e as Error).message;}const after=useEditor.getState();return {error,codes,image:doc.pages[0].nodes[0].strokes?.[0].paint.image,unchanged:before.doc===after.doc,past:before.past.length===after.past.length};
 });expect(result).toMatchObject({unchanged:true,past:true,error:'',codes:['missing-image'],image:''});
});
test('canceled raster validation rejects before allocating an image or mutating the current project',async({page})=>{
 await page.goto('/');await expect(page.locator('.app')).toBeVisible();const result=await page.evaluate(async()=>{const {validateFigSceneRasters}=await import('/src/fig-scene.ts'),{blankDocument,node}=await import('/src/model.ts'),{createPaint}=await import('/src/paints.ts'),{useEditor}=await import('/src/store.ts');const before=useEditor.getState(),doc=blankDocument(),paint=createPaint('#000000','image');Object.assign(paint,{image:'data:image/png;base64,iVBORw0KGgo=',imageWidth:1,imageHeight:1});doc.pages[0].nodes=[node('rectangle',{paints:[paint]})];const controller=new AbortController();controller.abort();const Original=window.Image;let allocated=0,error='';try{window.Image=class{constructor(){allocated++;}} as typeof Image;await validateFigSceneRasters(doc,controller.signal);}catch(e){error=(e as Error).name;}finally{window.Image=Original;}return {error,allocated,unchanged:before.doc===useEditor.getState().doc};});expect(result).toEqual({error:'AbortError',allocated:0,unchanged:true});
});
for(const scenario of ['over-budget','exact-budget-with-reuse','inconsistent-reuse'] as const){
 test(`raster aggregate preflight: ${scenario}`,async({page})=>{
  await page.goto('/');await expect(page.locator('.app')).toBeVisible();
  const result=await page.evaluate(async(scenario)=>{
   const {validateFigSceneRasters}=await import('/src/fig-scene.ts'),{blankDocument,node}=await import('/src/model.ts'),{createPaint,createStroke}=await import('/src/paints.ts'),{useEditor}=await import('/src/store.ts');
   const before=useEditor.getState(),doc=blankDocument();
   // Small fake payloads declare large dimensions; no large bitmap is ever decoded.
   const raster=(id:number,width=4000,height=4000)=>{
    const paint=createPaint('#000000','image');
    Object.assign(paint,{image:'data:image/png;base64,'+btoa(`raster-${id}`),imageWidth:width,imageHeight:height});
    return paint;
   };
   const count=scenario==='over-budget'?5:4;
   for(let i=0;i<count;i++){
    const paint=raster(i),stroke=createStroke();stroke.paint=paint;
    doc.pages[0].nodes.push(node('rectangle',i%2?{paints:[],strokes:[stroke]}:{paints:[paint],strokes:[]}));
   }
   if(scenario==='exact-budget-with-reuse')for(let i=0;i<10;i++)doc.pages[0].nodes.push(node('rectangle',{paints:[raster(0)]}));
   if(scenario==='inconsistent-reuse')doc.pages[0].nodes.push(node('rectangle',{paints:[raster(0,2000,8000)]}));
   const Original=window.Image;let allocated=0,error='',codes:string[]=[];
   try{
    window.Image=class{
     naturalWidth=4000;naturalHeight=4000;onload:(()=>void)|null=null;onerror:(()=>void)|null=null;
     constructor(){allocated++;}
     set src(_value:string){this.onload?.();}
    } as unknown as typeof Image;
    codes=(await validateFigSceneRasters(doc)).map(i=>i.code);
   }catch(e){error=(e as Error).message;}finally{window.Image=Original;}
   const after=useEditor.getState();return {allocated,error,codes,kept:doc.pages[0].nodes.filter(n=>n.paints?.[0]?.image||n.strokes?.[0]?.paint.image).length,unchanged:before.doc===after.doc,past:before.past.length===after.past.length};
  },scenario);
  expect(result).toMatchObject({unchanged:true,past:true});
  if(scenario==='exact-budget-with-reuse')expect(result).toMatchObject({allocated:4,error:'',codes:[]});
  else expect(result).toMatchObject({allocated:4,error:'',codes:['missing-image'],kept:4});
 });
}
