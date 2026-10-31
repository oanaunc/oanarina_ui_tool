import type {DesignNode} from './model';
import {identity,multiply,nodeMatrix,inverseMatrix} from './transforms';
import type {Matrix} from './transforms';
/** One cached hierarchy walk per path; never rebuild it per vertex or cubic control. */
export function networkMatrix(n:DesignNode,lookup:Map<string,DesignNode>):Matrix {
 const lineage:DesignNode[]=[],seen=new Set<string>();let owner:DesignNode|undefined=n;
 while(owner){if(seen.has(owner.id)||lineage.length>=64)throw Error('Vector networks support at most 64 acyclic layers in their hierarchy.');seen.add(owner.id);lineage.unshift(owner);if(owner.parentId&&!lookup.has(owner.parentId))throw Error('A vector network ancestor is missing.');owner=owner.parentId?lookup.get(owner.parentId):undefined;}
 let matrix:Matrix=identity;for(let i=0;i<lineage.length;i++)matrix=multiply(matrix,nodeMatrix(lineage[i],lineage[i-1]));const result=multiply(matrix,[n.width/(n.pathWidth??n.width),0,0,n.height/(n.pathHeight??n.height),0,0]);
 if(result.some(v=>!Number.isFinite(v)))throw Error('The vector network transform is not finite.');inverseMatrix(result);return result;
}
