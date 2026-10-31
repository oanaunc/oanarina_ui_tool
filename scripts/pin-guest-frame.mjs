// Re-pins the trusted scripts of each opaque resource after editing them. tests/guest-dom-worker.test.ts, tests/local-plugin-sandbox-source.test.ts and tests/site.test.ts recompute the same hashes.
import {createHash} from 'node:crypto';
import fs from 'node:fs';
const digest=text=>'sha256-'+createHash('sha256').update(text).digest('base64');
for(const name of ['local-guest-frame.html','local-plugin-guardian.html']){const path=new URL('../public/'+name,import.meta.url),html=fs.readFileSync(path,'utf8'),scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if(scripts.length!==1)throw Error(name+' must hold exactly one inline script.');
fs.writeFileSync(path,html.replace(/script-src 'sha256-[^']*'/,`script-src '${digest(scripts[0][1])}'`));console.log(name,digest(scripts[0][1]));}
const preview=new URL('../public/site-preview.html',import.meta.url),html=fs.readFileSync(preview,'utf8'),[own]=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)],{SITE_RUNTIME}=await import('../src/site-runtime.ts');
fs.writeFileSync(preview,html.replace(/script-src 'sha256-[^']*' 'sha256-[^']*'/,`script-src '${digest(SITE_RUNTIME)}' '${digest(own[1])}'`));console.log('site-preview.html',digest(SITE_RUNTIME));
