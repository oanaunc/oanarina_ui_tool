// Source asset snapshot from the pinned installed Lucide dependency, never user artwork.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),pkg=require('lucide-react/package.json');
if(pkg.version!=='0.577.0')throw Error('Review the Lucide version/license before updating this catalog.');
const {default:loaders}=await import('lucide-react/dynamicIconImports.mjs'),icons=[];
for(const name of Object.keys(loaders).sort()){
 if(/fig(?:ma|jam)/i.test(name))continue;
 const {__iconNode:paths}=await loaders[name]();if(!Array.isArray(paths)||!paths.length||paths.length>100)throw Error('Invalid Lucide geometry: '+name);
 icons.push({name,paths:paths.map(([tag,attributes])=>[tag,Object.fromEntries(Object.entries(attributes).filter(([key])=>key!=='key'))])});
}
const catalog={format:'forma-icon-catalog',version:1,library:'Lucide',libraryVersion:pkg.version,license:'ISC / Feather MIT portions',licensePath:'./licenses/lucide.txt',icons};
await fs.mkdir('public/licenses',{recursive:true});await fs.copyFile(require.resolve('lucide-react/LICENSE'),'public/licenses/lucide.txt');
await fs.writeFile('public/icon-catalog.json',JSON.stringify(catalog)+'\n');console.log('Recorded '+icons.length+' original Lucide icon entries and the complete redistribution license.');
