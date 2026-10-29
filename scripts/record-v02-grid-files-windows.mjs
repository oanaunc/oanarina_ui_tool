import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
if(JSON.parse(fs.readFileSync('package.json','utf8')).version!=='0.2.0-dev.6')throw Error('This recorder belongs to v0.2.0-dev.6.');
const features=JSON.parse(fs.readFileSync('public/features.json','utf8'));
const evidence='v0.2.0-dev.6: reachable workflow with appropriate core/browser/native checks and persistence/undo where applicable. See docs/VALIDATION-v0.2-grid-files-windows.md. Exact Figma reference acceptance remains separate.';
function ids(category,indices,status,notes=evidence){for(const i of indices){const id=`UI-${String(category).padStart(2,'0')}-${String(i).padStart(3,'0')}`,f=features.find(f=>f.id===id);if(!f)throw Error('Unknown feature '+id);f.status=status;f.notes=notes;}}
ids(3,[1,2,4,5,6,7,8,9,11,12,13,16,17,18,20,21,22,23,24,25,27,28,30],'implemented',evidence+' Local browser database files/folders, grid/list, filters/sorting, copies, metadata, archive/Trash/restore and guarded permanent removal. These are local organization workflows, not shared team/cloud storage. See docs/LOCAL-FILES.md.');
ids(25,[4,5,6,7,8,11,12,13,14,15,16,17,18,20,28,30],'implemented',evidence+' Fixed, weighted fractional and hug tracks with limits, cell placement/spans/alignment, implicit rows, nested/component layout and editor-only cell/track overlays. Canvas edge dragging commits one fixed-track edit; bounded sizes/search and remaining differences: docs/GRID-LAYOUT.md.');
ids(25,[3],'partial','Explicit minimum row count preserves empty rows and grows for all objects. Figma fixed-count migration/column creation semantics and deleting rows with their object migration remain unfinished. See docs/GRID-LAYOUT.md.');
ids(24,[28],'partial','Horizontal rows align direct text first-line SVG baselines, with bottom-edge fallback and ascent/descent hug measurement. Nested container baseline extraction and complete native font metric fidelity remain unfinished. See docs/GRID-LAYOUT.md.');
ids(1,[4,21,23],'implemented',evidence+' Native independent WKWebViews route menus/save/export to their own document, guard dirty close with acknowledged Save/Discard/Cancel, and offer saved-file Dock recents. See docs/MAC-WINDOWS.md.');
ids(2,[18],'implemented',evidence+' Native Reopen Closed Window restores the last closed window from its own local recovery identity. Availability depends on browser database retention. See docs/MAC-WINDOWS.md.');
ids(4,[23],'partial','Native titles show document edited state, and the inspector distinguishes pending/saved local recovery. Complete web saved/unsaved/path status UI and cloud sync status are unfinished.');
ids(59,[37],'implemented',evidence+' Native and MCP writers share the exclusive project lock; native saves compare disk SHA-256 and require an explicit choice after external changes. Live renderer synchronization and non-cooperating application locking remain outside this behavior. See docs/MAC-WINDOWS.md and mcp/README.md.');
fs.writeFileSync('public/features.json',JSON.stringify(features,null,2)+'\n');
execFileSync(process.execPath,['scripts/inventory.mjs'],{stdio:'inherit'});
