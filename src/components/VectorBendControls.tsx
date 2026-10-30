import type {DesignNode} from '../model';
import {useVectorBend} from '../vector-bend';
import {notifyError} from '../files';

export default function VectorBendControls({n}:{n:DesignNode}){const view=useVectorBend(),active=view.context?.id===n.id;return <><button className="outline-button" aria-pressed={active} onClick={()=>{try{if(active)view.reset();else view.activate(n.id);document.querySelector<SVGSVGElement>('#forma-design-canvas')?.focus({preventScroll:true});}catch(error){notifyError(error);}}}>Bend segments</button><p className="inspector-note">Enable Bend, then drag a segment or its round midpoint to curve it. Anchors stay fixed; its two tangent handles become independent. Control makes movement 10× finer. Escape cancels the current drag and leaves Bend.</p></>;}
