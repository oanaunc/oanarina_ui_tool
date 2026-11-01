import type {DesignNode,Page} from './model';
import {plainClone,savedEqual} from './plain-clone';
/** Every edit works on a full copy of the document. Handing back the layers it didn't change is what lets the canvas leave them alone. */
export function shareUnchangedNodes(before:Pick<Page,'id'|'nodes'>[],after:Pick<Page,'id'|'nodes'>[]){
 for(const page of after){const old=before.find(p=>p.id===page.id);if(!old)continue;const known=new Map<string,DesignNode>(old.nodes.map(n=>[n.id,n]));let changed=old.nodes.length!==page.nodes.length;
  for(let i=0;i<page.nodes.length;i++){const was=known.get(page.nodes[i].id);if(was&&savedEqual(was,page.nodes[i]))page.nodes[i]=was;if(old.nodes[i]!==page.nodes[i])changed=true;}
  if(!changed)page.nodes=old.nodes;}
}
/** The layers as they stand right now, for comparing later steps against. Layers still equal to the settled document are shared with it, which nothing writes to, so only what an edit touched is copied. */
export function layerSnapshot<T extends {pages:(Pick<Page,'id'|'nodes'>)[]}>(d:T,known:ReadonlyMap<string,ReadonlyMap<string,DesignNode>>):T{return {...d,pages:d.pages.map(p=>{const old=p.nodes.length?known.get(p.id):undefined;return {...p,nodes:p.nodes.map(n=>{const was=old?.get(n.id);return was&&savedEqual(was,n)?was:plainClone(n);})};})};}
