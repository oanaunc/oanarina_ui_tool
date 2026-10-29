/** Rebuild the open font catalog/assets from an explicit saved official snapshot.
 * --reuse-assets updates metadata without network requests or replacing font bytes.
 * Download mode records the immutable Google asset URL and a SHA-256 per asset.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2),value=flag=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1];};
if(args.includes('--help')){console.log('node scripts/fonts.mjs --metadata /path/google-fonts.json [--snapshot-date ISO_DATE] [--reuse-assets]');process.exit(0);}
const metadataPath=value('--metadata');if(!metadataPath)throw Error('Pass --metadata with a saved response from https://fonts.google.com/metadata/fonts.');
const raw=fs.readFileSync(metadataPath,'utf8'),snapshot=JSON.parse(raw.slice(raw.indexOf('{'))),meta=snapshot.familyMetadataList;if(!Array.isArray(meta)||meta.length<100)throw Error('Invalid official Google Fonts metadata snapshot.');
const prior=fs.existsSync('public/font-catalog.json')?JSON.parse(fs.readFileSync('public/font-catalog.json','utf8')):null,date=value('--snapshot-date')??prior?.fetchedAt;if(!date||!Number.isFinite(Date.parse(date)))throw Error('Pass --snapshot-date with the snapshot retrieval date.');
const popular=['Inter','Roboto','Open Sans','Lato','Montserrat','Poppins','Raleway','Nunito','Work Sans','DM Sans','Space Grotesk','Plus Jakarta Sans','Playfair Display','Cormorant Garamond','Lora','Merriweather','Libre Baskerville','Bebas Neue','Oswald','Caveat','Dancing Script','Pacifico','JetBrains Mono','Fira Code'];
const catalog=meta.filter(f=>f.isOpenSource).map(f=>({family:f.family,category:f.category,subsets:f.subsets,weights:Object.keys(f.fonts).filter(w=>!w.endsWith('i')).map(Number).sort((a,b)=>a-b),axes:f.axes,popularity:f.popularity,designers:f.designers,bundled:popular.includes(f.family),italicWeights:Object.keys(f.fonts).filter(w=>w.endsWith('i')).map(w=>Number(w.slice(0,-1))).sort((a,b)=>a-b)}));
if(popular.some(name=>!catalog.some(f=>f.family===name)))throw Error('A bundled family is missing or no longer marked open source; inspect the snapshot before changing licenses.');
fs.mkdirSync('public/fonts',{recursive:true});
const catalogJson=JSON.stringify({source:'https://fonts.google.com/metadata/fonts',fetchedAt:new Date(date).toISOString(),families:catalog});
if(args.includes('--reuse-assets')){const assets=JSON.parse(fs.readFileSync('public/fonts/assets.json','utf8'));for(const family of popular){const slug=family.toLowerCase().replaceAll(' ','');if(!fs.existsSync(`public/fonts/${slug}-OFL.txt`))throw Error('Missing existing OFL license '+family);const rows=assets.filter(a=>a.family===family);if(!rows.length)throw Error('Missing existing assets '+family);if(catalog.find(f=>f.family===family).italicWeights.length&&!rows.some(a=>a.style==='italic'))throw Error('Missing italic assets for '+family+'; run download mode.');for(const a of rows){if(!/^\.\/fonts\/[a-z0-9-]+\.(?:ttf|woff2)$/.test(a.path))throw Error('Invalid asset path.');const data=fs.readFileSync(path.join('public',a.path));if(a.sha256&&createHash('sha256').update(data).digest('hex')!==a.sha256)throw Error('Asset digest mismatch '+a.path);}}
 // Keep the already verified files, stylesheet, manifest and per-family licenses intact.
 fs.writeFileSync('public/font-catalog.json',catalogJson);console.log('Updated snapshot metadata; retained normal and italic offline assets.');process.exit(0);}
const assets=[],staged=new Map();let allCss='';
for(const family of popular){const f=catalog.find(f=>f.family===family),axis=f.axes.find(a=>a.tag==='wght'),slug=family.toLowerCase().replaceAll(' ','');
 // A current Google Fonts family in this bundle must retain its open license.
 const license=await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/'+slug+'/OFL.txt');if(!license.ok)throw Error('Missing OFL license '+family);const licenseText=await license.text();if(!licenseText.includes('SIL OPEN FONT LICENSE'))throw Error('Unexpected license text '+family);
 for(const style of ['normal',...(f.italicWeights.length?['italic']:[])]){const weights=style==='italic'?f.italicWeights:f.weights,weightSpec=axis?`${axis.min}..${axis.max}`:style==='italic'?weights.join(';'):[400,700].filter(w=>weights.includes(w)).join(';'),spec=style==='italic'?':ital,wght@'+weightSpec.split(';').map(w=>'1,'+w).join(';'):':wght@'+weightSpec;
 const res=await fetch('https://fonts.googleapis.com/css2?family='+encodeURIComponent(family)+spec+'&display=swap',{headers:{'User-Agent':'Mozilla/5.0'}});if(!res.ok)throw Error(family+' '+style+' '+res.status);let css=await res.text(),i=0;
 for(const match of [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)]){const url=match[1],font=await fetch(url);if(!font.ok)throw Error('Font download failed');const bytes=new Uint8Array(await font.arrayBuffer());if(!bytes.byteLength||bytes.byteLength>20_000_000)throw Error('Unexpected font size');const ext=new DataView(bytes.buffer).getUint32(0)===0x774f4632?'woff2':'ttf',name=`${slug}-${style==='italic'?'italic-':''}${i++}.${ext}`;css=css.replace(url,'./'+name);const block=css.slice(css.lastIndexOf('@font-face',css.indexOf('./'+name)),css.indexOf('./'+name)),weight=block.match(/font-weight:\s*([^;]+)/)?.[1]??'400',fontStyle=block.match(/font-style:\s*([^;]+)/)?.[1]??'normal';if(fontStyle!==style)throw Error('Google returned a different font style.');staged.set('public/fonts/'+name,bytes);assets.push({family,weight,...(style==='italic'?{style}:{}),path:'./fonts/'+name,source:url,sha256:createHash('sha256').update(bytes).digest('hex')});}
 if(!i)throw Error('No font faces returned for '+family+' '+style);allCss+=css+'\n';}
 staged.set('public/fonts/'+slug+'-OFL.txt',licenseText);console.log('Bundled normal/available italic faces: '+family);
}
// Publish files only after every family and license completed, using atomic file swaps.
for(const [file,contents] of staged){const temp=file+'.tmp';fs.writeFileSync(temp,contents);fs.renameSync(temp,file);}
fs.writeFileSync('public/fonts/fonts.css',allCss);fs.writeFileSync('public/fonts/assets.json',JSON.stringify(assets));fs.writeFileSync('public/font-catalog.json',catalogJson);
