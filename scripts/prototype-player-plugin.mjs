import {resolve} from 'node:path';
import {build} from 'vite';
/** Builds the exported prototype player and offers it to the editor as a lazy string, in dev and in production.
 * JSX is set explicitly, so a build started inside the dev server still uses the production React runtime.
 * Nothing generated is committed. The editor store is swapped for a small stand-in, so the file carries the real
 * presentation renderer without the editor, the importers or their workers. */
const id='virtual:forma-prototype-player',resolved='\0'+id;
export async function buildPrototypePlayer(root=process.cwd()){
 const stands=new Map([['src/store.ts','src/player/player-store.ts'],['src/components/MotionPreviewTransport.tsx','src/player/player-motion-transport.ts']].map(([from,to])=>[resolve(root,from),resolve(root,to)]));
 const swap={name:'forma-player-stands',enforce:'pre',async resolveId(source,importer,options){if(!importer||!/(^|\/)(store|MotionPreviewTransport)$/.test(source))return null;const found=await this.resolve(source,importer,{...options,skipSelf:true});return stands.get(found?.id)??null;}};
 const result=await build({root,configFile:false,logLevel:'silent',mode:'production',publicDir:false,plugins:[swap],oxc:{jsx:{runtime:'automatic',development:false}},define:{'process.env.NODE_ENV':'"production"'},build:{write:false,minify:true,cssCodeSplit:false,assetsInlineLimit:Number.MAX_SAFE_INTEGER,lib:{entry:resolve(root,'src/player/player-main.tsx'),formats:['iife'],name:'FormaPrototypePlayer',fileName:()=>'player.js'}}});
 const output=(Array.isArray(result)?result:[result]).flatMap(r=>r.output),js=output.find(f=>f.type==='chunk')?.code,css=output.find(f=>f.fileName.endsWith('.css'))?.source;
 const extra=output.filter(f=>f.type==='chunk'?f.code!==js:!f.fileName.endsWith('.css'));if(!js||typeof css!=='string'||extra.length)throw Error('The prototype player must build to one script and one stylesheet.');return {js,css};
}
export function prototypePlayer(){let root=process.cwd();return {name:'forma-prototype-player',configResolved(config){root=config.root;},resolveId(source){return source===id?resolved:null;},async load(source){if(source!==resolved)return null;return 'export default '+JSON.stringify(await buildPrototypePlayer(root));}};}
