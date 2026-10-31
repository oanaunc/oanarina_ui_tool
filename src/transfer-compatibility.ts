import type {DesignDocument,DesignNode} from './model';
import {fillsFor,strokesFor} from './paints';
import {prepareFigmaDelivery} from './figma-delivery';
import {documentIndexes} from './audit-index';
import type {AuditLayer} from './audit-index';
/** Document-specific interchange forecast. Each rule mirrors a behavior of the Bridge plugin or export code; none claims a real Figma round trip. */
export type TransferTarget='bridge'|'svg'|'raster';
export type TransferOutcome='kept'|'approximate'|'omitted'|'refused';
export const transferTargets:{id:TransferTarget;label:string}[]=[{id:'bridge',label:'Figma Bridge (.oui)'},{id:'svg',label:'SVG'},{id:'raster',label:'PNG / JPG'}];
export interface TransferFinding {id:string;label:string;count:number;outcomes:Record<TransferTarget,TransferOutcome>;note:string;layers:AuditLayer[];}
export interface TransferReport {findings:TransferFinding[];blocking:string[];verdict:Record<TransferTarget,TransferOutcome>;scanned:number;bridgeFacts:{commentsRemoved:number;audioRemoved:number;annotationsRemoved:number};limits:string;}
type Rule={id:string;label:string;outcomes:Record<TransferTarget,TransferOutcome>;note:string;test:(n:DesignNode)=>boolean};
const appearance={svg:'kept',raster:'kept'} as const,flat={svg:'approximate',raster:'approximate'} as const,gone={svg:'omitted',raster:'omitted'} as const;
const stroke=(n:DesignNode,test:(s:ReturnType<typeof strokesFor>[number])=>boolean)=>strokesFor(n).some(test);
const rules:Rule[]=[
 {id:'calligraphic',label:'Calligraphic strokes',outcomes:{bridge:'refused',...appearance},note:'The Bridge refuses these. Export SVG or PNG to keep the appearance.',test:n=>stroke(n,s=>s.calligraphic!==undefined)},
 {id:'dynamic-stroke',label:'Dynamic strokes',outcomes:{bridge:'refused',...appearance},note:'The Bridge refuses these. Export SVG or PNG to keep the appearance.',test:n=>stroke(n,s=>s.dynamic!==undefined)},
 {id:'variable-width',label:'Per-anchor variable-width strokes',outcomes:{bridge:'refused',...appearance},note:'The Bridge refuses these. Export SVG or PNG to keep the appearance.',test:n=>stroke(n,s=>s.variableWidth==='points')},
 {id:'edge-strokes',label:'Independent edge strokes',outcomes:{bridge:'refused',...appearance},note:'The Bridge refuses these. Export SVG or PNG to keep the appearance.',test:n=>stroke(n,s=>s.edgeWidths!==undefined)},
 {id:'vector-network',label:'Vector networks',outcomes:{bridge:'refused',...appearance},note:'Flatten the network before Bridge transfer.',test:n=>n.vectorNetwork!==undefined},
 {id:'text-path',label:'Text on path',outcomes:{bridge:'refused',...appearance},note:'The Bridge refuses text on a path.',test:n=>n.textPath!==undefined},
 {id:'progressive-blur',label:'Progressive blur',outcomes:{bridge:'refused',...appearance},note:'The Bridge refuses this approximated effect.',test:n=>!!n.effects?.some(e=>e.type==='progressive-blur')},
 {id:'surface-paint',label:'Pattern, noise and texture paints',outcomes:{bridge:'refused',...appearance},note:'Surface source metadata is refused by the Bridge.',test:n=>fillsFor(n).some(p=>p.surface!==undefined)},
 {id:'slots',label:'Component slots',outcomes:{bridge:'refused',...flat},note:'Editable slots are refused by the Bridge.',test:n=>n.slotInstance!==undefined||!!n.slotOverrides?.length},
 {id:'motion',label:'Layers in Motion timelines',outcomes:{bridge:'omitted',svg:'omitted',raster:'omitted'},note:'Only the saved base pose transfers.',test:()=>false},
 {id:'video',label:'Embedded video',outcomes:{bridge:'approximate',...flat},note:'Only the poster image transfers.',test:n=>!!n.media},
 {id:'audio',label:'Prototype audio',outcomes:{bridge:'omitted',...gone},note:'Stays in the .oui file.',test:n=>!!n.prototypeAudio},
 {id:'prototype-input',label:'Prototype form controls',outcomes:{bridge:'omitted',...gone},note:'Only the saved base artwork transfers.',test:n=>n.prototypeInput!==undefined},
 {id:'reactions',label:'Prototype interactions',outcomes:{bridge:'approximate',...gone},note:'Click, drag, hover, press, mouse and delay links transfer. Variables, conditions and key triggers do not.',test:n=>!!n.reactions?.length},
 {id:'variable-bindings',label:'Variable bindings',outcomes:{bridge:'approximate',...flat},note:'Bindings become their current literal values.',test:n=>!!n.variableBindings&&Object.keys(n.variableBindings).length>0},
 {id:'style-links',label:'Style links',outcomes:{bridge:'approximate',...flat},note:'Style links become literal values.',test:n=>!!n.styleIds&&Object.keys(n.styleIds).length>0},
 {id:'rich-text',label:'Mixed text ranges',outcomes:{bridge:'approximate',...appearance},note:'The Bridge reduces mixed ranges to base text.',test:n=>(n.textRuns?.length??0)>1},
 {id:'gradients',label:'Gradient paints',outcomes:{bridge:'approximate',...appearance},note:'Complex gradient scale and skew are approximate in the Bridge.',test:n=>[...fillsFor(n),...strokesFor(n).map(s=>s.paint)].some(p=>p.type!=='solid'&&p.type!=='image')},
 {id:'image-adjustments',label:'Image adjustments',outcomes:{bridge:'omitted',...appearance},note:'The source image transfers without its Forma adjustments.',test:n=>fillsFor(n).some(p=>p.type==='image'&&!!p.adjustments&&Object.values(p.adjustments).some(Boolean))},
 {id:'grid-layout',label:'Grid layout',outcomes:{bridge:'approximate',...flat},note:'Children keep saved positions in a free-positioned container.',test:n=>n.layout==='grid'},
 {id:'export-settings',label:'Saved export profiles',outcomes:{bridge:'omitted',...gone},note:'Profiles stay in the .oui file.',test:n=>!!n.exportSettings?.length},
 {id:'annotations',label:'Layer annotations',outcomes:{bridge:'omitted',...gone},note:'Private review metadata stays in the .oui file.',test:n=>!!n.annotations},
 {id:'dev-resources',label:'Developer resource links',outcomes:{bridge:'omitted',...gone},note:'Links stay in the .oui file.',test:n=>!!n.devResources?.length},
 {id:'fallback-fonts',label:'Ordered font fallbacks',outcomes:{bridge:'omitted',...appearance},note:'Glyph fallback in the destination depends on its fonts.',test:n=>n.fontFallbacks!==undefined},
 {id:'rotation-origin',label:'Custom rotation origins',outcomes:{bridge:'omitted',...appearance},note:'The saved pose transfers. The editing origin does not.',test:n=>n.rotationOrigin!==undefined},
];
export function transferReport(doc:DesignDocument):TransferReport{
 const counts=new Map<string,{count:number;layers:AuditLayer[]}>(),record=(id:string,layer?:AuditLayer)=>{const entry=counts.get(id)??{count:0,layers:[]};entry.count++;if(layer&&entry.layers.length<50)entry.layers.push(layer);counts.set(id,entry);};let scanned=0;
 for(const index of documentIndexes(doc)){for(const n of index.page.nodes){scanned++;for(const rule of rules)if(rule.test(n))record(rule.id,index.layer(n));}for(const track of index.page.motion?.tracks??[]){const n=index.byId.get(track.nodeId);record('motion',n?index.layer(n):undefined);}}
 const findings:TransferFinding[]=rules.flatMap(rule=>{const entry=counts.get(rule.id);return entry?[{id:rule.id,label:rule.label,count:entry.count,outcomes:rule.outcomes,note:rule.note,layers:entry.layers}]:[];});
 const delivery=prepareFigmaDelivery(doc),comments=doc.pages.reduce((sum,p)=>sum+p.comments.length,0),commentsRemoved=comments-delivery.pages.reduce((sum,p)=>sum+p.comments.length,0),audioRemoved=doc.pages.reduce((sum,p)=>sum+p.nodes.filter(n=>n.prototypeAudio).length,0)-delivery.pages.reduce((sum,p)=>sum+p.nodes.filter(n=>n.prototypeAudio).length,0),annotationsRemoved=doc.pages.reduce((sum,p)=>sum+p.nodes.filter(n=>n.annotations).length,0)-delivery.pages.reduce((sum,p)=>sum+p.nodes.filter(n=>n.annotations).length,0);
 if(commentsRemoved)findings.push({id:'comments',label:'Comments',count:commentsRemoved,outcomes:{bridge:'omitted',...gone},note:'Comment threads stay in the .oui file.',layers:[]});
 if(doc.componentLibraries?.length||doc.libraryPublication)findings.push({id:'libraries',label:'Local library links',count:(doc.componentLibraries?.length??0)+(doc.libraryPublication?1:0),outcomes:{bridge:'omitted',...gone},note:'Cached components transfer as local definitions without library identity.',layers:[]});
 if(doc.variables?.length||doc.styles?.length)findings.push({id:'definitions',label:'Variable and style definitions',count:(doc.variables?.length??0)+(doc.styles?.length??0),outcomes:{bridge:'omitted',...gone},note:'Definitions are not transferred, only their current values.',layers:[]});
 const rank:TransferOutcome[]=['kept','approximate','omitted','refused'],verdict=Object.fromEntries(transferTargets.map(t=>[t.id,findings.reduce<TransferOutcome>((worst,f)=>rank.indexOf(f.outcomes[t.id])>rank.indexOf(worst)?f.outcomes[t.id]:worst,'kept')])) as Record<TransferTarget,TransferOutcome>;
 return {findings,blocking:findings.filter(f=>f.outcomes.bridge==='refused').map(f=>f.label),verdict,scanned,bridgeFacts:{commentsRemoved,audioRemoved,annotationsRemoved},limits:'A forecast from saved document data and the Bridge source. It is not a real Figma desktop plugin round trip, and fonts are reported by the plugin at import.'};
}
