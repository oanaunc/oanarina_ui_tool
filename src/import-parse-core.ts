import {isDesignJson} from './design-json-import';
import {packedProject} from './image-sharing';
import {parseDocument} from './model';
import type {DesignDocument} from './model';
import {parseEditableSvg} from './svg-import';
export type ImportParseJob={kind:'project';raw:string}|{kind:'svg';raw:string;name:string}|{kind:'validate';document:DesignDocument};
export function runImportParseJob(job:ImportParseJob):unknown{
 if(job.kind==='project')return isDesignJson(JSON.parse(job.raw))?{rest:true}:{document:parseDocument(job.raw)};
 if(job.kind==='svg')return parseEditableSvg(job.raw,job.name);
 const raw=packedProject(job.document);if(new TextEncoder().encode(raw).length>50_000_000)throw Error('Choose a project smaller than 50 MB.');return parseDocument(raw);
}
