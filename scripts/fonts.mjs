import fs from 'node:fs';
const raw=fs.readFileSync('/tmp/oanarina-google-fonts.json','utf8');
const meta=JSON.parse(raw.slice(raw.indexOf('{'))).familyMetadataList;
const popular=['Inter','Roboto','Open Sans','Lato','Montserrat','Poppins','Raleway','Nunito','Work Sans','DM Sans','Space Grotesk','Plus Jakarta Sans','Playfair Display','Cormorant Garamond','Lora','Merriweather','Libre Baskerville','Bebas Neue','Oswald','Caveat','Dancing Script','Pacifico','JetBrains Mono','Fira Code'];
const catalog=meta.filter(f=>f.isOpenSource).map(f=>({family:f.family,category:f.category,subsets:f.subsets,weights:Object.keys(f.fonts).filter(w=>!w.endsWith('i')).map(Number),axes:f.axes,popularity:f.popularity,designers:f.designers,bundled:popular.includes(f.family)}));
fs.mkdirSync('public/fonts',{recursive:true});fs.writeFileSync('public/font-catalog.json',JSON.stringify({source:'https://fonts.google.com/metadata/fonts',fetchedAt:new Date().toISOString(),families:catalog}));
const assets=[];let allCss='';
for(const family of popular){
 const f=catalog.find(f=>f.family===family),axis=f.axes.find(a=>a.tag==='wght');
 const spec=axis?`:wght@${axis.min}..${axis.max}`:':wght@'+[400,700].filter(w=>f.weights.includes(w)).join(';');
 const res=await fetch('https://fonts.googleapis.com/css2?family='+encodeURIComponent(family)+spec+'&display=swap',{headers:{'User-Agent':'Mozilla/5.0'}});if(!res.ok)throw Error(family+' '+res.status);
 let css=await res.text();let i=0;const slug=family.toLowerCase().replaceAll(' ','');
 for(const match of [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)]){const url=match[1],font=await fetch(url);if(!font.ok)throw Error('Font download failed');const bytes=new Uint8Array(await font.arrayBuffer()),name=`${slug}-${i++}.ttf`;fs.writeFileSync('public/fonts/'+name,bytes);css=css.replace(url,'./'+name);const block=css.slice(css.lastIndexOf('@font-face',css.indexOf('./'+name)),css.indexOf('./'+name));const weight=block.match(/font-weight:\s*([^;]+)/)?.[1]??'400';assets.push({family,weight,path:'./fonts/'+name});}
 allCss+=css+'\n';
 const license=await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/'+slug+'/OFL.txt');if(!license.ok)throw Error('Missing OFL license '+family);fs.writeFileSync('public/fonts/'+slug+'-OFL.txt',await license.text());console.log('Bundled '+family);
}
fs.writeFileSync('public/fonts/fonts.css',allCss);fs.writeFileSync('public/fonts/assets.json',JSON.stringify(assets));
