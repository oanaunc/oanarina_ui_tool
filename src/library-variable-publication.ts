import type {DesignDocument,DesignNode} from './model';
/** Leaf names starting with a dot or underscore stay out of a publication, the way designers already mark working parts. */
export function hiddenByName(name:string){const leaf=name.split('/').at(-1)?.trim()??'';return leaf.startsWith('.')||leaf.startsWith('_');}
/** Keys this file chose not to publish, separate from the name convention above. */
export function excludedAssetKeys(d:Pick<DesignDocument,'libraryPublication'>){return new Set(d.libraryPublication?.excludedAssets??[]);}
/** Collections the source chose not to publish. Everything else keeps the existing publish-all behavior. */
export function excludedCollectionIds(d:Pick<DesignDocument,'libraryPublication'|'variableCollections'>){const known=new Set((d.variableCollections??[]).map(c=>c.id));return new Set((d.libraryPublication?.excludedCollections??[]).filter(id=>known.has(id)));}
function actionVariables(actions:NonNullable<DesignNode['reactions']>[number]['actions'],depth=0):(string|undefined)[]{if(depth>16)return [];return actions.flatMap(a=>[a.variableId,...(a.branches??[]).flatMap(b=>actionVariables(b.actions,depth+1))]);}
/** Refuses a publication that would leave a reference behind, and names what to fix rather than failing later in graph indexing. */
export function assertPublishableCollections(source:DesignDocument,kept:readonly DesignNode[],excluded:ReadonlySet<string>){
 if(!excluded.size)return;const variables=new Map((source.variables??[]).map(v=>[v.id,v])),hidden=(id:string|undefined|null)=>{const v=id?variables.get(id):undefined;return v&&excluded.has(v.collectionId)?v:undefined;},collectionName=(id:string)=>source.variableCollections?.find(c=>c.id===id)?.name??id;
 for(const v of source.variables??[])if(!excluded.has(v.collectionId))for(const value of Object.values(v.values))if(value&&typeof value==='object'){const target=hidden(value.alias);if(target)throw Error('Variable “'+v.name+'” aliases “'+target.name+'” in the unpublished collection “'+collectionName(target.collectionId)+'”. Publish that collection or replace the alias.');}
 for(const n of kept)for(const id of [...Object.values(n.variableBindings??{}),n.prototypeInput?.variableId,...(n.reactions??[]).flatMap(r=>actionVariables(r.actions))]){const target=hidden(id);if(target)throw Error('Layer “'+n.name+'” uses “'+target.name+'” from the unpublished collection “'+collectionName(target.collectionId)+'”. Publish that collection or remove the binding.');}
}
export function withoutCollections(modes:Record<string,string>|undefined,excluded:ReadonlySet<string>){if(!modes||!excluded.size)return modes;return Object.fromEntries(Object.entries(modes).filter(([id])=>!excluded.has(id)));}
