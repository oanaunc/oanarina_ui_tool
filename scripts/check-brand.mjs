// The owner's rule: the reference tool's name stays out of everything that ships.
// Usage: node scripts/check-brand.mjs [--dist <folder>] [--app <Forma.app>]
// Scans dist always, and the whole app bundle when given one. Exits 0 only when both are complete and clean.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {unzipSync} from 'fflate';

const NAME=/fig(?:ma|jam)/gi;
// One pattern covers both byte orders, since the zero bytes sit between the same letters.
const WIDE=/f\0i\0g\0(?:m\0a|j\0a\0m)/gi;
const ZIP_MAGIC=[0x50,0x4b,0x03,0x04];
const CONTEXT=32;

export class IncompleteScan extends Error {}

const printable=text=>text.replace(/[^\x20-\x7e]/g,'.');
const isZip=(name,bytes)=>/\.zip$/i.test(name)||ZIP_MAGIC.every((value,index)=>bytes[index]===value);
function report(hits,where,kind,detail=''){hits.push({where,kind,detail});}
function scanText(hits,where,kind,text){NAME.lastIndex=0;if(NAME.test(text))report(hits,where,kind,printable(text));}
function scanBytes(hits,where,bytes){
 const text=Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength).toString('latin1');
 for(const [pattern,encoding] of [[NAME,'ASCII'],[WIDE,'UTF-16']]){
  pattern.lastIndex=0;
  for(let match=pattern.exec(text);match;match=pattern.exec(text))report(hits,where,encoding,`offset ${match.index}: ${printable(text.slice(Math.max(0,match.index-CONTEXT),match.index+match[0].length+CONTEXT))}`);
 }
}
/** Unpacks rather than byte-matching, because deflate hides the name from a search over the archive itself. */
function scanArchive(hits,stats,where,bytes){
 let entries;
 try{entries=unzipSync(bytes);}catch(error){report(hits,where,'unreadable archive',error.message);return;}
 for(const [name,content] of Object.entries(entries)){
  const inner=where+'!/'+name;stats.entries++;stats.bytes+=content.length;
  scanText(hits,inner,'file name',name);
  scanBytes(hits,inner,content);
  if(isZip(name,content))scanArchive(hits,stats,inner,content);
 }
}
function scanTree(hits,stats,root,label){
 const walk=directory=>{
  for(const entry of fs.readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
   const full=path.join(directory,entry.name),where=label+'/'+path.relative(root,full).split(path.sep).join('/');
   scanText(hits,where,'file name',entry.name);
   if(entry.isSymbolicLink())scanText(hits,where,'link target',fs.readlinkSync(full));
   else if(entry.isDirectory())walk(full);
   else if(entry.isFile()){
    const bytes=fs.readFileSync(full);stats.files++;stats.bytes+=bytes.length;
    scanBytes(hits,where,bytes);
    if(isZip(entry.name,bytes))scanArchive(hits,stats,where,bytes);
   }else throw new IncompleteScan(`Unexpected item that cannot be scanned: ${where}`);
  }
 };
 walk(root);
}
function requireFolder(folder,description){if(!fs.statSync(folder,{throwIfNoEntry:false})?.isDirectory())throw new IncompleteScan(`Required folder is missing: ${folder} (${description})`);}
function requireFiles(folder,description,accept=()=>true){requireFolder(folder,description);if(!fs.readdirSync(folder).some(accept))throw new IncompleteScan(`Required content is missing from ${folder} (${description})`);}

export function scanDist(dist){
 requireFiles(dist,'the built editor');
 const hits=[],stats={files:0,entries:0,bytes:0};
 scanTree(hits,stats,dist,path.basename(path.resolve(dist)));
 if(!stats.files)throw new IncompleteScan(`No files were found under ${dist}`);
 return {hits,stats};
}
/** A property list can be binary, so each one is also read as text, including those in nested bundles. */
function scanPropertyLists(hits,root,label){
 let count=0;
 const walk=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const full=path.join(directory,entry.name);
  if(entry.isDirectory())walk(full);
  else if(entry.isFile()&&entry.name==='Info.plist'){
   count++;
   let text;
   try{text=execFileSync('/usr/bin/plutil',['-convert','xml1','-o','-',full],{encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:1<<26});}
   catch{throw new IncompleteScan(`Could not read property list: ${full}`);}
   scanText(hits,label+'/'+path.relative(root,full).split(path.sep).join('/'),'Info.plist',text);
  }
 }};
 walk(root);
 return count;
}
export function scanApp(app){
 const contents=path.join(app,'Contents');
 requireFolder(app,'the app bundle');
 requireFolder(contents,'bundle contents');
 requireFiles(path.join(contents,'MacOS'),'the executable');
 requireFiles(path.join(contents,'PlugIns'),'app extensions',name=>name.endsWith('.appex'));
 requireFiles(path.join(contents,'Resources','editor'),'the bundled editor');
 if(!fs.statSync(path.join(contents,'Info.plist'),{throwIfNoEntry:false})?.isFile())throw new IncompleteScan(`Required file is missing: ${path.join(contents,'Info.plist')}`);
 const hits=[],stats={files:0,entries:0,bytes:0},label=path.basename(path.resolve(app));
 scanTree(hits,stats,app,label);
 stats.propertyLists=scanPropertyLists(hits,app,label);
 return {hits,stats};
}

const summary=(name,{stats})=>`${name}: ${stats.files} files, ${stats.entries} archive entries, ${(stats.bytes/1048576).toFixed(1)} MB${stats.propertyLists?`, ${stats.propertyLists} property lists`:''}`;
function main(argv){
 const options={dist:'dist'};
 for(let i=0;i<argv.length;i+=2){
  const flag=argv[i],value=argv[i+1];
  if(!['--dist','--app'].includes(flag)||!value)throw new IncompleteScan('Usage: node scripts/check-brand.mjs [--dist <folder>] [--app <Forma.app>]');
  options[flag.slice(2)]=value;
 }
 const results=[['dist',scanDist(options.dist)]];
 if(options.app)results.push(['app',scanApp(options.app)]);
 for(const [name,result] of results)console.log('Brand gate scanned '+summary(name,result));
 const hits=results.flatMap(([,result])=>result.hits);
 if(!hits.length){console.log('Brand gate passed: no hits.');return 0;}
 console.error(`Brand gate failed: ${hits.length} hits.`);
 for(const hit of hits)console.error(`  ${hit.where} [${hit.kind}] ${hit.detail}`);
 return 1;
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){
 try{process.exitCode=main(process.argv.slice(2));}
 catch(error){if(!(error instanceof IncompleteScan))throw error;console.error('Brand gate could not finish: '+error.message);process.exitCode=2;}
}
