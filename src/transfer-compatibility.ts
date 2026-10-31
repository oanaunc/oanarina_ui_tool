import type {DesignDocument,DesignNode} from './model';
import {documentIndexes} from './audit-index';
import type {AuditLayer} from './audit-index';
/** Document-specific export forecast. Each rule mirrors a behavior of the export code. */
export type TransferTarget='svg'|'raster';
export type TransferOutcome='kept'|'approximate'|'omitted';
export const transferTargets:{id:TransferTarget;label:string}[]=[{id:'svg',label:'SVG'},{id:'raster',label:'PNG / JPG'}];
export interface TransferFinding {id:string;label:string;count:number;outcomes:Record<TransferTarget,TransferOutcome>;note:string;layers:AuditLayer[];}
export interface TransferReport {findings:TransferFinding[];verdict:Record<TransferTarget,TransferOutcome>;scanned:number;limits:string;}
type Rule={id:string;label:string;outcomes:Record<TransferTarget,TransferOutcome>;note:string;test:(n:DesignNode)=>boolean};
const flat={svg:'approximate',raster:'approximate'} as const,gone={svg:'omitted',raster:'omitted'} as const;
const rules:Rule[]=[
 {id:'slots',label:'Component slots',outcomes:flat,note:'Slots export as their current appearance.',test:n=>n.slotInstance!==undefined||!!n.slotOverrides?.length},
 {id:'motion',label:'Layers in Motion timelines',outcomes:gone,note:'Only the saved base pose transfers.',test:()=>false},
 {id:'video',label:'Embedded video',outcomes:flat,note:'Only the poster image transfers.',test:n=>!!n.media},
 {id:'audio',label:'Prototype audio',outcomes:gone,note:'Stays in the .oui file.',test:n=>!!n.prototypeAudio},
 {id:'prototype-input',label:'Prototype form controls',outcomes:gone,note:'Only the saved base artwork transfers.',test:n=>n.prototypeInput!==undefined},
 {id:'reactions',label:'Prototype interactions',outcomes:gone,note:'Stays in the .oui file.',test:n=>!!n.reactions?.length},
 {id:'variable-bindings',label:'Variable bindings',outcomes:flat,note:'Bindings become their current literal values.',test:n=>!!n.variableBindings&&Object.keys(n.variableBindings).length>0},
 {id:'style-links',label:'Style links',outcomes:flat,note:'Style links become literal values.',test:n=>!!n.styleIds&&Object.keys(n.styleIds).length>0},
 {id:'grid-layout',label:'Grid layout',outcomes:flat,note:'Children keep their saved positions.',test:n=>n.layout==='grid'},
 {id:'export-settings',label:'Saved export profiles',outcomes:gone,note:'Profiles stay in the .oui file.',test:n=>!!n.exportSettings?.length},
 {id:'annotations',label:'Layer annotations',outcomes:gone,note:'Private review metadata stays in the .oui file.',test:n=>!!n.annotations},
 {id:'dev-resources',label:'Developer resource links',outcomes:gone,note:'Links stay in the .oui file.',test:n=>!!n.devResources?.length},
];
export function transferReport(doc:DesignDocument):TransferReport{
 const counts=new Map<string,{count:number;layers:AuditLayer[]}>(),record=(id:string,layer?:AuditLayer)=>{const entry=counts.get(id)??{count:0,layers:[]};entry.count++;if(layer&&entry.layers.length<50)entry.layers.push(layer);counts.set(id,entry);};let scanned=0;
 for(const index of documentIndexes(doc)){for(const n of index.page.nodes){scanned++;for(const rule of rules)if(rule.test(n))record(rule.id,index.layer(n));}for(const track of index.page.motion?.tracks??[]){const n=index.byId.get(track.nodeId);record('motion',n?index.layer(n):undefined);}}
 const findings:TransferFinding[]=rules.flatMap(rule=>{const entry=counts.get(rule.id);return entry?[{id:rule.id,label:rule.label,count:entry.count,outcomes:rule.outcomes,note:rule.note,layers:entry.layers}]:[];});
 const comments=doc.pages.reduce((sum,p)=>sum+p.comments.length,0);
 if(comments)findings.push({id:'comments',label:'Comments',count:comments,outcomes:gone,note:'Comment threads stay in the .oui file.',layers:[]});
 if(doc.componentLibraries?.length||doc.libraryPublication)findings.push({id:'libraries',label:'Local library links',count:(doc.componentLibraries?.length??0)+(doc.libraryPublication?1:0),outcomes:gone,note:'Library links stay in the .oui file.',layers:[]});
 if(doc.variables?.length||doc.styles?.length)findings.push({id:'definitions',label:'Variable and style definitions',count:(doc.variables?.length??0)+(doc.styles?.length??0),outcomes:gone,note:'Definitions are not transferred, only their current values.',layers:[]});
 const rank:TransferOutcome[]=['kept','approximate','omitted'],verdict=Object.fromEntries(transferTargets.map(t=>[t.id,findings.reduce<TransferOutcome>((worst,f)=>rank.indexOf(f.outcomes[t.id])>rank.indexOf(worst)?f.outcomes[t.id]:worst,'kept')])) as Record<TransferTarget,TransferOutcome>;
 return {findings,verdict,scanned,limits:'A forecast from saved document data and the export code, not a comparison of exported files.'};
}
