import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
/** Real pixels: the source SVG rasterized by the browser against the imported layers exported back to SVG and rasterized. */
const sample=`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
<style>.card{fill:#123456}#dot{fill:tomato}</style>
<defs>
<clipPath id="circle"><circle cx="100" cy="60" r="50"/></clipPath>
<mask id="fade"><rect x="0" y="120" width="100" height="80" fill="white"/><rect x="100" y="120" width="100" height="80" fill="#808080"/></mask>
<linearGradient id="user" x1="10" y1="0" x2="190" y2="0" gradientUnits="userSpaceOnUse"><stop stop-color="#ff0000"/><stop offset="1" stop-color="#0000ff"/></linearGradient>
</defs>
<rect width="200" height="200" fill="#ffffff"/>
<rect class="card" x="0" y="0" width="200" height="120" clip-path="url(#circle)"/>
<rect x="0" y="120" width="200" height="80" fill="url(#user)" mask="url(#fade)"/>
<circle id="dot" cx="20" cy="20" r="10"/>
</svg>`;
async function raster(page:Page,svg:string,points:[number,number][]){return page.evaluate(async({svg,points})=>{const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));await image.decode();const c=document.createElement('canvas');c.width=200;c.height=200;const g=c.getContext('2d')!;g.drawImage(image,0,0,200,200);return points.map(([x,y])=>Array.from(g.getImageData(x,y,1,1).data));},{svg,points});}
const near=(a:number[],b:number[],tolerance=24)=>a.every((v,i)=>Math.abs(v-b[i])<=tolerance);
test('stylesheet, arbitrary clip, luminance mask and user-space gradient render like the source',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'New design file',exact:true}).click();await expect(page.locator('svg.canvas')).toBeVisible();
 const exported=await page.evaluate(async sample=>{const importer='/src/svg-import.ts',files='/src/files.tsx',store='/src/store.ts',{parseEditableSvg}=await import(importer),{exportSvg}=await import(files),{useEditor}=await import(store),out=parseEditableSvg(sample,'Depth',{x:0,y:0});useEditor.getState().edit((d:any)=>{const p=d.pages.find((p:any)=>p.id===useEditor.getState().pageId);p.nodes=out.nodes;});const nodes=useEditor.getState().doc.pages[0].nodes;return {svg:exportSvg(nodes,{x:0,y:0,width:200,height:200}),issues:out.issues,count:nodes.length};},sample);
 expect(exported.issues).toEqual([]);expect(exported.count).toBeGreaterThan(5);
 const points:[number,number][]=[[100,60],[60,60],[58,20],[150,20],[20,20],[10,160],[60,160],[150,160],[190,190],[100,115]],source=await raster(page,sample,points),imported=await raster(page,exported.svg,points);
 for(let i=0;i<points.length;i++)expect(near(source[i],imported[i]),`point ${points[i]}: ${source[i]} vs ${imported[i]}`).toBe(true);
});
