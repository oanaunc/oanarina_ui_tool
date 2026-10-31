// Re-pins the guest frame's only trusted script after editing it. tests/guest-frame-source.test.ts recomputes the same hash.
import {createHash} from 'node:crypto';
import fs from 'node:fs';
const path=new URL('../public/local-guest-frame.html',import.meta.url),html=fs.readFileSync(path,'utf8'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if(scripts.length!==1)throw Error('The guest frame must hold exactly one inline script.');
const hash=createHash('sha256').update(scripts[0][1]).digest('base64');
fs.writeFileSync(path,html.replace(/script-src 'sha256-[^']*'/,`script-src 'sha256-${hash}'`));
console.log('sha256-'+hash);
