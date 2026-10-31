import path from 'node:path';
import {realpathSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Project} from './project';
import {exportPageSvg} from './svg';
import {queryInstalledFonts} from './installed-fonts';
import {operationList} from './server';
import type {Operation} from './project';

const usage=`Forma local automation (no network, no account)
Usage: automation --project /absolute/project.oui <command> [options]
  inspect                          Document metadata, pages and current revision
  validate                         Run the shared document validators
  read-nodes --page ID [--query Q] Layers of one page, without embedded assets
  apply --revision SHA             Atomic operations as a JSON array on standard input
  undo --revision SHA              Undo the latest MCP or automation transaction
  undo-status                      Retained Undo count and availability
  fonts [--query Q]                Installed font families on this machine
  export-svg --page ID             SVG for a vector/text page`;
const flags=['--project','--revision','--page','--query'],commands=['inspect','validate','read-nodes','apply','undo','undo-status','fonts','export-svg'];
const STDIN_LIMIT=50_000_000;
function parse(args:string[]){const values:Record<string,string>={},rest:string[]=[];for(let i=0;i<args.length;i++){const arg=args[i];if(flags.includes(arg)){if(args[i+1]===undefined||args[i+1].startsWith('--'))throw Error('Missing value for '+arg+'.');values[arg]=args[++i];}else if(arg.startsWith('--'))throw Error('Unknown option '+arg+'.');else rest.push(arg);}if(rest.length!==1||!commands.includes(rest[0]))throw Error('Choose one command.\n'+usage);if(!values['--project'])throw Error('--project is required.\n'+usage);return {command:rest[0],values};}
const required=(values:Record<string,string>,flag:string)=>{const value=values[flag];if(!value)throw Error(flag+' is required for this command.');return value;};
async function readJson(input:AsyncIterable<Buffer|string>){const chunks:Buffer[]=[];let total=0;for await (const chunk of input){const bytes=Buffer.from(chunk);total+=bytes.length;if(total>STDIN_LIMIT)throw Error('Standard input exceeds 50 MB.');chunks.push(bytes);}let value:unknown;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('Standard input must be a JSON array of operations.');}return value;}
/** The same project transactions, revision checks and validators as the MCP tools, for scripts without an MCP host. */
export async function runAutomation(args:string[],input:AsyncIterable<Buffer|string>):Promise<unknown>{
 const {command,values}=parse(args),project=await Project.open(values['--project']);
 if(command==='inspect'){const {document:d,revision}=await project.read();return {revision,id:d.id,name:d.name,pages:d.pages.map(p=>({id:p.id,name:p.name,nodes:p.nodes.length}))};}
 if(command==='validate')return {valid:true,revision:(await project.read()).revision};
 if(command==='undo-status')return project.undoStatus();
 if(command==='fonts'){const {document}=await project.read();return queryInstalledFonts({query:values['--query'],offset:0,limit:500},document);}
 if(command==='read-nodes'){const {document,revision}=await project.read(),page=document.pages.find(p=>p.id===required(values,'--page'));if(!page)throw Error('Page not found.');const query=values['--query']?.toLowerCase();return {revision,nodes:page.nodes.filter(n=>!query||(n.name+' '+n.text).toLowerCase().includes(query)).map(({id,type,name,x,y,width,height,parentId})=>({id,type,name,parentId,x,y,width,height}))};}
 if(command==='export-svg'){const {document,revision}=await project.read();return {revision,...exportPageSvg(document,required(values,'--page'))};}
 if(command==='undo'){const r=await project.undo(required(values,'--revision'));return {revision:r.revision,results:r.results};}
 const revision=required(values,'--revision'),parsed=operationList.safeParse(await readJson(input));if(!parsed.success)throw Error('Standard input must be a JSON array of 1 to 500 valid operations.');const r=await project.apply(revision,parsed.data as Operation[]);return {revision:r.revision,results:r.results};
}
if(process.argv[1]&&realpathSync(path.resolve(process.argv[1]))===realpathSync(fileURLToPath(import.meta.url))){const args=process.argv.slice(2);if(args.includes('--help'))process.stdout.write(usage+'\n');else runAutomation(args,process.stdin).then(value=>{process.stdout.write(JSON.stringify(value)+'\n');}).catch(e=>{process.stderr.write(JSON.stringify({error:(e as Error).message})+'\n');process.exitCode=1;});}
