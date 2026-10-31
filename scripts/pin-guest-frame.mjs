// Re-pins the only trusted script in each opaque resource after editing it. tests/guest-dom-worker.test.ts and tests/local-plugin-sandbox-source.test.ts recompute the same hashes.
import {createHash} from 'node:crypto';
import fs from 'node:fs';
for(const name of ['local-guest-frame.html','local-plugin-guardian.html']){const path=new URL('../public/'+name,import.meta.url),html=fs.readFileSync(path,'utf8'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if(scripts.length!==1)throw Error(name+' must hold exactly one inline script.');
const hash=createHash('sha256').update(scripts[0][1]).digest('base64');
fs.writeFileSync(path,html.replace(/script-src 'sha256-[^']*'/,`script-src 'sha256-${hash}'`));
console.log(name,'sha256-'+hash);}
