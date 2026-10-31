import {node,parseDocument} from '../../src/model';
import {addBrandTemplate,brandFrameNodes,brandPage,createBrandAsset,createBrandDocument,publishBrandTemplate,setBrandTemplateSlot,updateBrandKit} from '../../src/brand-assets';
export const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jfuoAAAAASUVORK5CYII=';
export const swatch='data:image/gif;base64,R0lGODlhAQABAAAAACw=';
export function brandFixture(){
 const d=createBrandDocument('Spring'),page=brandPage(d,'template');
 updateBrandKit(d,{colors:[{name:'Ink',value:'#111111'},{name:'Paper',value:'#ffffff'},{name:'Coral',value:'#ff6a55'}],fonts:['Inter']});
 const t=addBrandTemplate(d,{name:'Post',width:1000,height:1000}),frame=brandFrameNodes(page,t.frameId)[0];
 const background=node('rectangle',{name:'Background',parentId:frame.id,width:1000,height:1000,fill:'#ff6a55',x:frame.x,y:frame.y}),title=node('text',{name:'Title',parentId:frame.id,x:frame.x+80,y:frame.y+100,width:800,height:120,text:'Headline',fill:'#111111',textResize:'fixed',fontFamily:'Inter'}),photo=node('image',{name:'Photo',parentId:frame.id,x:frame.x+80,y:frame.y+300,width:400,height:400,image:png}),logo=node('text',{name:'Logo',parentId:frame.id,x:frame.x+80,y:frame.y+850,width:300,height:60,text:'ACME',fill:'#ffffff',fontFamily:'Inter'});
 page.nodes.push(background,title,photo,logo);
 const titleSlot=setBrandTemplateSlot(d,t.id,{nodeId:title.id,kind:'text',name:'Headline',allow:['color','font'],maxLength:40}),imageSlot=setBrandTemplateSlot(d,t.id,{nodeId:photo.id,kind:'image',name:'Photo'});
 publishBrandTemplate(d,t.id);const asset=createBrandAsset(d,t.id,{name:'Launch'});
 const fresh=parseDocument(JSON.stringify(d));
 return {d:fresh,templateId:t.id,assetId:asset.id,titleSlot:titleSlot.id,imageSlot:imageSlot.id};
}
