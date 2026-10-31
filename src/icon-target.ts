import {isLocked} from './model';
import type {DesignDocument} from './model';
import {backdropColor,relativeLuminance} from './text-defaults';
/** One unlocked selected frame receives the icon; anything else keeps the page root. The starting color always shows against what is behind it. */
export function iconInsertTarget(doc:DesignDocument,pageId:string,selection:readonly string[],theme:string){const page=doc.pages.find(p=>p.id===pageId),nodes=page?.nodes??[],n=selection.length===1?nodes.find(v=>v.id===selection[0]):undefined,frame=n&&['frame','section','component'].includes(n.type)&&!n.instanceRootId&&!isLocked(n,nodes)?n:undefined,backdrop=page?backdropColor(frame,nodes,page,theme):'#ffffff';return {frame:frame?.id,x:frame?frame.x+16:80,y:frame?frame.y+16:80,color:relativeLuminance(backdrop)<.18?'#f4f2f8':'#292631'};}
