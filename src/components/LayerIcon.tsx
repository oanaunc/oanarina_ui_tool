import {ArrowUpRight,Braces,Circle,Columns3,Combine,Component,Diamond,FileText,Frame,Group,Hexagon,Image,Minus,Rows3,Scan,Spline,Square,SquareDashed,Star,Type} from 'lucide-react';
import type {DesignNode} from '../model';
import {isComponentLayer} from '../canvas-chrome';
const byType:Partial<Record<DesignNode['type'],typeof Square>>={text:Type,code:Braces,spec:FileText,component:Component,instance:Diamond,group:Group,section:SquareDashed,ellipse:Circle,line:Minus,arrow:ArrowUpRight,polygon:Hexagon,star:Star,path:Spline,slice:Scan};
/** One shape per layer kind, so the tree reads at a glance: auto layout shows its direction, image fills read as images. */
function iconFor(n:DesignNode){if(n.booleanOp)return Combine;if(n.type==='frame'&&n.layout==='vertical')return Rows3;if(n.type==='frame'&&n.layout!=='none')return Columns3;if(n.type==='image'||n.paints?.some(p=>p.type==='image'))return Image;return byType[n.type]??(n.type==='frame'?Frame:Square);}
export default function LayerIcon({n}:{n:DesignNode}){const Icon=iconFor(n);return <Icon size={13} aria-hidden="true" className={isComponentLayer(n)?'purple':''}/>;}
