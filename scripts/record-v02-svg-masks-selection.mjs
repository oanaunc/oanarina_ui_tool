import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
// Record this checkpoint only after the referenced validation report has passed.
if(JSON.parse(fs.readFileSync('package.json','utf8')).version!=='0.2.0-dev.4')throw Error('This recorder belongs to v0.2.0-dev.4.');
const features=JSON.parse(fs.readFileSync('public/features.json','utf8'));
const evidence='v0.2.0-dev.4: reachable editing, history/persistence where applicable, core/browser checks and universal Mac build/smoke. See docs/VALIDATION-v0.2-svg-masks-selection.md; exact reference acceptance remains separate.';
function ids(category,indices,status,notes=evidence){for(const i of indices){const id=`UI-${String(category).padStart(2,'0')}-${String(i).padStart(3,'0')}`,f=features.find(f=>f.id===id);if(!f)throw Error('Unknown feature '+id);f.status=status;f.notes=notes;}}
const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>a+i);
ids(60,[...range(1,22),26,27],'implemented',evidence+' Alpha/vector/luminance source modes mask following same-parent siblings until the next mask. Nested vector mode uses opaque geometry; bounds are conservative, and exact Figma nested-composition parity is unverified.');
ids(60,[23,24,25],'planned','Mask outlines view, tree mask/target indicators and hover mode previews remain absent.');
ids(20,[25],'implemented',evidence+' Images participate in alpha/vector/luminance masks, including embedded image transparency and SVG/PNG export.');
ids(20,[5],'partial',evidence+' Reviewed editable SVG layers and sanitized visual fallback are reachable. Full SVG/CSS/filter/mask/clip/typography conformance remains incomplete; see SVG-IMPORT.md.');
ids(7,range(7,11),'implemented',evidence+' Parent-default canvas selection, Command deep selection, double-click descent, Enter/Shift-Enter hierarchy and Tab/Shift-Tab siblings with canvas focus.');
ids(7,range(14,17),'implemented',evidence+' Current-page matching fills/strokes/text/component identity; hidden and inherited-locked nodes excluded. Text matching uses exact base styling and mixed-run intervals.');
ids(7,[21,23,28,29],'implemented',evidence+' Individual and hover outlines follow transformed layer bounds. Right-click Select layer lists hit artwork including obscured and locked layers; concealed mask artwork follows SVG hit-testing semantics.');
ids(8,[20,21,23,25],'implemented',evidence+' Selection reveals and scrolls its ancestor-expanded tree row. Tree uses ARIA selection, arrow navigation, native control activation, contiguous Shift ranges and Command toggles.');
ids(39,[29],'partial',evidence+' SVG import offers validated editable layers with reduction reports or a sanitized visual asset. Paths, common shapes, groups, transforms, supported text/gradients/use and simple clips work. CSS, filters, arbitrary masks/clip paths and full text/paint semantics remain incomplete.');
ids(12,[1,6,12,13],'implemented',evidence+' World-coordinate dragging, oriented single-layer handles, ancestor transforms, subtree scaling and scale keyframes are exercised. Genuine affine skew is rejected atomically; scaled intrinsic dimensions remain visible in the inspector.');
ids(10,[15],'partial','Groups scale their rendered subtree through the existing transform fields. The inspector continues to show intrinsic dimensions; tight child-derived group bounds and full Figma group resize semantics remain incomplete.');
fs.writeFileSync('public/features.json',JSON.stringify(features,null,2)+'\n');
execFileSync(process.execPath,['scripts/inventory.mjs'],{stdio:'inherit'});
