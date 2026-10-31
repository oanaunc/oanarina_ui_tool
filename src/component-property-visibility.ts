import type {DesignDocument,DesignNode} from './model';
import type {ComponentProperty} from './components-model';
import {assertComponentManagerEditable} from './component-workflows';

export interface PropertyRelevance {property:ComponentProperty;hidden:boolean;reason:string;}
/** Presentation policy only: never remove authored values or alter generated artwork. */
export function componentPropertyRelevance(doc:DesignDocument,instanceId:string,fallbackProperties:ComponentProperty[]=[]):PropertyRelevance[]{
 let count=0;const index=new Map<string,DesignNode>(),duplicates=new Set<string>();
 for(const page of doc.pages)for(const n of page.nodes){if(++count>100000)return fallbackProperties.slice(0,1000).map(property=>({property,hidden:false,reason:'Visibility inspection limit reached; its control remains visible.'}));if(index.has(n.id))duplicates.add(n.id);index.set(n.id,n);}
 const root=index.get(instanceId),main=root?.type==='instance'?index.get(root.componentId??''):undefined,properties=main?.componentMetadata?.properties??[];
 const uncertain=(reason:string)=>properties.slice(0,1000).map(property=>({property,hidden:false,reason}));
 if(properties.length>1000)return uncertain('Property inspection limit reached; controls remain available.');
 if(!root||!main||duplicates.has(root.id)||duplicates.has(main.id))return uncertain('The component source is unavailable.');
 const targets=new Map<string,DesignNode>(),ambiguous=new Set<string>();targets.set(main.id,root);
 for(const n of index.values())if(n.instanceRootId===root.id&&n.sourceId){if(targets.has(n.sourceId))ambiguous.add(n.sourceId);else targets.set(n.sourceId,n);}
 // Cache effective hidden state in the actual generated hierarchy. A bounded chain
 // refuses uncertain topology rather than guessing that a property is irrelevant.
 const cache=new Map<string,boolean|undefined>();
 const hidden=(id:string):boolean|undefined=>{const path:string[]=[],seen=new Set<string>();let current:string|undefined=id,result:boolean|undefined;
  while(current){if(cache.has(current)){result=cache.get(current);break;}if(path.length>=256||seen.has(current)||duplicates.has(current)){result=undefined;break;}seen.add(current);const n=index.get(current);if(!n){result=undefined;break;}path.push(current);if(!n.visible){result=true;break;}if(n.id===root.id){result=false;break;}current=n.parentId??undefined;if(!current){result=undefined;break;}}
  for(const key of path)cache.set(key,result);return result;
 };
 return properties.map(property=>{const target=targets.get(property.targetId);if(!target||ambiguous.has(property.targetId))return {property,hidden:false,reason:'The property target is unavailable; its control remains visible.'};
  // A Boolean must remain reachable to restore its own hidden target. Outer hidden
  // ancestors still make it irrelevant, until their own Boolean is restored.
  const state=property.type==='boolean'?(target.id===root.id?false:target.parentId?hidden(target.parentId):undefined):hidden(target.id);
  return {property,hidden:main.componentMetadata?.hideIrrelevantProperties===true&&state===true,reason:state===true?'Its target or an outer layer is hidden.':state===undefined?'Visibility could not be resolved; its control remains visible.':''};
 });
}
/** Nested controls follow the outer main's setting: a hidden nested instance has nothing to edit until its own Boolean returns. Inspection limits keep the control visible. */
export function nestedInstanceHidden(doc:DesignDocument,rootId:string,n:DesignNode){const nodes=doc.pages.flatMap(p=>p.nodes);if(nodes.length>100000)return false;const map=new Map(nodes.map(a=>[a.id,a])),main=map.get(map.get(rootId)?.componentId??'');if(main?.componentMetadata?.hideIrrelevantProperties!==true)return false;let at:DesignNode|undefined=n;for(let depth=0;at&&depth<256;depth++){if(at.id===rootId)return false;if(!at.visible)return true;at=map.get(at.parentId??'');}return false;}
export function setHideIrrelevantProperties(doc:DesignDocument,id:string,value:boolean,setId?:string){
 if(typeof value!=='boolean')throw Error('Choose a Boolean component property relevance setting.');
 assertComponentManagerEditable(doc,id,setId);const n=doc.pages.flatMap(p=>p.nodes).find(n=>n.id===id)!;
 if(value)n.componentMetadata={...n.componentMetadata,hideIrrelevantProperties:true};else if(n.componentMetadata)delete n.componentMetadata.hideIrrelevantProperties;
}
