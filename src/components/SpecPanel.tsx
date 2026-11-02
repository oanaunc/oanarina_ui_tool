import {notifyError} from '../files';
import type {DesignNode} from '../model';
import {allBlocks,specMarkdown} from '../spec';
import {useEditor} from '../store';
/** Double-click is the usual way in. This holds what a page offers beyond that: its Markdown, for handing to a person or an agent. */
export default function SpecPanel({n}:{n:DesignNode}){
 const blocks=n.spec?.blocks??[],count=allBlocks(blocks).length,copy=async()=>{try{await navigator.clipboard.writeText(specMarkdown(blocks,{images:true}));useEditor.getState().set({toast:'Spec copied as Markdown'});}catch(e){notifyError(e);}};
 return <section className="inspector-section" data-testid="spec-section"><h3>Spec</h3><p className="inspector-note">{count===1?'1 block':count+' blocks'}. Double-click the page to write. Type / for blocks.</p><div className="button-row"><button className="outline-button" onClick={()=>window.dispatchEvent(new CustomEvent('oanarina-edit-text',{detail:n.id}))}>Edit</button><button className="outline-button" onClick={copy}>Copy as Markdown</button></div></section>;
}
