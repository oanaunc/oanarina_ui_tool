import type {SVGProps} from 'react';

/** Screen-space black surround and white center stay visible over both light and dark artwork.
 * These are editor overlays: neither this module nor its preference enters artwork exports. */
type Common={zoom:number;contrast:boolean};
export function SelectionPolygon({zoom,contrast,...props}:Common&SVGProps<SVGPolygonElement>){
 if(!contrast)return <polygon {...props}/>;
 return <g data-selection-contrast="polygon" pointerEvents="none"><polygon points={props.points} transform={props.transform} fill="none" stroke="#000000" strokeWidth={5/zoom}/><polygon {...props} stroke="#ffffff" strokeOpacity={1} strokeWidth={2/zoom}/></g>;
}
export function SelectionRect({zoom,contrast,...props}:Common&SVGProps<SVGRectElement>){
 if(!contrast)return <rect {...props}/>;
 return <g data-selection-contrast="rect" pointerEvents="none"><rect x={props.x} y={props.y} width={props.width} height={props.height} rx={props.rx} ry={props.ry} transform={props.transform} fill="none" stroke="#000000" strokeWidth={5/zoom}/><rect {...props} stroke="#ffffff" strokeOpacity={1} strokeWidth={2/zoom}/></g>;
}
