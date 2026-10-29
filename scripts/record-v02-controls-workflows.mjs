import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
// Apply this checkpoint only after its validation report is complete.
if(JSON.parse(fs.readFileSync('package.json','utf8')).version!=='0.2.0-dev.5')throw Error('This recorder belongs to v0.2.0-dev.5.');
const features=JSON.parse(fs.readFileSync('public/features.json','utf8'));
const evidence='v0.2.0-dev.5: reachable controls with core/browser validation, undo/persistence where applicable, universal Mac build and native smoke. See docs/VALIDATION-v0.2-controls-workflows.md. Exact Figma reference acceptance remains separate.';
function ids(category,indices,status,notes=evidence){for(const i of indices){const id=`UI-${String(category).padStart(2,'0')}-${String(i).padStart(3,'0')}`,f=features.find(f=>f.id===id);if(!f)throw Error('Unknown feature '+id);f.status=status;f.notes=notes;}}
ids(8,[4,5,7,9,17,18,19,22],'implemented',evidence+' Current-page drag placement preserves supported world transforms, rejects managed/locked/cyclic moves, and commits atomically. Type filtering retains ancestors; batch rename previews literal replacement and {name}/{n} templates.');
ids(12,[5,10,11,16,18,40,41],'implemented',evidence+' Per-node ratio locks and limits, Option center resizing, continuous rotation handles, Shift rotation snapping and parent-axis alignment. Genuine affine skew is rejected; intrinsic scale normalization remains unfinished.');
ids(42,[1,2,3,4,8,9,10,11,28],'implemented',evidence+' Palette searches registered commands and all current drawing/navigation tool actions, with categories/aliases, keyboard active results, shortcut labels and the last 20 distinct command IDs. External plugin/widget/library search remains absent.');
ids(42,[20,22,23,24],'implemented',evidence+' Accessible layer arrows and canvas-focused Enter/Shift-Enter/Tab/Shift-Tab. Inputs retain native keyboard behavior.');
ids(45,[6,7,8,9,10,11,20,21,29,30,31,32,34,39,47,48],'implemented',evidence+' Validated versioned local preferences affect drawing, small/large nudges, rotation increment, tool retention, outlines/dimensions, wheel zoom/sensitivity/inversion and right-button pan; preferences stay outside project history.');
ids(45,[22],'partial','Two-finger panning and modifier/wheel zoom work through shared wheel events. Separate hardware/device gesture customization and physical trackpad acceptance remain incomplete.');
ids(24,[33],'partial','General layer-tree drag ordering and insertion is implemented. Dedicated auto-layout insertion previews, gap targets and full auto-layout-specific reference acceptance remain incomplete.');
ids(54,[17],'implemented',evidence+' Batch rename shows every resulting name and validates the complete selection before a single edit.');
ids(1,[16],'partial','Native Application Preferences and Command-comma open working local drawing/navigation settings. Full Figma settings parity and system theme/scale/notification/helper controls remain incomplete.');
fs.writeFileSync('public/features.json',JSON.stringify(features,null,2)+'\n');
execFileSync(process.execPath,['scripts/inventory.mjs'],{stdio:'inherit'});
