import type {DesignNode,Page} from './model';
function same(a:unknown,b:unknown):boolean{
 if(a===b)return true;if(typeof a!=='object'||typeof b!=='object'||a===null||b===null)return false;
 if(Array.isArray(a)){if(!Array.isArray(b)||a.length!==b.length)return false;for(let i=0;i<a.length;i++)if(!same(a[i],b[i]))return false;return true;}
 if(Array.isArray(b))return false;const x=a as Record<string,unknown>,y=b as Record<string,unknown>,keys=Object.keys(x);if(keys.length!==Object.keys(y).length)return false;for(const key of keys)if(!(key in y)||!same(x[key],y[key]))return false;return true;
}
/** Every edit works on a full copy of the document. Handing back the layers it didn't change is what lets the canvas leave them alone. */
export function shareUnchangedNodes(before:Pick<Page,'id'|'nodes'>[],after:Pick<Page,'id'|'nodes'>[]){
 for(const page of after){const old=before.find(p=>p.id===page.id);if(!old)continue;const known=new Map<string,DesignNode>(old.nodes.map(n=>[n.id,n]));let changed=old.nodes.length!==page.nodes.length;
  for(let i=0;i<page.nodes.length;i++){const was=known.get(page.nodes[i].id);if(was&&same(was,page.nodes[i]))page.nodes[i]=was;if(old.nodes[i]!==page.nodes[i])changed=true;}
  if(!changed)page.nodes=old.nodes;}
}
