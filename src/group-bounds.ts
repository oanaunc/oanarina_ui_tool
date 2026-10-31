import type {DesignDocument,DesignNode} from './model';
import {planFrameFit} from './frame-actions';
/** Explicit fit of a free group's direct child geometry, retaining child world transforms. */
export function planGroupBounds(nodes:DesignNode[],id:string,doc?:DesignDocument){const g=nodes.find(n=>n.id===id);if(g?.type!=='group'||g.booleanOp)throw Error('Select an ordinary free-layout group.');const temporary=structuredClone(nodes);temporary.find(n=>n.id===id)!.type='frame';const plan=planFrameFit(temporary,id,doc);plan.nodes.find(n=>n.id===id)!.type='group';return plan;}
/** Sections keep a visible box; fitting moves that box and leaves every layer inside where it is. */
export function planSectionFit(nodes:DesignNode[],id:string,doc?:DesignDocument){const g=nodes.find(n=>n.id===id);if(g?.type!=='section')throw Error('Select a section.');const temporary=structuredClone(nodes);temporary.find(n=>n.id===id)!.type='frame';const plan=planFrameFit(temporary,id,doc);plan.nodes.find(n=>n.id===id)!.type='section';return plan;}
