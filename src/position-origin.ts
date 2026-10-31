import type {DesignNode} from './model';
/** X and Y read from the frame a layer sits in. Groups are transparent, as they are when drawing; a top-level layer reads from the page. */
export function positionOrigin(n:Pick<DesignNode,'parentId'>,nodes:readonly DesignNode[]):{x:number;y:number}{const seen=new Set<string>();let parent=nodes.find(p=>p.id===n.parentId);while(parent&&parent.type==='group'&&!seen.has(parent.id)){seen.add(parent.id);const id:string|null=parent.parentId;parent=nodes.find(p=>p.id===id);}return parent?{x:parent.x,y:parent.y}:{x:0,y:0};}
