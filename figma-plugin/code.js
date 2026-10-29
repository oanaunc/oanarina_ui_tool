/* Independent development plugin. Uses the public Figma Plugin API, no private .fig encoding. */
figma.showUI(__html__, {width: 440, height: 570, themeColors: true});
function defaults(type, props) {
 return Object.assign({id:'',type,name:type,parentId:null,x:0,y:0,width:160,height:100,rotation:0,fill:'#d8c9f2',stroke:'',strokeWidth:2,opacity:1,radius:0,visible:true,locked:false,text:'',fontSize:24,fontFamily:'Inter',fontWeight:400,textAlign:'left',lineHeight:1.3,letterSpacing:0,path:'',points:[],image:'',shadow:false,blur:0,layout:'none',gap:16,padding:24,columns:3,clip:false,componentId:null,targetId:null,gradient:false},props);
}
const kinds={FRAME:'frame',SECTION:'section',RECTANGLE:'rectangle',ELLIPSE:'ellipse',LINE:'line',POLYGON:'polygon',STAR:'star',TEXT:'text',VECTOR:'path',GROUP:'group',COMPONENT:'component',INSTANCE:'instance'};
const rgb=paint=>'#'+['r','g','b'].map(k=>Math.round(Math.max(0,Math.min(1,paint.color[k]))*255).toString(16).padStart(2,'0')).join('');
const paint=color=>({type:'SOLID',color:{r:parseInt(color.slice(1,3),16)/255,g:parseInt(color.slice(3,5),16)/255,b:parseInt(color.slice(5,7),16)/255}});
async function readNode(n,parentId,out,report){
 if(!kinds[n.type]){report.push(n.name+': unsupported '+n.type+' skipped');return;}
 const t=n.absoluteTransform,fill=Array.isArray(n.fills)?n.fills[0]:null,stroke=Array.isArray(n.strokes)?n.strokes[0]:null;
 const value=defaults(kinds[n.type],{id:n.id,name:n.name,parentId,x:t?t[0][2]:n.x,y:t?t[1][2]:n.y,width:n.width,height:n.height,rotation:-(n.rotation||0),fill:fill&&fill.type==='SOLID'?rgb(fill):'none',stroke:stroke&&stroke.type==='SOLID'?rgb(stroke):'',strokeWidth:typeof n.strokeWeight==='number'?n.strokeWeight:1,opacity:typeof n.opacity==='number'?n.opacity:1,visible:n.visible,locked:n.locked,radius:typeof n.cornerRadius==='number'?n.cornerRadius:0,clip:!!n.clipsContent});
 if(n.parent&&n.parent.type!=='PAGE'&&Math.abs(n.parent.rotation||0)>.01)report.push(n.name+': parent rotation is flattened approximately');
 if(Array.isArray(n.fills)&&n.fills.length>1)report.push(n.name+': only first fill transferred');
 if(fill&&fill.opacity!==undefined&&fill.opacity<1){report.push(n.name+': fill opacity combined with layer opacity');value.opacity*=fill.opacity;}
 if(fill&&fill.type==='IMAGE'&&fill.imageHash){const image=figma.getImageByHash(fill.imageHash);if(image){const bytes=await image.getBytesAsync();const png=bytes[0]===137&&bytes[1]===80;const gif=bytes[0]===71&&bytes[1]===73;const webp=bytes[0]===82&&bytes[1]===73;value.type='image';value.image='data:image/'+(png?'png':gif?'gif':webp?'webp':'jpeg')+';base64,'+figma.base64Encode(bytes);report.push(n.name+': image transferred at original size; crop and adjustments not retained');}}
 else if(fill&&fill.type!=='SOLID')report.push(n.name+': '+fill.type+' fill omitted');
 if(n.type==='TEXT'){
 value.text=n.characters;value.fontFamily=n.fontName!==figma.mixed?n.fontName.family:'Inter';value.fontSize=typeof n.fontSize==='number'?n.fontSize:24;value.fontWeight=typeof n.fontWeight==='number'?n.fontWeight:400;value.textAlign=n.textAlignHorizontal==='CENTER'?'center':n.textAlignHorizontal==='RIGHT'?'right':'left';
 if(n.lineHeight!==figma.mixed&&n.lineHeight.unit==='PERCENT')value.lineHeight=n.lineHeight.value/100;
 else if(n.lineHeight!==figma.mixed&&n.lineHeight.unit==='PIXELS')value.lineHeight=n.lineHeight.value/value.fontSize;
 if(n.letterSpacing!==figma.mixed)value.letterSpacing=n.letterSpacing.unit==='PIXELS'?n.letterSpacing.value:n.letterSpacing.value/100*value.fontSize;
 if(n.fontName===figma.mixed||n.fontSize===figma.mixed||n.fills===figma.mixed)report.push(n.name+': mixed text styling reduced to one style');
 if(n.textAlignHorizontal==='JUSTIFIED')report.push(n.name+': justified alignment transferred as left');
 }
 if(n.type==='VECTOR'){value.path=n.vectorPaths[0]?n.vectorPaths[0].data:'';if(n.vectorPaths.length>1)report.push(n.name+': only the first vector path transferred');}
 if(n.type==='POLYGON'&&n.pointCount!==6)report.push(n.name+': polygon point count reduced to six');
 if(n.type==='STAR'&&(n.pointCount!==5||Math.abs(n.innerRadius-.43)>.01))report.push(n.name+': star transferred with default five points and inner radius');
 if('layoutMode' in n&&n.layoutMode!=='NONE'){if(n.layoutMode==='HORIZONTAL'||n.layoutMode==='VERTICAL'){value.layout=n.layoutMode.toLowerCase();value.gap=n.itemSpacing;value.padding=n.paddingTop;if([n.paddingLeft,n.paddingRight,n.paddingBottom].some(v=>v!==n.paddingTop))report.push(n.name+': asymmetric padding reduced to top padding');report.push(n.name+': auto layout sizing and alignment reduced to fixed sizes');}else report.push(n.name+': grid layout reduced to positioned children');}
 if('effects' in n&&n.effects.length)report.push(n.name+': effects omitted');
 if('reactions' in n&&n.reactions.length)report.push(n.name+': prototype reactions omitted');
 if(n.type==='INSTANCE'){const main=await n.getMainComponentAsync();value.componentId=main?main.id:null;report.push(n.name+': instance appearance copied; live linkage is not guaranteed');}
 if(n.type==='COMPONENT')report.push(n.name+': variants and component property definitions omitted');
 out.push(value);if('children' in n)for(const child of n.children)await readNode(child,n.id,out,report);
}
function validate(d){
 if(!d||d.format!=='oanarina-ui'||d.version!==1||!Array.isArray(d.pages)||!d.pages.length||d.pages.length>1000)throw Error('Choose an Oanarina .oui project.');
 for(const p of d.pages){if(!Array.isArray(p.nodes)||p.nodes.length>20000)throw Error('Invalid page or too many layers.');const ids=new Set();for(const n of p.nodes){if(typeof n.id!=='string'||ids.has(n.id)||!Object.values(kinds).includes(n.type)&&!['image','arrow','slice'].includes(n.type))throw Error('Invalid layer identifier or type.');ids.add(n.id);for(const key of ['x','y','width','height','rotation','opacity','fontSize'])if(!Number.isFinite(n[key]))throw Error('Invalid numeric layer property.');if(n.width<0||n.height<0||n.width>1e6||n.height>1e6)throw Error('Layer dimensions out of range.');if(n.image&&!/^data:image\/(png|jpeg|gif|webp);base64,/.test(n.image))throw Error('Raster images only in editable Figma Bridge import. Export SVG assets separately.');}
 for(const n of p.nodes){const seen=new Set([n.id]);let id=n.parentId;while(id){if(seen.has(id))throw Error('Cyclic hierarchy.');seen.add(id);const a=p.nodes.find(n=>n.id===id);if(!a)throw Error('Missing parent.');id=a.parentId;}}}
}
async function importDocument(d){validate(d);const report=[],created=[];const fonts=await figma.listAvailableFontsAsync();
 // Validate before mutation. On failure, remove every newly created page to avoid half-imported files.
 try{for(const p of d.pages){const page=figma.createPage();page.name=p.name;created.push(page);const map=new Map(),source=new Map(p.nodes.map(n=>[n.id,n]));
 const create=async n=>{if(map.has(n.id))return map.get(n.id);const parent=n.parentId?await create(source.get(n.parentId)):page;let out;
 if(n.type==='slice'){out=figma.createSlice();}
 else if(n.type==='text'){out=figma.createText();const family=fonts.filter(f=>f.fontName.family===n.fontFamily),styles={300:'Light',400:'Regular',500:'Medium',600:'Semi Bold',700:'Bold',800:'Extra Bold'};let font=(family.find(f=>f.fontName.style===styles[n.fontWeight])||family[0]||fonts.find(f=>f.fontName.family==='Inter'&&f.fontName.style==='Regular')||fonts[0]);if(!font)throw Error('No usable font is available.');if(!family.length)report.push(n.name+': missing '+n.fontFamily+'; using '+font.fontName.family);await figma.loadFontAsync(font.fontName);out.fontName=font.fontName;out.fontSize=n.fontSize;out.characters=n.text;out.textAlignHorizontal=n.textAlign==='center'?'CENTER':n.textAlign==='right'?'RIGHT':'LEFT';out.lineHeight={unit:'PERCENT',value:n.lineHeight*100};out.letterSpacing={unit:'PIXELS',value:n.letterSpacing};}
 else if(n.type==='ellipse')out=figma.createEllipse();else if(n.type==='line'||n.type==='arrow')out=figma.createLine();else if(n.type==='polygon')out=figma.createPolygon();else if(n.type==='star')out=figma.createStar();
 else if(n.type==='path'){out=figma.createVector();const data=n.points.length?n.points.map((p,i)=>(i?'L':'M')+' '+p.x+' '+p.y).join(' '):n.path;if(data)out.vectorPaths=[{windingRule:'NONZERO',data}];}
 else if(n.type==='component')out=figma.createComponent();else if(['frame','group','instance','section'].includes(n.type)){out=figma.createFrame();if(n.type==='group'||n.type==='section')report.push(n.name+': container transferred as a frame');if(n.type==='instance')report.push(n.name+': instance transferred as editable frame without linkage');}else out=figma.createRectangle();
 if(!('appendChild' in parent))throw Error('Layer parent must be a container.');parent.appendChild(out);map.set(n.id,out);out.name=n.name;
 const pn=n.parentId?source.get(n.parentId):null;out.resize(Math.max(.01,n.width),Math.max(.01,n.type==='line'||n.type==='arrow'?0:n.height));out.x=n.x-(pn?pn.x:0);out.y=n.y-(pn?pn.y:0);out.rotation=-n.rotation;
 if('fills' in out)out.fills=/^#[0-9a-f]{6}$/i.test(n.fill)?[paint(n.fill)]:[];
 if(n.type==='image'&&n.image){const image=figma.createImage(figma.base64Decode(n.image.split(',')[1]));out.fills=[{type:'IMAGE',imageHash:image.hash,scaleMode:'FILL'}];}
 if('strokes' in out){out.strokes=/^#[0-9a-f]{6}$/i.test(n.stroke)?[paint(n.stroke)]:[];out.strokeWeight=n.strokeWidth;}
 if('cornerRadius' in out)out.cornerRadius=n.radius;if('opacity' in out)out.opacity=n.opacity;if('clipsContent' in out)out.clipsContent=n.clip;
 if(n.gradient)report.push(n.name+': gradient reduced to base color');if(n.shadow||n.blur)report.push(n.name+': effects omitted');if(n.targetId)report.push(n.name+': prototype link omitted');if(n.type==='arrow')report.push(n.name+': arrowhead omitted');
 return out;};
 for(const n of p.nodes)await create(n);
 // Set layout only after children and absolute positions are established.
 for(const n of p.nodes){const out=map.get(n.id);if(n.layout!=='none'&&'layoutMode' in out){if(n.layout==='grid')report.push(n.name+': grid transferred as free-positioned children');else{out.layoutMode=n.layout.toUpperCase();out.primaryAxisSizingMode='FIXED';out.counterAxisSizingMode='FIXED';out.itemSpacing=n.gap;out.paddingTop=n.padding;out.paddingRight=n.padding;out.paddingBottom=n.padding;out.paddingLeft=n.padding;report.push(n.name+': layout alignment uses Figma defaults');}}out.visible=n.visible;out.locked=n.locked;}
 }
 if(created[0]){await figma.setCurrentPageAsync(created[0]);figma.viewport.scrollAndZoomIntoView(created[0].children);}return report;
 }catch(e){for(const p of created)p.remove();throw e;}
}
figma.ui.onmessage=async msg=>{try{
 if(msg.type==='export'){
 const report=[],pages=[];const all=msg.scope==='all';if(all)await figma.loadAllPagesAsync();const sources=all?figma.root.children:[figma.currentPage];
 for(const p of sources){const nodes=[];const selected=msg.scope==='selection'?[...p.selection]:[...p.children];const roots=selected.filter(n=>!selected.some(other=>{let parent=n.parent;while(parent){if(parent.id===other.id)return true;parent=parent.parent;}return false;}));for(const n of roots)await readNode(n,null,nodes,report);pages.push({id:p.id,name:p.name,nodes,comments:[]});}
 const d={format:'oanarina-ui',version:1,id:'figma-'+Date.now(),name:figma.root.name,pages,colors:[],updatedAt:new Date().toISOString()};figma.ui.postMessage({type:'exported',data:d,report});
 }else if(msg.type==='import'){const report=await importDocument(msg.data);figma.ui.postMessage({type:'imported',report});figma.notify('Oanarina project imported. Review the transfer report.');}
 }catch(e){figma.ui.postMessage({type:'error',message:String(e.message||e)});}};
