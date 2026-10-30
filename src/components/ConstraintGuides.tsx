import {useEditor} from '../store';
import {constraintGuides,constraintParent,useConstraintGuides} from '../constraint-guides';
import type {DesignNode} from '../model';
import {effectiveVisible} from '../model';

export function ConstraintGuideControls({n}:{n:DesignNode}){
 const s=useEditor(),view=useConstraintGuides(),nodes=s.doc.pages.find(p=>p.id===s.pageId)!.nodes,parent=constraintParent(n,nodes);
 if(!parent)return null;
 return <section className="inspector-section" aria-label="Constraint guides"><label className="check-row"><input type="checkbox" checked={view.visible} onChange={e=>view.setVisible(e.currentTarget.checked)}/>Show constraint guides</label><p className="inspector-note">Horizontal: {n.constraintX??'start'} · Vertical: {n.constraintY??'start'}. Guides connect the layout box to {parent.name} in its own axes, before this layer’s rotation. Dashed pairs indicate proportional scaling. View only.</p></section>;
}
export function ConstraintGuideOverlay({nodes,selection,zoom}:{nodes:DesignNode[];selection:string[];zoom:number}){
 const visible=useConstraintGuides(s=>s.visible);if(!visible||selection.length!==1)return null;
 const n=nodes.find(n=>n.id===selection[0]);if(!n||!effectiveVisible(n,nodes))return null;const guides=constraintGuides(n,nodes);if(!guides.length)return null;
 return <g data-constraint-guides={n.id} role="img" aria-label={`Constraints for ${n.name}: horizontal ${n.constraintX??'start'}, vertical ${n.constraintY??'start'}`} pointerEvents="none">{guides.map((g,i)=><g key={i} data-constraint-axis={g.axis} data-constraint-mode={g.mode}><line x1={g.from.x} y1={g.from.y} x2={g.to.x} y2={g.to.y} stroke="#f2a875" strokeWidth={1/zoom} strokeDasharray={g.mode==='scale'?`${4/zoom} ${3/zoom}`:undefined}/><circle cx={g.from.x} cy={g.from.y} r={2.5/zoom} fill="#f2a875"/><circle cx={g.to.x} cy={g.to.y} r={2/zoom} fill="#f2a875"/></g>)}</g>;
}
